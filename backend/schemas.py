from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import date, datetime

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None

# --- User Schemas ---
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

class UserRoleUpdate(BaseModel):
    role: str # Admin, Asset Manager, Department Head, Employee

class UserStatusUpdate(BaseModel):
    status: str # Active, Inactive

# --- Department Schemas ---
class DepartmentCreate(BaseModel):
    name: str
    code: str
    parent_department_id: Optional[int] = None
    manager_id: Optional[int] = None

class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: str
    parent_department_id: Optional[int] = None
    manager_id: Optional[int] = None
    status: str

    class Config:
        from_attributes = True

# --- Asset Category Schemas ---
class CategoryCreate(BaseModel):
    name: str
    code: str

class CategoryResponse(BaseModel):
    id: int
    name: str
    code: str
    status: str

    class Config:
        from_attributes = True

# --- Asset Schemas ---
class AssetCreate(BaseModel):
    name: str
    category_id: int
    serial_number: Optional[str] = None
    acquisition_date: date
    acquisition_cost: float = Field(..., gte=0.0)
    condition: str = "New" # New, Good, Fair, Poor, Damaged
    location: str
    shared_flag: bool = False

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    serial_number: Optional[str] = None
    condition: Optional[str] = None
    location: Optional[str] = None
    shared_flag: Optional[bool] = None
    status: Optional[str] = None

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

# --- Allocation Schemas ---
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

    class Config:
        from_attributes = True

# --- Transfer Schemas ---
class TransferCreate(BaseModel):
    asset_id: int
    target_holder_id: int
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

    class Config:
        from_attributes = True

# --- Booking Schemas ---
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

    class Config:
        from_attributes = True

# --- Maintenance Schemas ---
class MaintenanceCreate(BaseModel):
    asset_id: int
    issue_description: str
    priority: str = "Low" # Low, Medium, High, Critical

class MaintenanceAssign(BaseModel):
    technician_id: int

class MaintenanceAction(BaseModel):
    resolution_notes: str

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

    class Config:
        from_attributes = True

# --- Audit Cycle Schemas ---
class AuditCycleCreate(BaseModel):
    name: str
    scope_department_id: Optional[int] = None
    scope_location: Optional[str] = None
    start_date: date
    end_date: date
    auditor_ids: List[int]

class AuditLineUpdate(BaseModel):
    result: str # Verified, Missing, Damaged
    notes: Optional[str] = None

class AuditLineResponse(BaseModel):
    id: int
    audit_cycle_id: int
    asset_id: int
    verified_by_id: Optional[int] = None
    verification_date: Optional[date] = None
    result: Optional[str] = None
    notes: Optional[str] = None

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

    class Config:
        from_attributes = True

# --- Notification Schemas ---
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

# --- Activity Log Schemas ---
class ActivityLogResponse(BaseModel):
    id: int
    user_id: int
    action_type: str
    model_ref: str
    record_id: int
    timestamp: datetime
    description: Optional[str] = None

    class Config:
        from_attributes = True
