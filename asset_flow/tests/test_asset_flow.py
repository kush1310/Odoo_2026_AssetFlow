# -*- coding: utf-8 -*-
from odoo.tests.common import TransactionCase
from odoo.exceptions import ValidationError
from odoo import fields
from datetime import datetime, timedelta

class TestAssetFlow(TransactionCase):
    """
    TestAssetFlow
    
    Automated test suite validating database constraints, state transitions,
    custody transfers, calendar overlap validations, and audit discrepancy updates.
    """

    @classmethod
    def setUpClass(cls):
        """
        setUpClass
        
        Initializes test master data, creating category definitions, employee directory,
        hardware registry, and shared bookable spaces.
        """
        super(TestAssetFlow, cls).setUpClass()
        
        # 1. Create categories
        cls.category_laptops = cls.env['assetflow.category'].create({
            'name': 'Laptops',
            'code': 'LAP'
        })
        cls.category_rooms = cls.env['assetflow.category'].create({
            'name': 'Meeting Rooms',
            'code': 'ROM'
        })

        # 2. Create employees (custodians)
        cls.employee_priya = cls.env['hr.employee'].create({
            'name': 'Priya Patel',
            'work_email': 'priya@example.com'
        })
        cls.employee_raj = cls.env['hr.employee'].create({
            'name': 'Raj Sharma',
            'work_email': 'raj@example.com'
        })
        cls.employee_tech = cls.env['hr.employee'].create({
            'name': 'Technician Tom',
            'work_email': 'tom@example.com'
        })

        # 3. Create assets
        cls.asset_laptop = cls.env['assetflow.asset'].create({
            'name': 'ThinkPad X1 Carbon',
            'category_id': cls.category_laptops.id,
            'serial_no': 'SN-TPX1-0114',
            'acquisition_cost': 1500.0,
            'is_shared': False
        })
        cls.asset_room = cls.env['assetflow.asset'].create({
            'name': 'Boardroom B2',
            'category_id': cls.category_rooms.id,
            'is_shared': True
        })

    def test_01_allocation_and_conflict_handling(self):
        """
        test_01_allocation_and_conflict_handling
        
        Verifies that an asset is successfully allocated to an employee, and checks that
        attempting to allocate the same asset to a second employee concurrently is blocked
        at the database transaction layer.
        """
        # Create draft allocation for Priya
        alloc_priya = self.env['assetflow.allocation'].create({
            'asset_id': self.asset_laptop.id,
            'employee_id': self.employee_priya.id,
            'expected_return_date': fields.Date.today() + timedelta(days=30)
        })
        
        # Verify initial states
        self.assertEqual(alloc_priya.state, 'draft')
        self.assertEqual(self.asset_laptop.state, 'available')
        
        # Approve allocation
        alloc_priya.action_request()
        alloc_priya.action_approve()
        
        # Verify state changes
        self.assertEqual(alloc_priya.state, 'approved')
        self.assertEqual(self.asset_laptop.state, 'allocated')
        self.assertEqual(self.asset_laptop.current_holder_id, self.employee_priya)

        # Try to allocate same laptop to Raj - should raise ValidationError
        alloc_raj = self.env['assetflow.allocation'].create({
            'asset_id': self.asset_laptop.id,
            'employee_id': self.employee_raj.id
        })
        alloc_raj.action_request()
        
        with self.assertRaises(ValidationError, msg="System failed to block double allocation of the same asset."):
            alloc_raj.action_approve()

    def test_02_custody_transfer_workflow(self):
        """
        test_02_custody_transfer_workflow
        
        Validates the transfer request pipeline. When a transfer is approved:
        - The old active allocation is closed (marked returned).
        - A new approved allocation is created for the recipient.
        - Custody properties are updated correctly.
        """
        # Allocate to Priya first
        alloc_priya = self.env['assetflow.allocation'].create({
            'asset_id': self.asset_laptop.id,
            'employee_id': self.employee_priya.id
        })
        alloc_priya.action_request()
        alloc_priya.action_approve()
        self.assertEqual(self.asset_laptop.current_holder_id, self.employee_priya)

        # Create transfer to Raj
        transfer_to_raj = self.env['assetflow.transfer'].create({
            'asset_id': self.asset_laptop.id,
            'target_holder_id': self.employee_raj.id
        })
        self.assertEqual(transfer_to_raj.source_holder_id, self.employee_priya)
        self.assertEqual(transfer_to_raj.state, 'requested')

        # Approve transfer
        transfer_to_raj.action_approve()
        
        # Verify transfer status
        self.assertEqual(transfer_to_raj.state, 'approved')
        
        # Verify old allocation was closed
        self.assertEqual(alloc_priya.state, 'returned')
        self.assertIsNotNone(alloc_priya.actual_return_date)

        # Verify new custodian is Raj
        self.assertEqual(self.asset_laptop.current_holder_id, self.employee_raj)
        
        # Verify new allocation is active
        new_alloc = self.env['assetflow.allocation'].search([
            ('asset_id', '=', self.asset_laptop.id),
            ('employee_id', '=', self.employee_raj.id),
            ('state', '=', 'approved')
        ])
        self.assertTrue(new_alloc, "New approved allocation was not created for recipient.")

    def test_03_resource_booking_overlap_validation(self):
        """
        test_03_resource_booking_overlap_validation
        
        Validates calendar reservation. Verifies that consecutive bookings are permitted,
        but overlapping bookings raise validation warnings.
        """
        base_time = datetime.now()
        
        # Booking A: 09:00 to 10:00
        booking_a = self.env['assetflow.booking'].create({
            'name': 'Project Status Sync',
            'asset_id': self.asset_room.id,
            'start_time': base_time,
            'end_time': base_time + timedelta(hours=1)
        })
        self.assertEqual(booking_a.state, 'upcoming')

        # Booking B (Overlapping): 09:30 to 10:30 - should fail
        with self.assertRaises(ValidationError, msg="Overlapping resource booking was permitted."):
            self.env['assetflow.booking'].create({
                'name': 'Client Presentation',
                'asset_id': self.asset_room.id,
                'start_time': base_time + timedelta(minutes=30),
                'end_time': base_time + timedelta(hours=1, minutes=30)
            })

        # Booking C (Consecutive): 10:00 to 11:00 - should succeed
        booking_c = self.env['assetflow.booking'].create({
            'name': 'Board Meeting',
            'asset_id': self.asset_room.id,
            'start_time': base_time + timedelta(hours=1),
            'end_time': base_time + timedelta(hours=2)
        })
        self.assertEqual(booking_c.state, 'upcoming')

    def test_04_maintenance_status_transitions(self):
        """
        test_04_maintenance_status_transitions
        
        Validates repair workflows. Verifies that approving a repair ticket shifts the asset 
        status to 'maintenance', and resolving the ticket shifts the asset back to 'available'.
        """
        # Start state is available
        self.assertEqual(self.asset_laptop.state, 'available')
        
        # Create ticket
        ticket = self.env['assetflow.maintenance'].create({
            'name': 'OS Reinstallation',
            'asset_id': self.asset_laptop.id,
            'priority': '1'
        })
        self.assertEqual(ticket.state, 'pending')

        # Approve ticket
        ticket.action_approve()
        self.assertEqual(ticket.state, 'approved')
        self.assertEqual(self.asset_laptop.state, 'maintenance')

        # Assign technician and resolve
        ticket.write({'technician_id': self.employee_tech.id})
        ticket.action_assign()
        ticket.action_start()
        ticket.action_resolve()
        
        # State transitions
        self.assertEqual(ticket.state, 'resolved')
        self.assertEqual(self.asset_laptop.state, 'available')

    def test_05_audit_cycle_and_discrepancies(self):
        """
        test_05_audit_cycle_and_discrepancies
        
        Verifies the complete audit pipeline:
        - Audit starting generates verification lines for active assets.
        - Closing the audit cycle applies discrepancy states to assets.
        """
        # Verify laptops are in active registry
        self.assertEqual(self.asset_laptop.state, 'available')

        # Create audit cycle
        audit_cycle = self.env['assetflow.audit.cycle'].create({
            'name': 'Q3 Annual Hardware Audit',
            'auditor_ids': [(4, self.env.user.id)]
        })
        self.assertEqual(audit_cycle.state, 'draft')

        # Start audit
        audit_cycle.action_start()
        self.assertEqual(audit_cycle.state, 'active')
        
        # Lines should be generated
        lines = audit_cycle.line_ids
        self.assertEqual(len(lines), 2, "Audit verification lines were not generated for all active assets.")
        
        # Locate laptop line and mark missing
        laptop_line = lines.filtered(lambda l: l.asset_id == self.asset_laptop)
        self.assertTrue(laptop_line)
        laptop_line.write({'status': 'missing'})

        # Locate room line and mark verified
        room_line = lines.filtered(lambda l: l.asset_id == self.asset_room)
        self.assertTrue(room_line)
        room_line.write({'status': 'verified'})

        # Close audit
        audit_cycle.action_close()
        self.assertEqual(audit_cycle.state, 'closed')
        
        # Verify discrepancy was applied (laptop state is now lost)
        self.assertEqual(self.asset_laptop.state, 'lost')
        self.assertEqual(self.asset_room.state, 'available')
