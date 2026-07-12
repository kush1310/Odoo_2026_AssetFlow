# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

class AssetAllocation(models.Model):
    """
    AssetAllocation
    
    Governs the assignment workflow of assets to employees or departments.
    Handles allocation status transitions and prevents multiple concurrent assignments.
    """
    _name = 'assetflow.allocation'
    _description = 'Asset Allocation'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'id desc'

    asset_id = fields.Many2one('assetflow.asset', string='Asset', required=True, tracking=True, index=True)
    employee_id = fields.Many2one('hr.employee', string='Custodian', required=True, tracking=True, index=True)
    department_id = fields.Many2one('hr.department', string='Department', compute='_compute_department', store=True, readonly=False, tracking=True)
    expected_return_date = fields.Date(string='Expected Return Date', tracking=True)
    actual_return_date = fields.Date(string='Actual Return Date', readonly=True, tracking=True)
    notes = fields.Text(string='Condition Notes')
    state = fields.Selection([
        ('draft', 'Draft'),
        ('requested', 'Requested'),
        ('approved', 'Active Allocation'),
        ('returned', 'Returned'),
        ('overdue', 'Overdue')
    ], string='Status', default='draft', tracking=True, required=True)

    @api.depends('employee_id')
    def _compute_department(self):
        """
        _compute_department
        
        Computes and syncs the default department based on the selected employee's record.
        
        @returns None. Updates department_id field in-place.
        @validates None.
        @edge-cases Sets department_id to False if no employee is selected.
        """
        for record in self:
            if record.employee_id:
                record.department_id = record.employee_id.department_id
            else:
                record.department_id = False

    def action_request(self):
        """
        action_request
        
        Submits the allocation record for approval, moving its state from draft to requested.
        
        @returns True.
        @validates Verifies record exists.
        @edge-cases Transitions from draft to requested state.
        """
        for record in self:
            record.write({'state': 'requested'})
        return True

    def action_approve(self):
        """
        action_approve
        
        Approves the allocation request. Prevents double-allocation by verifying that the asset 
        is currently in the 'available' state. Transitions the asset's lifecycle status to 'allocated'.
        
        @returns True.
        @validates Checks that asset state is 'available'. If not, raises a ValidationError indicating
                   which employee currently holds the asset and blocks approval.
        @edge-cases Handles assets that are under maintenance, lost, or already allocated.
        """
        for record in self:
            asset = record.asset_id
            # Acquire database lock to prevent race conditions during concurrent approval processes
            self.env.cr.execute("SELECT id, state FROM assetflow_asset WHERE id = %s FOR UPDATE", (asset.id,))
            
            if asset.state != 'available':
                current_custodian = asset.current_holder_id.name or _("another user")
                raise ValidationError(_(
                    "The asset '%s' is not available. It is currently held by %s (Status: %s)."
                ) % (asset.name, current_custodian, dict(asset._fields['state'].selection).get(asset.state)))
            
            record.write({'state': 'approved'})
            asset.write({'state': 'allocated'})
        return True

    def action_return(self):
        """
        action_return
        
        Marks the asset as returned, sets the return timestamp, and reverts the asset status 
        back to 'available'.
        
        @returns True.
        @validates None.
        @edge-cases Sets actual_return_date to the current calendar date and frees the asset.
        """
        for record in self:
            record.write({
                'state': 'returned',
                'actual_return_date': fields.Date.context_today(record)
            })
            record.asset_id.write({'state': 'available'})
        return True

    @api.model
    def check_overdue_allocations(self):
        """
        check_overdue_allocations
        
        Cron job method running daily. Finds active approved allocations where the expected 
        return date has passed, updates their status to 'overdue', and logs activity notifications
        for the assigned manager.
        
        @returns None.
        @validates Checks expected_return_date against current date.
        @edge-cases Skips records without an expected return date set.
        """
        today = fields.Date.context_today(self)
        overdue_records = self.search([
            ('state', '=', 'approved'),
            ('expected_return_date', '<', today)
        ])
        for record in overdue_records:
            record.write({'state': 'overdue'})
            # Create a notification activity for the asset creator/manager
            record.activity_schedule(
                'mail.mail_activity_data_todo',
                note=_("Asset allocation for '%s' is overdue. Expected return was %s.") % (record.asset_id.name, record.expected_return_date),
                user_id=self.env.user.id
            )


class AssetTransfer(models.Model):
    """
    AssetTransfer
    
    Facilitates the direct custodian transition of assets between employees.
    Automatically handles closing old allocations and initiating new ones upon approval.
    """
    _name = 'assetflow.transfer'
    _description = 'Asset Transfer Request'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'id desc'

    asset_id = fields.Many2one('assetflow.asset', string='Asset', required=True, tracking=True, index=True)
    source_holder_id = fields.Many2one(
        'hr.employee', 
        string='Current Holder', 
        compute='_compute_source_holder', 
        store=True, 
        index=True
    )
    target_holder_id = fields.Many2one('hr.employee', string='Recipient', required=True, tracking=True, index=True)
    manager_id = fields.Many2one('hr.employee', string='Approving Manager', tracking=True)
    state = fields.Selection([
        ('requested', 'Transfer Requested'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    ], string='Status', default='requested', tracking=True, required=True)

    @api.depends('asset_id', 'asset_id.current_holder_id')
    def _compute_source_holder(self):
        """
        _compute_source_holder
        
        Dynamically fetches and stores the current custodian employee of the selected asset.
        
        @returns None. Updates source_holder_id in-place.
        @validates None.
        @edge-cases Sets field to False if the asset has no active custodian.
        """
        for record in self:
            record.source_holder_id = record.asset_id.current_holder_id

    def action_approve(self):
        """
        action_approve
        
        Approves the transfer request. Locates and closes the active allocation of the current 
        holder, creates a new approved allocation for the recipient, and logs audit notifications.
        
        @returns True.
        @validates Verifies the asset has an active approved allocation. If not, raises a ValidationError.
        @edge-cases Automatically closes the source allocation even if it was flagged as overdue.
        """
        for record in self:
            asset = record.asset_id
            
            # 1. Close current active allocation
            active_allocations = self.env['assetflow.allocation'].search([
                ('asset_id', '=', asset.id),
                ('state', 'in', ['approved', 'overdue'])
            ])
            if not active_allocations:
                raise ValidationError(_("This asset does not have an active allocation to transfer."))
            
            # Close all active ones just in case
            active_allocations.write({
                'state': 'returned',
                'actual_return_date': fields.Date.context_today(record),
                'notes': _("Closed via Transfer Request ID: %s") % (record.id,)
            })

            # 2. Create new allocation for target employee
            new_allocation = self.env['assetflow.allocation'].create({
                'asset_id': asset.id,
                'employee_id': record.target_holder_id.id,
                'state': 'approved',
                'notes': _("Allocated via Transfer Request ID: %s") % (record.id,)
            })

            # 3. Update asset state and transfer state
            asset.write({'state': 'allocated'})
            record.write({'state': 'approved'})

            # Log tracking activity
            record.message_post(body=_("Transfer approved. Asset transferred to %s.") % (record.target_holder_id.name,))
        return True

    def action_reject(self):
        """
        action_reject
        
        Rejects the transfer request, moving its state to rejected.
        
        @returns True.
        @validates None.
        @edge-cases Transitions state to rejected.
        """
        for record in self:
            record.write({'state': 'rejected'})
        return True
