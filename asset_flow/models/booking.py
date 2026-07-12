# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

class ResourceBooking(models.Model):
    """
    ResourceBooking
    
    Coordinates the reservation calendar for shared assets (rooms, vehicles, projectors).
    Performs rigid overlap checks and automatic state updates during booking execution.
    """
    _name = 'assetflow.booking'
    _description = 'Resource Booking'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'start_time desc'

    name = fields.Char(string='Purpose', required=True, tracking=True)
    asset_id = fields.Many2one(
        'assetflow.asset', 
        string='Resource', 
        required=True, 
        domain=[('is_shared', '=', True), ('state', 'not in', ['lost', 'retired', 'disposed'])],
        tracking=True, 
        index=True
    )
    user_id = fields.Many2one('res.users', string='Booked By', default=lambda self: self.env.user, required=True, tracking=True, index=True)
    employee_id = fields.Many2one(
        'hr.employee', 
        string='Custodian / Employee', 
        compute='_compute_employee', 
        store=True, 
        index=True
    )
    start_time = fields.Datetime(string='Start Date & Time', required=True, tracking=True, index=True)
    end_time = fields.Datetime(string='End Date & Time', required=True, tracking=True, index=True)
    state = fields.Selection([
        ('upcoming', 'Upcoming'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ], string='Status', default='upcoming', tracking=True, required=True)

    @api.depends('user_id')
    def _compute_employee(self):
        """
        _compute_employee
        
        Calculates and maps the employee record associated with the Odoo system user who 
        requested the booking.
        
        @returns None. Updates employee_id in-place.
        @validates None.
        @edge-cases Sets field to False if user_id has no linked hr.employee.
        """
        for record in self:
            employee = self.env['hr.employee'].search([('user_id', '=', record.user_id.id)], limit=1)
            record.employee_id = employee if employee else False

    @api.constrains('start_time', 'end_time', 'asset_id')
    def _check_booking_integrity(self):
        """
        _check_booking_integrity
        
        Validates booking date ranges and ensures that no concurrent bookings overlap for 
        the same resource asset.
        
        @returns None. Raises ValidationError if bounds are invalid or overlap is detected.
        @validates Checks that start_time is before end_time and queries database for overlap.
        @edge-cases Handles boundary checks (e.g. Booking B starting exactly when Booking A ends is allowed).
        """
        for record in self:
            if record.start_time >= record.end_time:
                raise ValidationError(_("The booking end date/time must be strictly after the start date/time."))

            # Prevent reservation conflicts for active (non-cancelled) bookings
            overlapping_slots = self.search([
                ('id', '!=', record.id),
                ('asset_id', '=', record.asset_id.id),
                ('state', 'in', ['upcoming', 'ongoing']),
                ('start_time', '<', record.end_time),
                ('end_time', '>', record.start_time)
            ])
            if overlapping_slots:
                conflict = overlapping_slots[0]
                raise ValidationError(_(
                    "Resource allocation conflict! The resource '%s' is already booked for '%s' between %s and %s."
                ) % (record.asset_id.name, conflict.name, conflict.start_time, conflict.end_time))

    def action_complete(self):
        """
        action_complete
        
        Manually marks the booking status as completed.
        
        @returns True.
        @validates None.
        @edge-cases Moves state to completed.
        """
        for record in self:
            record.write({'state': 'completed'})
        return True

    def action_cancel(self):
        """
        action_cancel
        
        Cancels the active booking slot.
        
        @returns True.
        @validates None.
        @edge-cases Transitions booking state to cancelled.
        """
        for record in self:
            record.write({'state': 'cancelled'})
        return True

    @api.model
    def update_booking_states(self):
        """
        update_booking_states
        
        Cron job method executed periodically (every 5-15 mins). Updates lifecycle states
        from 'upcoming' to 'ongoing' and from 'ongoing' to 'completed' based on system time.
        
        @returns None.
        @validates Compares current datetime with record start/end time.
        @edge-cases Skips cancelled bookings.
        """
        now = fields.Datetime.now()
        
        # Start upcoming bookings
        upcoming_to_start = self.search([
            ('state', '=', 'upcoming'),
            ('start_time', '<=', now)
        ])
        upcoming_to_start.write({'state': 'ongoing'})

        # End ongoing bookings
        ongoing_to_end = self.search([
            ('state', '=', 'ongoing'),
            ('end_time', '<=', now)
        ])
        ongoing_to_end.write({'state': 'completed'})
