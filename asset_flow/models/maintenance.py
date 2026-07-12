# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

class AssetMaintenance(models.Model):
    """
    AssetMaintenance
    
    Manages the Kanban repair pipeline for physical assets.
    Approvals automatically transition the asset state to 'maintenance' (locking it out),
    and resolution resets the asset to 'available'.
    """
    _name = 'assetflow.maintenance'
    _description = 'Asset Maintenance'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'priority desc, id desc'

    name = fields.Char(string='Issue Summary', required=True, tracking=True)
    asset_id = fields.Many2one('assetflow.asset', string='Asset to Repair', required=True, tracking=True, index=True)
    description = fields.Text(string='Description of Failure')
    priority = fields.Selection([
        ('0', 'Low'),
        ('1', 'Medium'),
        ('2', 'High')
    ], string='Priority', default='0', required=True, index=True, tracking=True)
    technician_id = fields.Many2one('hr.employee', string='Assigned Technician', tracking=True, index=True)
    photo = fields.Binary(string='Failure Photo Proof')
    state = fields.Selection([
        ('pending', 'Pending Approval'),
        ('approved', 'Approved / In Queue'),
        ('assigned', 'Technician Assigned'),
        ('progress', 'Repair In Progress'),
        ('resolved', 'Resolved'),
        ('rejected', 'Rejected')
    ], string='Status', default='pending', tracking=True, required=True)

    def action_approve(self):
        """
        action_approve
        
        Approves the maintenance ticket. Moves the ticket state to 'approved' and transitions 
        the linked asset's status to 'maintenance', preventing allocations and dispatches.
        
        @returns True.
        @validates Checks if the asset is already in a state that prevents maintenance (like retired/disposed).
        @edge-cases If the asset is currently allocated, this workflow overrides and shifts its state.
        """
        for record in self:
            asset = record.asset_id
            if asset.state in ['retired', 'disposed']:
                raise ValidationError(_("Cannot approve maintenance on a retired or disposed asset."))
            
            record.write({'state': 'approved'})
            asset.write({'state': 'maintenance'})
            
            # Post message to asset chatter
            asset.message_post(body=_("Maintenance request approved. Asset moved to Under Maintenance status (Ticket: %s).") % (record.name,))
        return True

    def action_assign(self):
        """
        action_assign
        
        Transitions the ticket status to 'assigned'.
        
        @returns True.
        @validates Verifies a technician is selected.
        @edge-cases Raises validation error if technician_id is missing.
        """
        for record in self:
            if not record.technician_id:
                raise ValidationError(_("Please select an Assigned Technician before moving to this stage."))
            record.write({'state': 'assigned'})
        return True

    def action_start(self):
        """
        action_start
        
        Marks the repair work as in progress.
        
        @returns True.
        @validates None.
        @edge-cases Transitions ticket state to progress.
        """
        for record in self:
            record.write({'state': 'progress'})
        return True

    def action_resolve(self):
        """
        action_resolve
        
        Marks the maintenance ticket as resolved, restoring the associated asset's lifecycle
        status back to 'available'.
        
        @returns True.
        @validates None.
        @edge-cases Automatically frees up the asset for future bookings and allocations.
        """
        for record in self:
            record.write({'state': 'resolved'})
            record.asset_id.write({'state': 'available'})
            
            # Post message to asset chatter
            record.asset_id.message_post(body=_("Maintenance completed successfully. Asset returned to Available status."))
        return True

    def action_reject(self):
        """
        action_reject
        
        Rejects the maintenance ticket and resets the asset state to 'available' if it was 
        previously moved to maintenance.
        
        @returns True.
        @validates None.
        @edge-cases Restores asset status back to available.
        """
        for record in self:
            record.write({'state': 'rejected'})
            if record.asset_id.state == 'maintenance':
                record.asset_id.write({'state': 'available'})
        return True
