from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Table, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="Employee", nullable=False) # Admin, Asset Manager, Department Head, Employee
    department_id = Column(Integer, ForeignKey('departments.id', ondelete='SET NULL'), nullable=True)
    status = Column(String, default="Active", nullable=False) # Active, Inactive
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime, nullable=True)
    token_version = Column(Integer, default=1, nullable=False)
    profile_picture = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    department = relationship("Department", foreign_keys=[department_id], back_populates="employees")
    allocations = relationship("Allocation", back_populates="employee")
    bookings = relationship("Booking", back_populates="booked_by")
    maintenance_requests = relationship("MaintenanceRequest", foreign_keys="[MaintenanceRequest.raised_by_id]", back_populates="raised_by")
    assigned_tasks = relationship("MaintenanceRequest", foreign_keys="[MaintenanceRequest.technician_id]", back_populates="technician")
    audit_checks = relationship("AuditLine", back_populates="verified_by")
    notifications = relationship("Notification", back_populates="recipient")
    logs = relationship("ActivityLog", back_populates="user")

class Department(Base):
    __tablename__ = 'departments'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    code = Column(String, unique=True, nullable=False)
    parent_department_id = Column(Integer, ForeignKey('departments.id', ondelete='SET NULL'), nullable=True)
    manager_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    status = Column(String, default="Active", nullable=False) # Active, Inactive

    parent = relationship("Department", remote_side=[id], backref="sub_departments")
    manager = relationship("User", foreign_keys=[manager_id])
    employees = relationship("User", foreign_keys=[User.department_id], back_populates="department")
    allocations = relationship("Allocation", back_populates="department")

class AssetCategory(Base):
    __tablename__ = 'asset_categories'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    code = Column(String, unique=True, nullable=False)
    status = Column(String, default="Active", nullable=False) # Active, Inactive

    assets = relationship("Asset", back_populates="category")

class Asset(Base):
    __tablename__ = 'assets'

    id = Column(Integer, primary_key=True, index=True)
    tag = Column(String, unique=True, index=True, nullable=False) # AF-0001, etc.
    name = Column(String, nullable=False)
    category_id = Column(Integer, ForeignKey('asset_categories.id', ondelete='RESTRICT'), nullable=False)
    serial_number = Column(String, unique=True, index=True, nullable=True)
    acquisition_date = Column(Date, nullable=False)
    acquisition_cost = Column(Float, nullable=False)
    condition = Column(String, default="New", nullable=False) # New, Good, Fair, Poor, Damaged
    location = Column(String, nullable=False)
    shared_flag = Column(Boolean, default=False, nullable=False)
    qr_code = Column(String, nullable=True)
    image = Column(String, nullable=True)
    status = Column(String, default="Available", nullable=False) # Available, Allocated, Reserved, Under Maintenance, Lost, Retired, Disposed
    department_id = Column(Integer, ForeignKey('departments.id', ondelete='SET NULL'), nullable=True)

    category = relationship("AssetCategory", back_populates="assets")
    department = relationship("Department")
    allocations = relationship("Allocation", back_populates="asset")
    bookings = relationship("Booking", back_populates="asset")
    maintenance_records = relationship("MaintenanceRequest", back_populates="asset")
    audit_lines = relationship("AuditLine", back_populates="asset")

class Allocation(Base):
    __tablename__ = 'allocations'

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey('assets.id', ondelete='CASCADE'), nullable=False)
    employee_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    department_id = Column(Integer, ForeignKey('departments.id', ondelete='SET NULL'), nullable=True)
    allocation_date = Column(Date, nullable=False)
    expected_return_date = Column(Date, nullable=True)
    actual_return_date = Column(Date, nullable=True)
    state = Column(String, default="Draft", nullable=False) # Draft, Requested, Approved, Returned, Overdue
    condition_at_allocation = Column(String, nullable=False)
    condition_at_return = Column(String, nullable=True)
    checkin_notes = Column(String, nullable=True)

    asset = relationship("Asset", back_populates="allocations")
    employee = relationship("User", back_populates="allocations")
    department = relationship("Department", back_populates="allocations")

class Transfer(Base):
    __tablename__ = 'transfers'

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey('assets.id', ondelete='CASCADE'), nullable=False)
    source_holder_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    target_holder_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    requested_by_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    manager_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    state = Column(String, default="Requested", nullable=False) # Requested, Approved, Rejected
    approval_date = Column(Date, nullable=True)
    reason = Column(String, nullable=True)

    asset = relationship("Asset")
    source_holder = relationship("User", foreign_keys=[source_holder_id])
    target_holder = relationship("User", foreign_keys=[target_holder_id])
    requested_by = relationship("User", foreign_keys=[requested_by_id])
    manager = relationship("User", foreign_keys=[manager_id])

class Booking(Base):
    __tablename__ = 'bookings'

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey('assets.id', ondelete='CASCADE'), nullable=False)
    booked_by_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, default="Upcoming", nullable=False) # Upcoming, Ongoing, Completed, Cancelled
    purpose = Column(String, nullable=False)
    reminder_sent = Column(Boolean, default=False, nullable=False)

    asset = relationship("Asset", back_populates="bookings")
    booked_by = relationship("User", back_populates="bookings")

class MaintenanceRequest(Base):
    __tablename__ = 'maintenance_requests'

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey('assets.id', ondelete='CASCADE'), nullable=False)
    raised_by_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    issue_description = Column(String, nullable=False)
    priority = Column(String, default="Low", nullable=False) # Low, Medium, High, Critical
    photo = Column(String, nullable=True) # file path
    status = Column(String, default="Pending", nullable=False) # Pending, Approved, Rejected, Assigned, In Progress, Resolved
    approved_by_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    approval_date = Column(Date, nullable=True)
    rejection_reason = Column(String, nullable=True)
    technician_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    resolution_notes = Column(String, nullable=True)
    resolved_date = Column(Date, nullable=True)

    asset = relationship("Asset", back_populates="maintenance_records")
    raised_by = relationship("User", foreign_keys=[raised_by_id], back_populates="maintenance_requests")
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    technician = relationship("User", foreign_keys=[technician_id], back_populates="assigned_tasks")

class AuditCycle(Base):
    __tablename__ = 'audit_cycles'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    scope_department_id = Column(Integer, ForeignKey('departments.id', ondelete='SET NULL'), nullable=True)
    scope_location = Column(String, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, default="Draft", nullable=False) # Draft, In Progress, Closed

    department = relationship("Department")
    lines = relationship("AuditLine", back_populates="audit_cycle", cascade="all, delete-orphan")

# Association Table for Audit Cycle Auditors
audit_cycle_auditors = Table(
    'audit_cycle_auditors',
    Base.metadata,
    Column('audit_cycle_id', Integer, ForeignKey('audit_cycles.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
)

class AuditLine(Base):
    __tablename__ = 'audit_lines'
    __table_args__ = (
        UniqueConstraint('audit_cycle_id', 'asset_id', name='_audit_cycle_asset_uc'),
    )

    id = Column(Integer, primary_key=True, index=True)
    audit_cycle_id = Column(Integer, ForeignKey('audit_cycles.id', ondelete='CASCADE'), nullable=False)
    asset_id = Column(Integer, ForeignKey('assets.id', ondelete='CASCADE'), nullable=False)
    verified_by_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    verification_date = Column(Date, nullable=True)
    result = Column(String, nullable=True) # Verified, Missing, Damaged
    notes = Column(String, nullable=True)

    audit_cycle = relationship("AuditCycle", back_populates="lines")
    asset = relationship("Asset", back_populates="audit_lines")
    verified_by = relationship("User", back_populates="audit_checks")

class Notification(Base):
    __tablename__ = 'notifications'

    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    type = Column(String, nullable=False)
    message = Column(String, nullable=False)
    read_status = Column(Boolean, default=False, nullable=False)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    related_record_ref = Column(String, nullable=True) # e.g. "assets:1", "bookings:5"

    recipient = relationship("User", back_populates="notifications")

class ActivityLog(Base):
    __tablename__ = 'activity_logs'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    action_type = Column(String, nullable=False) # e.g. CREATE_ASSET, APPROVE_MAINTENANCE
    model_ref = Column(String, nullable=False) # e.g. assets, allocations
    record_id = Column(Integer, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    description = Column(String, nullable=True)

    user = relationship("User", back_populates="logs")


class ResourceRequest(Base):
    __tablename__ = 'resource_requests'

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = Column(String, nullable=False)
    reason = Column(String, nullable=False)
    benefits = Column(String, nullable=False)
    estimated_cost = Column(Float, nullable=False)
    location_to_use = Column(String, nullable=False)
    image = Column(String, nullable=True)
    status = Column(String, default="Pending", nullable=False) # Pending, Accepted, Approved, Rejected
    dept_head_approved = Column(Boolean, default=False, nullable=False)
    admin_approved = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    requester = relationship("User", foreign_keys=[requester_id])
