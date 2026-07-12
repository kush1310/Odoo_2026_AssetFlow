from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import date, datetime, timedelta

from database import get_db
import models
import schemas
import auth

router = APIRouter(prefix="/api")

# Helper to log system events
def log_activity(db: Session, user_id: int, action_type: str, model_ref: str, record_id: int, description: str):
    log = models.ActivityLog(
        user_id=user_id,
        action_type=action_type,
        model_ref=model_ref,
        record_id=record_id,
        description=description
    )
    db.add(log)
    db.commit()

# Helper to push notifications
def notify_user(db: Session, recipient_id: int, n_type: str, message: str, related_ref: Optional[str] = None):
    notif = models.Notification(
        recipient_id=recipient_id,
        type=n_type,
        message=message,
        related_record_ref=related_ref
    )
    db.add(notif)
    db.commit()


# ==========================================
# 1. AUTHENTICATION ROUTER
# ==========================================

@router.post("/auth/signup", response_model=schemas.UserResponse)
def signup(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # Verify email uniqueness
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    # Block disposable email addresses (Security check)
    disposable_domains = ["yopmail.com", "mailinator.com", "tempmail.com", "guerrillamail.com"]
    domain = user_in.email.split("@")[-1].lower()
    if domain in disposable_domains:
        raise HTTPException(status_code=400, detail="Disposable email addresses are not permitted.")
        
    hashed_password = auth.get_password_hash(user_in.password)
    new_user = models.User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hashed_password,
        department_id=user_in.department_id,
        role="Employee", # Always default to Employee role on signup (no privilege escalation)
        status="Active"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    log_activity(db, new_user.id, "SIGNUP", "users", new_user.id, f"Employee account created for {new_user.name}")
    return new_user

@router.post("/auth/login")
def login(credentials: schemas.UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not auth.verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email address or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    if user.status != "Active":
        raise HTTPException(status_code=403, detail="Your account has been deactivated. Please contact administration.")
        
    # Generate token
    token_expire = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"email": user.email, "role": user.role, "user_id": user.id},
        expires_delta=token_expire
    )
    
    # Log successful attempt
    log_activity(db, user.id, "LOGIN", "users", user.id, f"Successful authentication session generated for {user.name}")
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "name": user.name, "email": user.email, "id": user.id}

@router.get("/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# ==========================================
# 2. ORGANIZATION SETUP ROUTER (Admin Only)
# ==========================================

@router.post("/departments", response_model=schemas.DepartmentResponse)
def create_department(dept_in: schemas.DepartmentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["Admin"]))):
    # Verify uniqueness
    existing_name = db.query(models.Department).filter(models.Department.name == dept_in.name).first()
    if existing_name:
        raise HTTPException(status_code=400, detail="Department name must be unique.")
    existing_code = db.query(models.Department).filter(models.Department.code == dept_in.code).first()
    if existing_code:
        raise HTTPException(status_code=400, detail="Department code must be unique.")
        
    # Circular check
    if dept_in.parent_department_id:
        parent = db.query(models.Department).filter(models.Department.id == dept_in.parent_department_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent department not found.")
            
    new_dept = models.Department(
        name=dept_in.name,
        code=dept_in.code,
        parent_department_id=dept_in.parent_department_id,
        manager_id=dept_in.manager_id,
        status="Active"
    )
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    
    log_activity(db, current_user.id, "CREATE_DEPT", "departments", new_dept.id, f"Department '{new_dept.name}' created.")
    return new_dept

@router.get("/departments", response_model=List[schemas.DepartmentResponse])
def get_departments(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Role isolation check
    if current_user.role in ["Admin", "Asset Manager"]:
        return db.query(models.Department).all()
    elif current_user.role == "Department Head":
        return db.query(models.Department).filter(
            or_(
                models.Department.id == current_user.department_id,
                models.Department.parent_department_id == current_user.department_id
            )
        ).all()
    else:
        return db.query(models.Department).filter(models.Department.id == current_user.department_id).all()

@router.post("/categories", response_model=schemas.CategoryResponse)
def create_category(cat_in: schemas.CategoryCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["Admin"]))):
    existing = db.query(models.AssetCategory).filter(models.AssetCategory.name == cat_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category name must be unique.")
    existing_code = db.query(models.AssetCategory).filter(models.AssetCategory.code == cat_in.code).first()
    if existing_code:
        raise HTTPException(status_code=400, detail="Category code must be unique.")
        
    new_cat = models.AssetCategory(name=cat_in.name, code=cat_in.code, status="Active")
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    
    log_activity(db, current_user.id, "CREATE_CATEGORY", "asset_categories", new_cat.id, f"Asset Category '{new_cat.name}' created.")
    return new_cat

@router.get("/categories", response_model=List[schemas.CategoryResponse])
def get_categories(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.AssetCategory).filter(models.AssetCategory.status == "Active").all()

@router.get("/employees", response_model=List[schemas.UserResponse])
def get_employees(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role in ["Admin", "Asset Manager"]:
        return db.query(models.User).all()
    elif current_user.role == "Department Head":
        return db.query(models.User).filter(models.User.department_id == current_user.department_id).all()
    else:
        return [current_user]

@router.put("/employees/{emp_id}/promote")
def promote_employee(emp_id: int, promotion: schemas.UserRoleUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["Admin"]))):
    target = db.query(models.User).filter(models.User.id == emp_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Employee not found.")
        
    old_role = target.role
    target.role = promotion.role
    db.commit()
    
    # If promoted to Department Head, set them as manager of their department
    if promotion.role == "Department Head" and target.department_id:
        dept = db.query(models.Department).filter(models.Department.id == target.department_id).first()
        if dept:
            dept.manager_id = target.id
            db.commit()
            
    log_activity(db, current_user.id, "PROMOTE_ROLE", "users", target.id, f"Promoted {target.name} from {old_role} to {promotion.role}.")
    notify_user(db, target.id, "ROLE_CHANGE", f"Your system permissions have been updated. You are now promoted to {promotion.role}.", f"users:{target.id}")
    return {"message": f"Successfully promoted {target.name} to {promotion.role}"}

@router.put("/employees/{emp_id}/status")
def update_employee_status(emp_id: int, status_update: schemas.UserStatusUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["Admin"]))):
    target = db.query(models.User).filter(models.User.id == emp_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Employee not found.")
        
    target.status = status_update.status
    db.commit()
    
    log_activity(db, current_user.id, "UPDATE_STATUS", "users", target.id, f"Set status of {target.name} to {status_update.status}.")
    return {"message": f"Status updated to {status_update.status}"}


# ==========================================
# 3. ASSET REGISTRATION & DIRECTORY
# ==========================================

@router.post("/assets", response_model=schemas.AssetResponse)
def register_asset(asset_in: schemas.AssetCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["Admin", "Asset Manager"]))):
    # Verify serial uniqueness
    if asset_in.serial_number:
        existing = db.query(models.Asset).filter(models.Asset.serial_number == asset_in.serial_number).first()
        if existing:
            raise HTTPException(status_code=400, detail="Asset with this serial number already exists.")
            
    # Generate sequential Tag (e.g. AF-0001)
    last_asset = db.query(models.Asset).order_by(models.Asset.id.desc()).first()
    next_num = 1 if not last_asset else last_asset.id + 1
    tag = f"AF-{next_num:04d}"
    
    new_asset = models.Asset(
        tag=tag,
        name=asset_in.name,
        category_id=asset_in.category_id,
        serial_number=asset_in.serial_number,
        acquisition_date=asset_in.acquisition_date,
        acquisition_cost=asset_in.acquisition_cost,
        condition=asset_in.condition,
        location=asset_in.location,
        shared_flag=asset_in.shared_flag,
        status="Available" # Enforces default lifecycle entry
    )
    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)
    
    log_activity(db, current_user.id, "REGISTER_ASSET", "assets", new_asset.id, f"Registered asset {new_asset.name} ({tag})")
    return new_asset

@router.get("/assets", response_model=List[schemas.AssetResponse])
def get_assets(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Role scoped visibility
    query = db.query(models.Asset)
    if current_user.role == "Employee":
        # Employees only see assets allocated to them or flagged shared
        allocated_asset_ids = db.query(models.Allocation.asset_id).filter(
            models.Allocation.employee_id == current_user.id,
            models.Allocation.state.in_(["approved", "overdue"])
        ).subquery()
        query = query.filter(
            or_(
                models.Asset.id.in_(allocated_asset_ids),
                models.Asset.shared_flag == True
            )
        )
    elif current_user.role == "Department Head":
        # Dept heads see dept assets plus shared
        allocated_asset_ids = db.query(models.Allocation.asset_id).filter(
            or_(
                models.Allocation.department_id == current_user.department_id,
                models.Allocation.employee_id == current_user.id
            ),
            models.Allocation.state.in_(["approved", "overdue"])
        ).subquery()
        query = query.filter(
            or_(
                models.Asset.id.in_(allocated_asset_ids),
                models.Asset.shared_flag == True
            )
        )
    return query.all()

@router.get("/assets/{asset_id}", response_model=schemas.AssetResponse)
def get_asset_by_id(asset_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found.")
    return asset


# ==========================================
# 4. ALLOCATIONS & CUSTODY TRANSFERS
# ==========================================

@router.post("/allocations", response_model=schemas.AllocationResponse)
def allocate_asset(alloc_in: schemas.AllocationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["Admin", "Asset Manager"]))):
    # Concurrency Lock: Select row for update to avoid double-allocation race conditions
    asset = db.query(models.Asset).filter(models.Asset.id == alloc_in.asset_id).with_for_update().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found.")
        
    if asset.status != "Available":
        raise HTTPException(status_code=400, detail=f"Double allocation blocked. Asset is currently '{asset.status}'.")
        
    new_alloc = models.Allocation(
        asset_id=alloc_in.asset_id,
        employee_id=alloc_in.employee_id,
        department_id=alloc_in.department_id,
        allocation_date=alloc_in.allocation_date,
        expected_return_date=alloc_in.expected_return_date,
        condition_at_allocation=alloc_in.condition_at_allocation,
        state="approved"
    )
    db.add(new_alloc)
    
    # Update asset status
    asset.status = "Allocated"
    db.commit()
    db.refresh(new_alloc)
    
    log_activity(db, current_user.id, "ALLOCATE_ASSET", "allocations", new_alloc.id, f"Allocated {asset.name} ({asset.tag}) to user {alloc_in.employee_id}")
    notify_user(db, alloc_in.employee_id, "ASSET_ASSIGNED", f"Asset '{asset.name}' has been allocated to you. Expected return: {alloc_in.expected_return_date}.", f"assets:{asset.id}")
    return new_alloc

@router.post("/allocations/{alloc_id}/return", response_model=schemas.AllocationResponse)
def return_asset(alloc_id: int, checkin: schemas.ReturnCheckin, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["Admin", "Asset Manager"]))):
    alloc = db.query(models.Allocation).filter(models.Allocation.id == alloc_id).first()
    if not alloc:
        raise HTTPException(status_code=404, detail="Allocation record not found.")
        
    if alloc.state in ["returned"]:
        raise HTTPException(status_code=400, detail="Asset already registered as returned.")
        
    alloc.state = "returned"
    alloc.actual_return_date = date.today()
    alloc.condition_at_return = checkin.condition_at_return
    alloc.checkin_notes = checkin.checkin_notes
    
    # Revert asset status
    asset = alloc.asset
    asset.status = "Available"
    asset.condition = checkin.condition_at_return
    db.commit()
    
    log_activity(db, current_user.id, "RETURN_ASSET", "allocations", alloc.id, f"Returned asset {asset.tag}. Checkin condition: {checkin.condition_at_return}")
    return alloc

@router.post("/transfers", response_model=schemas.TransferResponse)
def request_transfer(trans_in: schemas.TransferCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    asset = db.query(models.Asset).filter(models.Asset.id == trans_in.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found.")
        
    # Locate active allocation
    active_alloc = db.query(models.Allocation).filter(
        models.Allocation.asset_id == asset.id,
        models.Allocation.state.in_(["approved", "overdue"])
    ).first()
    
    if not active_alloc:
        raise HTTPException(status_code=400, detail="Cannot transfer an asset that is not currently allocated.")
        
    new_trans = models.Transfer(
        asset_id=asset.id,
        source_holder_id=active_alloc.employee_id,
        target_holder_id=trans_in.target_holder_id,
        requested_by_id=current_user.id,
        state="Requested",
        reason=trans_in.reason
    )
    db.add(new_trans)
    db.commit()
    db.refresh(new_trans)
    
    log_activity(db, current_user.id, "REQUEST_TRANSFER", "transfers", new_trans.id, f"Requested custody transfer of {asset.tag} to user {trans_in.target_holder_id}")
    
    # Notify department head or asset manager
    manager = db.query(models.User).filter(models.User.role == "Asset Manager").first()
    if manager:
        notify_user(db, manager.id, "TRANSFER_REQUEST", f"Custodian transfer requested for {asset.tag} by {current_user.name}.", f"transfers:{new_trans.id}")
    return new_trans

@router.post("/transfers/{trans_id}/approve", response_model=schemas.TransferResponse)
def approve_transfer(trans_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["Admin", "Asset Manager", "Department Head"]))):
    transfer = db.query(models.Transfer).filter(models.Transfer.id == trans_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer request not found.")
        
    if transfer.state != "Requested":
        raise HTTPException(status_code=400, detail="Transfer request has already been processed.")
        
    # Close old allocation
    old_alloc = db.query(models.Allocation).filter(
        models.Allocation.asset_id == transfer.asset_id,
        models.Allocation.state.in_(["approved", "overdue"])
    ).first()
    if old_alloc:
        old_alloc.state = "returned"
        old_alloc.actual_return_date = date.today()
        old_alloc.checkin_notes = f"Closed via approved transfer request ID {transfer.id}"
        
    # Open new allocation
    new_alloc = models.Allocation(
        asset_id=transfer.asset_id,
        employee_id=transfer.target_holder_id,
        allocation_date=date.today(),
        condition_at_allocation=transfer.asset.condition,
        state="approved"
    )
    db.add(new_alloc)
    
    transfer.state = "Approved"
    transfer.manager_id = current_user.id
    transfer.approval_date = date.today()
    db.commit()
    
    log_activity(db, current_user.id, "APPROVE_TRANSFER", "transfers", transfer.id, f"Approved custody transfer of asset {transfer.asset.tag} to user {transfer.target_holder_id}")
    notify_user(db, transfer.target_holder_id, "TRANSFER_APPROVED", f"Your custody transfer for {transfer.asset.name} has been approved.", f"assets:{transfer.asset.id}")
    return transfer

@router.post("/transfers/{trans_id}/reject", response_model=schemas.TransferResponse)
def reject_transfer(trans_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["Admin", "Asset Manager", "Department Head"]))):
    transfer = db.query(models.Transfer).filter(models.Transfer.id == trans_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer request not found.")
        
    if transfer.state != "Requested":
        raise HTTPException(status_code=400, detail="Transfer request has already been processed.")
        
    transfer.state = "Rejected"
    transfer.manager_id = current_user.id
    transfer.approval_date = date.today()
    db.commit()
    
    log_activity(db, current_user.id, "REJECT_TRANSFER", "transfers", transfer.id, f"Rejected custody transfer of asset {transfer.asset.tag}")
    notify_user(db, transfer.requested_by_id, "TRANSFER_REJECTED", f"Your custody transfer for {transfer.asset.name} was rejected.", f"transfers:{transfer.id}")
    return transfer

@router.get("/allocations", response_model=List[schemas.AllocationResponse])
def get_allocations(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role in ["Admin", "Asset Manager"]:
        return db.query(models.Allocation).all()
    else:
        return db.query(models.Allocation).filter(models.Allocation.employee_id == current_user.id).all()

@router.get("/transfers", response_model=List[schemas.TransferResponse])
def get_transfers(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role in ["Admin", "Asset Manager"]:
        return db.query(models.Transfer).all()
    else:
        return db.query(models.Transfer).filter(
            or_(
                models.Transfer.requested_by_id == current_user.id,
                models.Transfer.target_holder_id == current_user.id
            )
        ).all()


# ==========================================
# 5. RESOURCE BOOKING
# ==========================================

@router.post("/bookings", response_model=schemas.BookingResponse)
def create_booking(book_in: schemas.BookingCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Concurrency Lock: Select the asset for update to prevent overlap race conditions
    asset = db.query(models.Asset).filter(models.Asset.id == book_in.asset_id).with_for_update().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found.")
        
    if not asset.shared_flag:
        raise HTTPException(status_code=400, detail="This asset is not registered as a shared bookable resource.")
        
    # Verify date range validity
    if book_in.end_time <= book_in.start_time:
        raise HTTPException(status_code=400, detail="End datetime must be strictly after start datetime.")
        
    if book_in.start_time < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Start datetime cannot be in the past.")
        
    # Rigid Overlap Check (Locked transaction-level block)
    overlaps = db.query(models.Booking).filter(
        models.Booking.asset_id == book_in.asset_id,
        models.Booking.status != "Cancelled",
        models.Booking.end_time > book_in.start_time,
        models.Booking.start_time < book_in.end_time
    ).all()
    
    if overlaps:
        raise HTTPException(
            status_code=400,
            detail=f"Overlap collision. The resource is already booked from {overlaps[0].start_time} to {overlaps[0].end_time}."
        )
        
    new_booking = models.Booking(
        asset_id=book_in.asset_id,
        booked_by_id=current_user.id,
        start_time=book_in.start_time,
        end_time=book_in.end_time,
        purpose=book_in.purpose,
        status="Upcoming"
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    
    log_activity(db, current_user.id, "CREATE_BOOKING", "bookings", new_booking.id, f"Booked resource {asset.tag} from {book_in.start_time} to {book_in.end_time}")
    return new_booking

@router.get("/bookings", response_model=List[schemas.BookingResponse])
def get_bookings(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role in ["Admin", "Asset Manager"]:
        return db.query(models.Booking).all()
    else:
        return db.query(models.Booking).filter(models.Booking.booked_by_id == current_user.id).all()

@router.post("/bookings/{book_id}/cancel", response_model=schemas.BookingResponse)
def cancel_booking(book_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    booking = db.query(models.Booking).filter(models.Booking.id == book_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
        
    # Check permissions
    if current_user.role not in ["Admin", "Asset Manager"] and booking.booked_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="You cannot cancel bookings belonging to other employees.")
        
    booking.status = "Cancelled"
    db.commit()
    
    log_activity(db, current_user.id, "CANCEL_BOOKING", "bookings", booking.id, f"Cancelled booking ID {booking.id} on resource {booking.asset.tag}")
    return booking


# ==========================================
# 6. MAINTENANCE KANBAN PIPELINE
# ==========================================

@router.post("/maintenance", response_model=schemas.MaintenanceResponse)
def raise_maintenance(req_in: schemas.MaintenanceCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    asset = db.query(models.Asset).filter(models.Asset.id == req_in.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found.")
        
    # Double request check: block multiple concurrent repair requests on same asset
    active_maint = db.query(models.MaintenanceRequest).filter(
        models.MaintenanceRequest.asset_id == asset.id,
        models.MaintenanceRequest.status.notin_(["Resolved", "Rejected"])
    ).first()
    if active_maint:
        raise HTTPException(status_code=400, detail="This asset already has an active open maintenance request.")
        
    new_req = models.MaintenanceRequest(
        asset_id=req_in.asset_id,
        raised_by_id=current_user.id,
        issue_description=req_in.issue_description,
        priority=req_in.priority,
        status="Pending"
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    
    log_activity(db, current_user.id, "CREATE_MAINTENANCE", "maintenance_requests", new_req.id, f"Raised maintenance request for {asset.tag}")
    return new_req

@router.post("/maintenance/{maint_id}/approve", response_model=schemas.MaintenanceResponse)
def approve_maintenance(maint_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["Admin", "Asset Manager"]))):
    req = db.query(models.MaintenanceRequest).filter(models.MaintenanceRequest.id == maint_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Maintenance record not found.")
        
    if req.status != "Pending":
        raise HTTPException(status_code=400, detail="Request has already been processed.")
        
    req.status = "Approved"
    req.approved_by_id = current_user.id
    req.approval_date = date.today()
    
    # Auto flip asset status to Under Maintenance
    req.asset.status = "Under Maintenance"
    db.commit()
    
    log_activity(db, current_user.id, "APPROVE_MAINTENANCE", "maintenance_requests", req.id, f"Approved maintenance request for {req.asset.tag}")
    notify_user(db, req.raised_by_id, "MAINTENANCE_APPROVED", f"Your maintenance request for {req.asset.name} has been approved.", f"maintenance:{req.id}")
    return req

@router.post("/maintenance/{maint_id}/assign", response_model=schemas.MaintenanceResponse)
def assign_maintenance(maint_id: int, assign: schemas.MaintenanceAssign, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["Admin", "Asset Manager"]))):
    req = db.query(models.MaintenanceRequest).filter(models.MaintenanceRequest.id == maint_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Maintenance record not found.")
        
    if req.status not in ["Approved", "Assigned"]:
        raise HTTPException(status_code=400, detail="Request must be approved before assigning a technician.")
        
    req.status = "Assigned"
    req.technician_id = assign.technician_id
    db.commit()
    
    log_activity(db, current_user.id, "ASSIGN_MAINTENANCE", "maintenance_requests", req.id, f"Assigned technician {assign.technician_id} to repair {req.asset.tag}")
    notify_user(db, assign.technician_id, "TASK_ASSIGNED", f"You have been assigned to repair {req.asset.tag}.", f"maintenance:{req.id}")
    return req

@router.post("/maintenance/{maint_id}/start", response_model=schemas.MaintenanceResponse)
def start_maintenance(maint_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    req = db.query(models.MaintenanceRequest).filter(models.MaintenanceRequest.id == maint_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Maintenance record not found.")
        
    # Only assigned tech or manager can start work
    if current_user.role not in ["Admin", "Asset Manager"] and req.technician_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied: You are not the assigned technician.")
        
    if req.status != "Assigned":
        raise HTTPException(status_code=400, detail="Work cannot start until a technician is assigned.")
        
    req.status = "In Progress"
    db.commit()
    
    log_activity(db, current_user.id, "START_MAINTENANCE", "maintenance_requests", req.id, f"Technician started repair work on {req.asset.tag}")
    return req

@router.post("/maintenance/{maint_id}/resolve", response_model=schemas.MaintenanceResponse)
def resolve_maintenance(maint_id: int, action: schemas.MaintenanceAction, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    req = db.query(models.MaintenanceRequest).filter(models.MaintenanceRequest.id == maint_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Maintenance record not found.")
        
    if current_user.role not in ["Admin", "Asset Manager"] and req.technician_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied: You are not the assigned technician.")
        
    if req.status != "In Progress":
        raise HTTPException(status_code=400, detail="Cannot resolve a ticket that is not currently in progress.")
        
    req.status = "Resolved"
    req.resolution_notes = action.resolution_notes
    req.resolved_date = date.today()
    
    # Auto flip asset back to Available
    req.asset.status = "Available"
    db.commit()
    
    log_activity(db, current_user.id, "RESOLVE_MAINTENANCE", "maintenance_requests", req.id, f"Resolved maintenance request for {req.asset.tag}. Notes: {action.resolution_notes}")
    notify_user(db, req.raised_by_id, "MAINTENANCE_RESOLVED", f"The maintenance issue for {req.asset.name} is now resolved.", f"maintenance:{req.id}")
    return req

@router.get("/maintenance", response_model=List[schemas.MaintenanceResponse])
def get_maintenance(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role in ["Admin", "Asset Manager"]:
        return db.query(models.MaintenanceRequest).all()
    elif reqs := db.query(models.MaintenanceRequest).filter(models.MaintenanceRequest.technician_id == current_user.id).all():
        return reqs
    else:
        return db.query(models.MaintenanceRequest).filter(models.MaintenanceRequest.raised_by_id == current_user.id).all()


# ==========================================
# 7. STRUCTURED AUDITING & VERIFICATION
# ==========================================

@router.post("/audits", response_model=schemas.AuditCycleResponse)
def create_audit_cycle(audit_in: schemas.AuditCycleCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["Admin"]))):
    # Verify date range
    if audit_in.end_date < audit_in.start_date:
        raise HTTPException(status_code=400, detail="End date must be on or after start date.")
        
    if not audit_in.auditor_ids:
        raise HTTPException(status_code=400, detail="At least one auditor must be assigned to start a verification cycle.")
        
    # Create the cycle
    cycle = models.AuditCycle(
        name=audit_in.name,
        scope_department_id=audit_in.scope_department_id,
        scope_location=audit_in.scope_location,
        start_date=audit_in.start_date,
        end_date=audit_in.end_date,
        status="Draft"
    )
    db.add(cycle)
    db.commit()
    db.refresh(cycle)
    
    # Associate Auditors (M2M)
    for auditor_id in audit_in.auditor_ids:
        db.execute(
            models.audit_cycle_auditors.insert().values(
                audit_cycle_id=cycle.id,
                user_id=auditor_id
            )
        )
    db.commit()
    
    # Auto-generate AuditLines for in-scope assets
    query = db.query(models.Asset).filter(models.Asset.status.notin_(["Retired", "Disposed"]))
    if audit_in.scope_department_id:
        allocated_assets = db.query(models.Allocation.asset_id).filter(
            models.Allocation.department_id == audit_in.scope_department_id,
            models.Allocation.state.in_(["approved", "overdue"])
        ).subquery()
        query = query.filter(models.Asset.id.in_(allocated_assets))
    if audit_in.scope_location:
        query = query.filter(models.Asset.location == audit_in.scope_location)
        
    assets = query.all()
    for asset in assets:
        line = models.AuditLine(
            audit_cycle_id=cycle.id,
            asset_id=asset.id,
            result=None # Starts blank to force verification check
        )
        db.add(line)
        
    cycle.status = "In Progress"
    db.commit()
    db.refresh(cycle)
    
    log_activity(db, current_user.id, "CREATE_AUDIT", "audit_cycles", cycle.id, f"Initiated audit cycle '{cycle.name}' with {len(assets)} assets in scope.")
    for auditor_id in audit_in.auditor_ids:
        notify_user(db, auditor_id, "AUDIT_ASSIGNED", f"You have been assigned to audit cycle '{cycle.name}'.", f"audits:{cycle.id}")
        
    return cycle

@router.put("/audits/{cycle_id}/lines/{line_id}", response_model=schemas.AuditLineResponse)
def verify_audit_line(cycle_id: int, line_id: int, line_up: schemas.AuditLineUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    cycle = db.query(models.AuditCycle).filter(models.AuditCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Audit cycle not found.")
        
    if cycle.status == "Closed":
        raise HTTPException(status_code=400, detail="Cannot alter lines on a locked closed audit cycle.")
        
    # Check if user is an assigned auditor
    auditor_assoc = db.query(models.audit_cycle_auditors).filter(
        models.audit_cycle_auditors.c.audit_cycle_id == cycle.id,
        models.audit_cycle_auditors.c.user_id == current_user.id
    ).first()
    if not auditor_assoc and current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="You are not authorized as an auditor for this cycle.")
        
    line = db.query(models.AuditLine).filter(
        models.AuditLine.id == line_id,
        models.AuditLine.audit_cycle_id == cycle.id
    ).first()
    if not line:
        raise HTTPException(status_code=404, detail="Audit line item not found.")
        
    line.result = line_up.result
    line.notes = line_up.notes
    line.verified_by_id = current_user.id
    line.verification_date = date.today()
    db.commit()
    db.refresh(line)
    
    # Notify manager if mismatch detected
    if line_up.result in ["Missing", "Damaged"]:
        manager = db.query(models.User).filter(models.User.role == "Asset Manager").first()
        if manager:
            notify_user(db, manager.id, "AUDIT_DISCREPANCY", f"Discrepancy: Asset {line.asset.tag} flagged as {line_up.result} during audit '{cycle.name}'.", f"audits:{cycle.id}")
            
    return line

@router.post("/audits/{cycle_id}/close")
def close_audit_cycle(cycle_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["Admin"]))):
    cycle = db.query(models.AuditCycle).filter(models.AuditCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Audit cycle not found.")
        
    if cycle.status == "Closed":
        raise HTTPException(status_code=400, detail="Audit cycle is already closed.")
        
    # Strictly check that every in-scope line has been verified
    unverified = db.query(models.AuditLine).filter(
        models.AuditLine.audit_cycle_id == cycle.id,
        models.AuditLine.result == None
    ).all()
    if unverified:
        raise HTTPException(status_code=400, detail=f"Cannot close cycle. There are still {len(unverified)} assets awaiting verification checks.")
        
    # Lock cycle and process discrepancies
    cycle.status = "Closed"
    
    # Fetch all lines to adjust status of affected assets
    lines = db.query(models.AuditLine).filter(models.AuditLine.audit_cycle_id == cycle.id).all()
    missing_count = 0
    damaged_count = 0
    for line in lines:
        if line.result == "Missing":
            line.asset.status = "Lost" # Flip missing to Lost status
            missing_count += 1
            
            # Close active allocations since it's lost
            active_allocs = db.query(models.Allocation).filter(
                models.Allocation.asset_id == line.asset_id,
                models.Allocation.state.in_(["approved", "overdue"])
            ).all()
            for alloc in active_allocs:
                alloc.state = "returned"
                alloc.actual_return_date = date.today()
                alloc.checkin_notes = f"Closed automatically because asset was flagged Lost in audit '{cycle.name}'"
        elif line.result == "Damaged":
            damaged_count += 1
            
    db.commit()
    log_activity(db, current_user.id, "CLOSE_AUDIT", "audit_cycles", cycle.id, f"Closed audit cycle '{cycle.name}'. Flags: {missing_count} Missing, {damaged_count} Damaged.")
    return {"message": "Audit cycle successfully closed. Discrepancies processed.", "missing": missing_count, "damaged": damaged_count}

@router.get("/audits", response_model=List[schemas.AuditCycleResponse])
def get_audit_cycles(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.AuditCycle).all()

@router.get("/audits/{cycle_id}/lines", response_model=List[schemas.AuditLineResponse])
def get_audit_lines(cycle_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.AuditLine).filter(models.AuditLine.audit_cycle_id == cycle_id).all()


# ==========================================
# 8. NOTIFICATIONS & LOGS
# ==========================================

@router.get("/notifications", response_model=List[schemas.NotificationResponse])
def get_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Notification).filter(models.Notification.recipient_id == current_user.id).order_by(models.Notification.id.desc()).all()

@router.post("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notif_id,
        models.Notification.recipient_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    notif.read_status = True
    db.commit()
    return {"message": "Notification marked as read."}

@router.get("/logs", response_model=List[schemas.ActivityLogResponse])
def get_activity_logs(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["Admin"]))):
    return db.query(models.ActivityLog).order_by(models.ActivityLog.id.desc()).all()
