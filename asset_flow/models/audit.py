# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

class AssetAuditCycle(models.Model):
    """
    AssetAuditCycle
    
    Coordinates periodic asset audits. Dynamically populates audit lines based on scope,
    guides verification progress, and automatically resolves discrepancies (e.g., marking 
    missing items as Lost) upon closure.
    """
    _name = 'assetflow.audit.cycle'
    _description = 'Asset Audit Cycle'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'id desc'

    name = fields.Char(string='Audit Name', required=True, tracking=True)
    scope_department_id = fields.Many2one('hr.department', string='Scope Department', tracking=True)
    scope_location = fields.Char(string='Scope Location', tracking=True)
    start_date = fields.Date(string='Start Date', default=fields.Date.context_today, required=True, tracking=True)
    end_date = fields.Date(string='End Date', tracking=True)
    auditor_ids = fields.Many2many('res.users', string='Assigned Auditors', required=True, tracking=True)
    line_ids = fields.One2many('assetflow.audit.line', 'cycle_id', string='Audit Lines', copy=True)
    state = fields.Selection([
        ('draft', 'Draft'),
        ('active', 'In Progress'),
        ('closed', 'Closed & Applied')
    ], string='Status', default='draft', tracking=True, required=True)

    def action_start(self):
        """
        action_start
        
        Transitions the audit cycle to 'active'. Dynamically queries the asset registry 
        based on the defined department and location scope, and creates verification lines 
        for each matching asset.
        
        @returns True.
        @validates Verifies that target assets exist matching the scope parameters.
        @edge-cases If no scope filters are set, includes all active assets in the organization.
        """
        for record in self:
            domain = [('state', 'not in', ['retired', 'disposed'])]
            if record.scope_department_id:
                domain.append(('current_department_id', '=', record.scope_department_id.id))
            if record.scope_location:
                domain.append(('location', 'ilike', record.scope_location))
            
            assets_to_audit = self.env['assetflow.asset'].search(domain)
            if not assets_to_audit:
                raise ValidationError(_("No active assets found matching the specified audit scope."))

            # Clear any old lines first
            record.line_ids.unlink()

            # Create lines
            lines_vals = []
            for asset in assets_to_audit:
                lines_vals.append({
                    'cycle_id': record.id,
                    'asset_id': asset.id,
                    'expected_holder_id': asset.current_holder_id.id if asset.current_holder_id else False,
                    'expected_location': asset.location or '',
                    'status': 'pending'
                })
            self.env['assetflow.audit.line'].create(lines_vals)
            record.write({'state': 'active'})
            record.message_post(body=_("Audit cycle started. %s asset lines generated for verification.") % (len(lines_vals),))
        return True

    def action_close(self):
        """
        action_close
        
        Closes the active audit cycle. Iterates through all lines:
        - If an asset is marked 'missing', its registry state flips to 'lost'.
        - If an asset is marked 'damaged', its registry condition flips to 'damaged'.
        Locks the cycle from further modifications.
        
        @returns True.
        @validates Verifies that all lines have been audited (cannot close with pending lines).
        @edge-cases Raises validation error if any asset line is still in 'pending' status.
        """
        for record in self:
            pending_lines = record.line_ids.filtered(lambda l: l.status == 'pending')
            if pending_lines:
                raise ValidationError(_("Cannot close audit cycle. There are still %s asset lines pending verification.") % (len(pending_lines),))

            # Apply discrepancies
            for line in record.line_ids:
                asset = line.asset_id
                if line.status == 'missing':
                    asset.write({'state': 'lost'})
                    asset.message_post(body=_("Audit Cycle '%s' marked this asset as missing. Status updated to Lost.") % (record.name,))
                elif line.status == 'damaged':
                    asset.write({'condition': 'damaged'})
                    asset.message_post(body=_("Audit Cycle '%s' marked this asset as damaged. Condition updated to Damaged.") % (record.name,))

            record.write({'state': 'closed'})
            record.message_post(body=_("Audit cycle closed successfully. All discrepancies applied to the asset registry."))
        return True


class AssetAuditLine(models.Model):
    """
    AssetAuditLine
    
    A single verification item within an audit cycle, representing an asset that must
    be visually checked and signed off by an auditor.
    """
    _name = 'assetflow.audit.line'
    _description = 'Asset Audit Line'
    _order = 'id asc'

    cycle_id = fields.Many2one('assetflow.audit.cycle', string='Audit Cycle', required=True, ondelete='cascade')
    asset_id = fields.Many2one('assetflow.asset', string='Asset', required=True, ondelete='restrict')
    expected_holder_id = fields.Many2one('hr.employee', string='Expected Custodian', readonly=True)
    expected_location = fields.Char(string='Expected Location', readonly=True)
    status = fields.Selection([
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('missing', 'Missing'),
        ('damaged', 'Damaged')
    ], string='Verification Status', default='pending', required=True)
    notes = fields.Text(string='Auditor Comments')
    
    # Read-only state helper mirroring parent cycle status
    cycle_state = fields.Selection(related='cycle_id.state', string='Cycle Status', readonly=True)
