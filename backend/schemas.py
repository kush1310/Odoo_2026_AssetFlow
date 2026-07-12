from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any, Dict
from datetime import date, datetime


# ── Token Schemas ─────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


# ── User Schemas ──────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=8)
    department_id: Optional[int] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    department_id: Optional[int] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserMinimal(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department_id: Optional[int] = None

    class Config:
        from_attributes = True

class UserRoleUpdate(BaseModel):
    role: str   # Admin | Asset Manager | Department Head | Employee

class UserStatusUpdate(BaseModel):
    status: str  # Active | Inactive


# ── Department Schemas ────────────────────────────────────────────────────────

class DepartmentCreate(BaseModel):
    name: str
    code: str
    parent_department_id: Optional[int] = None
    manager_id: Optional[int] = None

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    parent_department_id: Optional[int] = None
    manager_id: Optional[int] = None
    status: Optional[str] = None

class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: str
    parent_department_id: Optional[int] = None
    manager_id: Optional[int] = None
    status: str

    class Config:
        from_attributes = True


# ── Asset Category Schemas ────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str
    code: str

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    status: Optional[str] = None

class CategoryResponse(BaseModel):
    id: int
    name: str
    code: str
    status: str

    class Config:
        from_attributes = True


# ── Asset Schemas ─────────────────────────────────────────────────────────────

class AssetCreate(BaseModel):
    name: str
    category_id: int
    serial_number: Optional[str] = None
    acquisition_date: date
    acquisition_cost: float = Field(..., ge=0.0)
    condition: str = "New"
    location: str
    shared_flag: bool = False

class AssetUpdate(BaseModel):
    # NOTE: status is intentionally omitted — it is only changed by service functions
    name: Optional[str] = None
    category_id: Optional[int] = None
    serial_number: Optional[str] = None
    condition: Optional[str] = None
    location: Optional[str] = None
    shared_flag: Optional[bool] = None

class AssetResponse(BaseModel):
    id: int
    tag: str
    name: str
    category_id: int
    serial_number: Optional[str] = None
    acquisition_date: date
    acquisition_cost: float
    condition: str
    location: str
    shared_flag: bool
    status: str
    current_holder_id: Optional[int] = None

    class Config:
        from_attributes = True

class AssetDetailResponse(BaseModel):
    id: int
    tag: str
    name: str
    category_id: int
    serial_number: Optional[str] = None
    acquisition_date: date
    acquisition_cost: float
    condition: str
    location: str
    shared_flag: bool
    status: str
    allocation_history: List[Any] = []
    maintenance_history: List[Any] = []

    class Config:
        from_attributes = True


# ── Allocation Schemas ────────────────────────────────────────────────────────

class AllocationCreate(BaseModel):
    asset_id: int
    employee_id: int
    department_id: Optional[int] = None
    allocation_date: date
    expected_return_date: Optional[date] = None
    condition_at_allocation: str

class ReturnCheckin(BaseModel):
    condition_at_return: str
    checkin_notes: Optional[str] = None

class AllocationResponse(BaseModel):
    id: int
    asset_id: int
    employee_id: int
    department_id: Optional[int] = None
    allocation_date: date
    expected_return_date: Optional[date] = None
    actual_return_date: Optional[date] = None
    state: str
    condition_at_allocation: str
    condition_at_return: Optional[str] = None
    checkin_notes: Optional[str] = None
    # Enriched fields for display
    asset_tag: Optional[str] = None
    asset_name: Optional[str] = None
    employee_name: Optional[str] = None
    department_name: Optional[str] = None

    class Config:
        from_attributes = True


# ── Transfer Schemas ──────────────────────────────────────────────────────────

class TransferCreate(BaseModel):
    asset_id: int
    target_holder_id: int
    reason: Optional[str] = None

class TransferReject(BaseModel):
    reason: Optional[str] = None

class TransferResponse(BaseModel):
    id: int
    asset_id: int
    source_holder_id: int
    target_holder_id: int
    requested_by_id: int
    manager_id: Optional[int] = None
    state: str
    approval_date: Optional[date] = None
    reason: Optional[str] = None
    # Enriched
    asset_tag: Optional[str] = None
    asset_name: Optional[str] = None
    source_holder_name: Optional[str] = None
    target_holder_name: Optional[str] = None

    class Config:
        from_attributes = True


# ── Booking Schemas ───────────────────────────────────────────────────────────

class BookingCreate(BaseModel):
    asset_id: int
    start_time: datetime
    end_time: datetime
    purpose: str

class BookingResponse(BaseModel):
    id: int
    asset_id: int
    booked_by_id: int
    start_time: datetime
    end_time: datetime
    status: str
    purpose: str
    reminder_sent: bool
    # Enriched
    asset_tag: Optional[str] = None
    asset_name: Optional[str] = None
    booked_by_name: Optional[str] = None

    class Config:
        from_attributes = True


# ── Maintenance Schemas ───────────────────────────────────────────────────────

class MaintenanceCreate(BaseModel):
    asset_id: int
    issue_description: str
    priority: str = "Low"  # Low | Medium | High | Critical

class MaintenanceAssign(BaseModel):
    technician_id: int

class MaintenanceResolve(BaseModel):
    resolution_notes: str

class MaintenanceReject(BaseModel):
    rejection_reason: str

class MaintenanceResponse(BaseModel):
    id: int
    asset_id: int
    raised_by_id: int
    issue_description: str
    priority: str
    photo: Optional[str] = None
    status: str
    approved_by_id: Optional[int] = None
    approval_date: Optional[date] = None
    rejection_reason: Optional[str] = None
    technician_id: Optional[int] = None
    resolution_notes: Optional[str] = None
    resolved_date: Optional[date] = None
    # Enriched
    asset_tag: Optional[str] = None
    asset_name: Optional[str] = None
    raised_by_name: Optional[str] = None
    technician_name: Optional[str] = None

    class Config:
        from_attributes = True


# ── Audit Schemas ─────────────────────────────────────────────────────────────

class AuditCycleCreate(BaseModel):
    name: str
    scope_department_id: Optional[int] = None
    scope_location: Optional[str] = None
    start_date: date
    end_date: date
    auditor_ids: List[int]

class AuditLineUpdate(BaseModel):
    result: str  # Verified | Missing | Damaged
    notes: Optional[str] = None

class AuditLineResponse(BaseModel):
    id: int
    audit_cycle_id: int
    asset_id: int
    verified_by_id: Optional[int] = None
    verification_date: Optional[date] = None
    result: Optional[str] = None
    notes: Optional[str] = None
    asset_tag: Optional[str] = None
    asset_name: Optional[str] = None
    asset_location: Optional[str] = None

    class Config:
        from_attributes = True

class AuditCycleResponse(BaseModel):
    id: int
    name: str
    scope_department_id: Optional[int] = None
    scope_location: Optional[str] = None
    start_date: date
    end_date: date
    status: str
    auditor_ids: List[int] = []
    auditor_names: List[str] = []
    total_lines: int = 0
    verified_lines: int = 0

    class Config:
        from_attributes = True


# ── Dashboard KPI Schema ──────────────────────────────────────────────────────

class DashboardKPI(BaseModel):
    available: int
    allocated: int
    under_maintenance: int
    active_bookings: int
    pending_transfers: int
    upcoming_returns: int
    overdue_returns: int
    total_assets: int


# ── Notification Schemas ──────────────────────────────────────────────────────

class NotificationResponse(BaseModel):
    id: int
    recipient_id: int
    type: str
    message: str
    read_status: bool
    created_date: datetime
    related_record_ref: Optional[str] = None

    class Config:
        from_attributes = True


# ── Activity Log Schemas ──────────────────────────────────────────────────────

class ActivityLogResponse(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    action_type: str
    model_ref: str
    record_id: int
    timestamp: datetime
    description: Optional[str] = None

    class Config:
        from_attributes = True
