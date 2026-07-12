# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

class AssetCategory(models.Model):
    """
    AssetCategory
    
    Represents the grouping configuration for assets (e.g., Electronics, Furniture, Rooms).
    Maintains shared classification properties and validation rules across the system.
    """
    _name = 'assetflow.category'
    _description = 'Asset Category'
    _order = 'name'

    name = fields.Char(string='Category Name', required=True, index=True)
    code = fields.Char(string='Category Code', required=True, index=True)
    status = fields.Selection([
        ('active', 'Active'),
        ('inactive', 'Inactive')
    ], string='Status', default='active', required=True)

    _sql_constraints = [
        ('code_unique', 'unique(code)', 'The category code must be unique across the organization.')
    ]


class Asset(models.Model):
    """
    Asset
    
    Manages the central hardware registry, facility records, and bookable resource states.
    Handles asset metadata, conditions, lifecycle tracking, and historical relationships.
    """
    _name = 'assetflow.asset'
    _description = 'Asset Registry'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'tag desc'

    name = fields.Char(string='Asset Name', required=True, tracking=True, index=True)
    category_id = fields.Many2one('assetflow.category', string='Category', required=True, tracking=True, index=True)
    tag = fields.Char(string='Asset Tag', required=True, readonly=True, default='New', copy=False, index=True)
    serial_no = fields.Char(string='Serial Number', tracking=True, index=True)
    acquisition_date = fields.Date(string='Acquisition Date', default=fields.Date.context_today)
    acquisition_cost = fields.Float(string='Acquisition Cost', default=0.0)
    condition = fields.Selection([
        ('new', 'New'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
        ('damaged', 'Damaged')
    ], string='Condition', default='new', tracking=True, required=True)
    location = fields.Char(string='Physical Location', tracking=True)
    is_shared = fields.Boolean(string='Shared / Bookable', default=False, tracking=True)
    state = fields.Selection([
        ('available', 'Available'),
        ('allocated', 'Allocated'),
        ('reserved', 'Reserved'),
        ('maintenance', 'Under Maintenance'),
        ('lost', 'Lost'),
        ('retired', 'Retired'),
        ('disposed', 'Disposed')
    ], string='Lifecycle Status', default='available', tracking=True, required=True)
    image = fields.Binary(string='Photo')
    document_ids = fields.Many2many('ir.attachment', string='Documents / Manuals')
    
    # Relationships
    allocation_ids = fields.One2many('assetflow.allocation', 'asset_id', string='Allocations')
    maintenance_ids = fields.One2many('assetflow.maintenance', 'asset_id', string='Maintenance Requests')
    booking_ids = fields.One2many('assetflow.booking', 'asset_id', string='Bookings')
    
    # Current Custodian details computed from active allocations
    current_holder_id = fields.Many2one(
        'hr.employee', 
        string='Current Custodian', 
        compute='_compute_current_custodian', 
        store=True, 
        index=True
    )
    current_department_id = fields.Many2one(
        'hr.department', 
        string='Current Department', 
        compute='_compute_current_custodian', 
        store=True, 
        index=True
    )

    _sql_constraints = [
        ('tag_unique', 'unique(tag)', 'The Asset Tag must be unique across the entire organization.')
    ]

    @api.depends('allocation_ids', 'allocation_ids.state', 'allocation_ids.employee_id', 'allocation_ids.department_id')
    def _compute_current_custodian(self):
        """
        _compute_current_custodian
        
        Calculates the active custodian (Employee) and department of the asset based on the
        state of its allocation records. If an allocation is marked 'approved', the system 
        computes these fields.
        
        @returns None. Updates computed fields current_holder_id and current_department_id in-place.
        @validates Checks for active 'approved' allocations.
        @edge-cases If multiple approved allocations exist (should be blocked by validation), 
                    uses the latest created record. If none exist, sets fields to False.
        """
        for record in self:
            active_allocation = record.allocation_ids.filtered(lambda a: a.state == 'approved')
            if active_allocation:
                latest_alloc = active_allocation[-1]
                record.current_holder_id = latest_alloc.employee_id
                record.current_department_id = latest_alloc.department_id
            else:
                record.current_holder_id = False
                record.current_department_id = False

    @api.model_create_multi
    def create(self, vals_list):
        """
        create
        
        Overrides Odoo base create to automatically pull the next available sequence code 
        from the 'assetflow.asset.tag' sequence definition, ensuring unique structured asset codes.
        
        @param  {list} vals_list - List of dictionary payloads containing fields for new records.
        @returns {Recordset} - Newly created asset records.
        @validates Verifies uniqueness of auto-generated tag via SQL constraint.
        @edge-cases Defaults tag value to 'New' if sequence lookup fails.
        """
        for vals in vals_list:
            if vals.get('tag', 'New') == 'New':
                vals['tag'] = self.env['ir.sequence'].next_by_code('assetflow.asset.tag') or 'New'
        return super(Asset, self).create(vals_list)
