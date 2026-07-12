from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, text
from typing import List, Optional
from datetime import date, datetime, timedelta
import io

from database import get_db
import models
import schemas
import auth

router = APIRouter(prefix="/api")


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def log_activity(db: Session, user_id: int, action_type: str,
                 model_ref: str, record_id: int, description: str):
    db.add(models.ActivityLog(
        user_id=user_id, action_type=action_type,
        model_ref=model_ref, record_id=record_id, description=description
    ))
    db.commit()


def notify_user(db: Session, recipient_id: int, n_type: str,
                message: str, related_ref: Optional[str] = None):
    db.add(models.Notification(
        recipient_id=recipient_id, type=n_type,
        message=message, related_record_ref=related_ref
    ))
    db.commit()


def enrich_allocation(alloc: models.Allocation) -> dict:
    d = {c.name: getattr(alloc, c.name) for c in alloc.__table__.columns}
    d["asset_tag"] = alloc.asset.tag if alloc.asset else None
    d["asset_name"] = alloc.asset.name if alloc.asset else None
    d["employee_name"] = alloc.employee.name if alloc.employee else None
    d["department_name"] = alloc.department.name if alloc.department else None
    return d


def enrich_transfer(t: models.Transfer) -> dict:
    d = {c.name: getattr(t, c.name) for c in t.__table__.columns}
    d["asset_tag"] = t.asset.tag if t.asset else None
    d["asset_name"] = t.asset.name if t.asset else None
    d["source_holder_name"] = t.source_holder.name if t.source_holder else None
    d["target_holder_name"] = t.target_holder.name if t.target_holder else None
    return d


def enrich_booking(b: models.Booking) -> dict:
    d = {c.name: getattr(b, c.name) for c in b.__table__.columns}
    d["asset_tag"] = b.asset.tag if b.asset else None
    d["asset_name"] = b.asset.name if b.asset else None
    d["booked_by_name"] = b.booked_by.name if b.booked_by else None
    return d


def enrich_maintenance(m: models.MaintenanceRequest) -> dict:
    d = {c.name: getattr(m, c.name) for c in m.__table__.columns}
    d["asset_tag"] = m.asset.tag if m.asset else None
    d["asset_name"] = m.asset.name if m.asset else None
    d["raised_by_name"] = m.raised_by.name if m.raised_by else None
    d["technician_name"] = m.technician.name if m.technician else None
    return d


def enrich_audit_line(line: models.AuditLine) -> dict:
    d = {c.name: getattr(line, c.name) for c in line.__table__.columns}
    d["asset_tag"] = line.asset.tag if line.asset else None
    d["asset_name"] = line.asset.name if line.asset else None
    d["asset_location"] = line.asset.location if line.asset else None
    return d


def enrich_audit_cycle(cycle: models.AuditCycle, db: Session) -> dict:
    d = {c.name: getattr(cycle, c.name) for c in cycle.__table__.columns}
    # Auditor IDs + names
    rows = db.execute(
        models.audit_cycle_auditors.select().where(
            models.audit_cycle_auditors.c.audit_cycle_id == cycle.id
        )
    ).fetchall()
    auditor_ids = [r.user_id for r in rows]
    users = db.query(models.User).filter(models.User.id.in_(auditor_ids)).all()
    d["auditor_ids"] = auditor_ids
    d["auditor_names"] = [u.name for u in users]
    d["total_lines"] = len(cycle.lines)
    d["verified_lines"] = sum(1 for l in cycle.lines if l.result is not None)
    return d


def enrich_log(log: models.ActivityLog, db: Session) -> dict:
    d = {c.name: getattr(log, c.name) for c in log.__table__.columns}
    user = db.query(models.User).filter(models.User.id == log.user_id).first()
    d["user_name"] = user.name if user else None
    return d


# ══════════════════════════════════════════════════════════════════════════════
# 1. AUTHENTICATION
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/auth/signup")
def signup(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(400, "An account with this email already exists.")
    disposable = ["yopmail.com", "mailinator.com", "tempmail.com", "guerrillamail.com"]
    if user_in.email.split("@")[-1].lower() in disposable:
        raise HTTPException(400, "Disposable email addresses are not permitted.")

    new_user = models.User(
        name=user_in.name,
        email=user_in.email,
        password_hash=auth.get_password_hash(user_in.password),
        department_id=user_in.department_id,
        role="Employee",   # ALWAYS Employee — security requirement
        status="Active"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    log_activity(db, new_user.id, "SIGNUP", "users", new_user.id,
                 f"Employee account created for {new_user.name}")
    return new_user


@router.post("/auth/login")
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not auth.verify_password(credentials.password, user.password_hash):
        raise HTTPException(401, "Incorrect email address or password.",
                            headers={"WWW-Authenticate": "Bearer"})
    if user.status != "Active":
        raise HTTPException(403, "Your account has been deactivated. Please contact administration.")

    token_data = {"email": user.email, "role": user.role, "user_id": user.id}
    access_token = auth.create_access_token(token_data)
    refresh_token = auth.create_refresh_token(token_data)

    log_activity(db, user.id, "LOGIN", "users", user.id,
                 f"Login from {user.email}")
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name,
        "email": user.email,
        "id": user.id,
        "department_id": user.department_id
    }


@router.get("/auth/me")
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@router.post("/auth/forgot-password")
def forgot_password(req: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        # Don't reveal whether email exists
        return {"message": "If this email exists, a reset link has been sent."}
    reset_token = auth.create_reset_token(user.email)
    # In production, send via email. For hackathon, return in response.
    return {"message": "Reset token generated.", "reset_token": reset_token,
            "note": "In production this would be sent via email."}


@router.post("/auth/reset-password")
def reset_password(req: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    email = auth.verify_reset_token(req.token)
    if not email:
        raise HTTPException(400, "Invalid or expired reset token.")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(404, "User not found.")
    user.password_hash = auth.get_password_hash(req.new_password)
    db.commit()
    log_activity(db, user.id, "RESET_PASSWORD", "users", user.id, "Password reset via token")
    return {"message": "Password updated successfully."}


# ══════════════════════════════════════════════════════════════════════════════
# 2. ORGANIZATION SETUP (Admin only)
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/departments")
def create_department(dept_in: schemas.DepartmentCreate, db: Session = Depends(get_db),
                      current_user: models.User = Depends(auth.require_role(["Admin"]))):
    if db.query(models.Department).filter(models.Department.name == dept_in.name).first():
        raise HTTPException(400, "Department name must be unique.")
    if db.query(models.Department).filter(models.Department.code == dept_in.code).first():
        raise HTTPException(400, "Department code must be unique.")
    if dept_in.parent_department_id:
        if not db.query(models.Department).filter(models.Department.id == dept_in.parent_department_id).first():
            raise HTTPException(404, "Parent department not found.")

    dept = models.Department(
        name=dept_in.name, code=dept_in.code,
        parent_department_id=dept_in.parent_department_id,
        manager_id=dept_in.manager_id, status="Active"
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    log_activity(db, current_user.id, "CREATE_DEPT", "departments", dept.id,
                 f"Created department '{dept.name}'")
    return dept


@router.put("/departments/{dept_id}")
def update_department(dept_id: int, dept_in: schemas.DepartmentUpdate,
                      db: Session = Depends(get_db),
                      current_user: models.User = Depends(auth.require_role(["Admin"]))):
    dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not dept:
        raise HTTPException(404, "Department not found.")
    for field, val in dept_in.model_dump(exclude_none=True).items():
        setattr(dept, field, val)
    db.commit()
    db.refresh(dept)
    log_activity(db, current_user.id, "UPDATE_DEPT", "departments", dept.id,
                 f"Updated department '{dept.name}'")
    return dept


@router.get("/departments")
def get_departments(db: Session = Depends(get_db),
                    current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role in ["Admin", "Asset Manager"]:
        return db.query(models.Department).all()
    elif current_user.role == "Department Head":
        return db.query(models.Department).filter(
            or_(models.Department.id == current_user.department_id,
                models.Department.parent_department_id == current_user.department_id)
        ).all()
    return db.query(models.Department).filter(
        models.Department.id == current_user.department_id).all()


@router.post("/categories")
def create_category(cat_in: schemas.CategoryCreate, db: Session = Depends(get_db),
                    current_user: models.User = Depends(auth.require_role(["Admin"]))):
    if db.query(models.AssetCategory).filter(models.AssetCategory.name == cat_in.name).first():
        raise HTTPException(400, "Category name must be unique.")
    if db.query(models.AssetCategory).filter(models.AssetCategory.code == cat_in.code).first():
        raise HTTPException(400, "Category code must be unique.")
    cat = models.AssetCategory(name=cat_in.name, code=cat_in.code, status="Active")
    db.add(cat)
    db.commit()
    db.refresh(cat)
    log_activity(db, current_user.id, "CREATE_CATEGORY", "asset_categories", cat.id,
                 f"Created category '{cat.name}'")
    return cat


@router.put("/categories/{cat_id}")
def update_category(cat_id: int, cat_in: schemas.CategoryUpdate,
                    db: Session = Depends(get_db),
                    current_user: models.User = Depends(auth.require_role(["Admin"]))):
    cat = db.query(models.AssetCategory).filter(models.AssetCategory.id == cat_id).first()
    if not cat:
        raise HTTPException(404, "Category not found.")
    for field, val in cat_in.model_dump(exclude_none=True).items():
        setattr(cat, field, val)
    db.commit()
    db.refresh(cat)
    return cat


@router.get("/categories")
def get_categories(db: Session = Depends(get_db),
                   current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.AssetCategory).all()


@router.get("/employees")
def get_employees(db: Session = Depends(get_db),
                  current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role in ["Admin", "Asset Manager"]:
        return db.query(models.User).all()
    elif current_user.role == "Department Head":
        return db.query(models.User).filter(
            models.User.department_id == current_user.department_id).all()
    return [current_user]


@router.put("/employees/{emp_id}/promote")
def promote_employee(emp_id: int, promotion: schemas.UserRoleUpdate,
                     db: Session = Depends(get_db),
                     current_user: models.User = Depends(auth.require_role(["Admin"]))):
    target = db.query(models.User).filter(models.User.id == emp_id).first()
    if not target:
        raise HTTPException(404, "Employee not found.")
    old_role = target.role
    target.role = promotion.role
    if promotion.role == "Department Head" and target.department_id:
        dept = db.query(models.Department).filter(
            models.Department.id == target.department_id).first()
        if dept:
            dept.manager_id = target.id
    db.commit()
    log_activity(db, current_user.id, "PROMOTE_ROLE", "users", target.id,
                 f"Promoted {target.name} from {old_role} to {promotion.role}")
    notify_user(db, target.id, "ROLE_CHANGE",
                f"Your role has been updated to {promotion.role}.", f"users:{target.id}")
    return {"message": f"Promoted {target.name} to {promotion.role}"}


@router.put("/employees/{emp_id}/status")
def update_employee_status(emp_id: int, status_update: schemas.UserStatusUpdate,
                           db: Session = Depends(get_db),
                           current_user: models.User = Depends(auth.require_role(["Admin"]))):
    target = db.query(models.User).filter(models.User.id == emp_id).first()
    if not target:
        raise HTTPException(404, "Employee not found.")
    target.status = status_update.status
    db.commit()
    log_activity(db, current_user.id, "UPDATE_STATUS", "users", target.id,
                 f"Set {target.name} status to {status_update.status}")
    return {"message": f"Status updated to {status_update.status}"}


# ══════════════════════════════════════════════════════════════════════════════
# 3. ASSET REGISTRATION & DIRECTORY
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/assets")
def register_asset(asset_in: schemas.AssetCreate, db: Session = Depends(get_db),
                   current_user: models.User = Depends(auth.require_role(["Admin", "Asset Manager"]))):
    if asset_in.serial_number:
        if db.query(models.Asset).filter(models.Asset.serial_number == asset_in.serial_number).first():
            raise HTTPException(400, "Asset with this serial number already exists.")

    # Generate sequential tag AF-0001, AF-0002, ...
    last = db.query(models.Asset).order_by(models.Asset.id.desc()).first()
    next_num = 1 if not last else last.id + 1
    tag = f"AF-{next_num:04d}"

    asset = models.Asset(
        tag=tag, name=asset_in.name, category_id=asset_in.category_id,
        serial_number=asset_in.serial_number, acquisition_date=asset_in.acquisition_date,
        acquisition_cost=asset_in.acquisition_cost, condition=asset_in.condition,
        location=asset_in.location, shared_flag=asset_in.shared_flag,
        status="Available"
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    log_activity(db, current_user.id, "REGISTER_ASSET", "assets", asset.id,
                 f"Registered {asset.name} ({tag})")
    return asset


@router.get("/assets")
def get_assets(
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Asset)

    # Role scoping
    if current_user.role == "Employee":
        allocated_ids = db.query(models.Allocation.asset_id).filter(
            models.Allocation.employee_id == current_user.id,
            models.Allocation.state.in_(["approved", "overdue"])
        ).subquery()
        query = query.filter(
            or_(models.Asset.id.in_(allocated_ids), models.Asset.shared_flag == True)
        )
    elif current_user.role == "Department Head":
        allocated_ids = db.query(models.Allocation.asset_id).filter(
            or_(
                models.Allocation.department_id == current_user.department_id,
                models.Allocation.employee_id == current_user.id
            ),
            models.Allocation.state.in_(["approved", "overdue"])
        ).subquery()
        query = query.filter(
            or_(models.Asset.id.in_(allocated_ids), models.Asset.shared_flag == True)
        )

    # Filters
    if search:
        query = query.filter(
            or_(
                models.Asset.tag.ilike(f"%{search}%"),
                models.Asset.name.ilike(f"%{search}%"),
                models.Asset.serial_number.ilike(f"%{search}%")
            )
        )
    if category_id:
        query = query.filter(models.Asset.category_id == category_id)
    if status:
        query = query.filter(models.Asset.status == status)
    if location:
        query = query.filter(models.Asset.location.ilike(f"%{location}%"))

    return query.all()


@router.get("/assets/{asset_id}")
def get_asset_by_id(asset_id: int, db: Session = Depends(get_db),
                    current_user: models.User = Depends(auth.get_current_user)):
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(404, "Asset not found.")
    # Build detail response
    alloc_history = [enrich_allocation(a) for a in asset.allocations]
    maint_history = [enrich_maintenance(m) for m in asset.maintenance_records]
    result = {c.name: getattr(asset, c.name) for c in asset.__table__.columns}
    result["allocation_history"] = alloc_history
    result["maintenance_history"] = maint_history
    return result


@router.put("/assets/{asset_id}")
def update_asset(asset_id: int, asset_in: schemas.AssetUpdate,
                 db: Session = Depends(get_db),
                 current_user: models.User = Depends(auth.require_role(["Admin", "Asset Manager"]))):
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(404, "Asset not found.")
    for field, val in asset_in.model_dump(exclude_none=True).items():
        setattr(asset, field, val)
    db.commit()
    db.refresh(asset)
    log_activity(db, current_user.id, "UPDATE_ASSET", "assets", asset.id,
                 f"Updated asset {asset.tag}")
    return asset


# ══════════════════════════════════════════════════════════════════════════════
# 4. ALLOCATIONS & TRANSFERS
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/allocations")
def allocate_asset(alloc_in: schemas.AllocationCreate, db: Session = Depends(get_db),
                   current_user: models.User = Depends(auth.require_role(["Admin", "Asset Manager"]))):
    asset = db.query(models.Asset).filter(
        models.Asset.id == alloc_in.asset_id).with_for_update().first()
    if not asset:
        raise HTTPException(404, "Asset not found.")

    if asset.status != "Available":
        # Find current holder for 409 response
        active_alloc = db.query(models.Allocation).filter(
            models.Allocation.asset_id == asset.id,
            models.Allocation.state.in_(["approved", "overdue"])
        ).first()
        holder_info = {}
        if active_alloc and active_alloc.employee:
            holder_info = {
                "id": active_alloc.employee.id,
                "name": active_alloc.employee.name,
                "department": active_alloc.department.name if active_alloc.department else None,
                "allocation_id": active_alloc.id
            }
        raise HTTPException(
            status_code=409,
            detail={
                "message": f"Asset is currently '{asset.status}'.",
                "held_by": holder_info
            }
        )

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
    asset.status = "Allocated"
    db.commit()
    db.refresh(new_alloc)

    log_activity(db, current_user.id, "ALLOCATE_ASSET", "allocations", new_alloc.id,
                 f"Allocated {asset.tag} to user {alloc_in.employee_id}")
    notify_user(db, alloc_in.employee_id, "ASSET_ASSIGNED",
                f"Asset '{asset.name}' ({asset.tag}) has been allocated to you.",
                f"assets:{asset.id}")
    return enrich_allocation(new_alloc)


@router.post("/allocations/{alloc_id}/return")
def return_asset(alloc_id: int, checkin: schemas.ReturnCheckin,
                 db: Session = Depends(get_db),
                 current_user: models.User = Depends(auth.require_role(["Admin", "Asset Manager"]))):
    alloc = db.query(models.Allocation).filter(models.Allocation.id == alloc_id).first()
    if not alloc:
        raise HTTPException(404, "Allocation record not found.")
    if alloc.state in ["returned"]:
        raise HTTPException(400, "Asset already returned.")

    alloc.state = "returned"
    alloc.actual_return_date = date.today()
    alloc.condition_at_return = checkin.condition_at_return
    alloc.checkin_notes = checkin.checkin_notes

    asset = alloc.asset
    asset.status = "Available"
    asset.condition = checkin.condition_at_return
    db.commit()

    log_activity(db, current_user.id, "RETURN_ASSET", "allocations", alloc.id,
                 f"Returned {asset.tag}. Condition: {checkin.condition_at_return}")
    return enrich_allocation(alloc)


@router.get("/allocations")
def get_allocations(db: Session = Depends(get_db),
                    current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role in ["Admin", "Asset Manager"]:
        allocs = db.query(models.Allocation).order_by(models.Allocation.id.desc()).all()
    elif current_user.role == "Department Head":
        allocs = db.query(models.Allocation).filter(
            or_(models.Allocation.department_id == current_user.department_id,
                models.Allocation.employee_id == current_user.id)
        ).order_by(models.Allocation.id.desc()).all()
    else:
        allocs = db.query(models.Allocation).filter(
            models.Allocation.employee_id == current_user.id
        ).order_by(models.Allocation.id.desc()).all()
    return [enrich_allocation(a) for a in allocs]


@router.post("/transfers")
def request_transfer(trans_in: schemas.TransferCreate, db: Session = Depends(get_db),
                     current_user: models.User = Depends(auth.get_current_user)):
    asset = db.query(models.Asset).filter(models.Asset.id == trans_in.asset_id).first()
    if not asset:
        raise HTTPException(404, "Asset not found.")
    active_alloc = db.query(models.Allocation).filter(
        models.Allocation.asset_id == asset.id,
        models.Allocation.state.in_(["approved", "overdue"])
    ).first()
    if not active_alloc:
        raise HTTPException(400, "Cannot transfer an asset that is not currently allocated.")

    trans = models.Transfer(
        asset_id=asset.id,
        source_holder_id=active_alloc.employee_id,
        target_holder_id=trans_in.target_holder_id,
        requested_by_id=current_user.id,
        state="Requested",
        reason=trans_in.reason
    )
    db.add(trans)
    db.commit()
    db.refresh(trans)

    log_activity(db, current_user.id, "REQUEST_TRANSFER", "transfers", trans.id,
                 f"Transfer request for {asset.tag} to user {trans_in.target_holder_id}")
    manager = db.query(models.User).filter(models.User.role == "Asset Manager").first()
    if manager:
        notify_user(db, manager.id, "TRANSFER_REQUEST",
                    f"Transfer requested for {asset.tag} by {current_user.name}.",
                    f"transfers:{trans.id}")
    return enrich_transfer(trans)


@router.post("/transfers/{trans_id}/approve")
def approve_transfer(trans_id: int, db: Session = Depends(get_db),
                     current_user: models.User = Depends(
                         auth.require_role(["Admin", "Asset Manager", "Department Head"]))):
    transfer = db.query(models.Transfer).filter(models.Transfer.id == trans_id).first()
    if not transfer:
        raise HTTPException(404, "Transfer request not found.")
    if transfer.state != "Requested":
        raise HTTPException(400, "Transfer has already been processed.")

    # Close old allocation
    old_alloc = db.query(models.Allocation).filter(
        models.Allocation.asset_id == transfer.asset_id,
        models.Allocation.state.in_(["approved", "overdue"])
    ).first()
    if old_alloc:
        old_alloc.state = "returned"
        old_alloc.actual_return_date = date.today()
        old_alloc.checkin_notes = f"Closed via transfer #{transfer.id}"

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

    log_activity(db, current_user.id, "APPROVE_TRANSFER", "transfers", transfer.id,
                 f"Approved transfer of {transfer.asset.tag}")
    notify_user(db, transfer.target_holder_id, "TRANSFER_APPROVED",
                f"Custody transfer for {transfer.asset.name} approved.",
                f"assets:{transfer.asset.id}")
    return enrich_transfer(transfer)


@router.post("/transfers/{trans_id}/reject")
def reject_transfer(trans_id: int, reject_in: schemas.TransferReject,
                    db: Session = Depends(get_db),
                    current_user: models.User = Depends(
                        auth.require_role(["Admin", "Asset Manager", "Department Head"]))):
    transfer = db.query(models.Transfer).filter(models.Transfer.id == trans_id).first()
    if not transfer:
        raise HTTPException(404, "Transfer request not found.")
    if transfer.state != "Requested":
        raise HTTPException(400, "Transfer has already been processed.")

    transfer.state = "Rejected"
    transfer.manager_id = current_user.id
    transfer.approval_date = date.today()
    db.commit()

    log_activity(db, current_user.id, "REJECT_TRANSFER", "transfers", transfer.id,
                 f"Rejected transfer of {transfer.asset.tag}")
    notify_user(db, transfer.requested_by_id, "TRANSFER_REJECTED",
                f"Transfer for {transfer.asset.name} was rejected.",
                f"transfers:{transfer.id}")
    return enrich_transfer(transfer)


@router.get("/transfers")
def get_transfers(db: Session = Depends(get_db),
                  current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role in ["Admin", "Asset Manager"]:
        transfers = db.query(models.Transfer).order_by(models.Transfer.id.desc()).all()
    else:
        transfers = db.query(models.Transfer).filter(
            or_(models.Transfer.requested_by_id == current_user.id,
                models.Transfer.target_holder_id == current_user.id)
        ).order_by(models.Transfer.id.desc()).all()
    return [enrich_transfer(t) for t in transfers]


# ══════════════════════════════════════════════════════════════════════════════
# 5. RESOURCE BOOKING
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/bookings")
def create_booking(book_in: schemas.BookingCreate, db: Session = Depends(get_db),
                   current_user: models.User = Depends(auth.get_current_user)):
    asset = db.query(models.Asset).filter(
        models.Asset.id == book_in.asset_id).with_for_update().first()
    if not asset:
        raise HTTPException(404, "Asset not found.")
    if not asset.shared_flag:
        raise HTTPException(400, "This asset is not a shared bookable resource.")
    if book_in.end_time <= book_in.start_time:
        raise HTTPException(400, "End time must be after start time.")

    # Strict overlap check (back-to-back allowed: end == start of next is OK)
    overlaps = db.query(models.Booking).filter(
        models.Booking.asset_id == book_in.asset_id,
        models.Booking.status.notin_(["Cancelled", "Completed"]),
        models.Booking.end_time > book_in.start_time,
        models.Booking.start_time < book_in.end_time
    ).all()

    if overlaps:
        ob = overlaps[0]
        raise HTTPException(
            status_code=409,
            detail={
                "message": "Booking overlap detected.",
                "conflicting": {
                    "id": ob.id,
                    "booked_by": ob.booked_by.name if ob.booked_by else "Unknown",
                    "start_time": ob.start_time.isoformat(),
                    "end_time": ob.end_time.isoformat(),
                    "purpose": ob.purpose
                }
            }
        )

    booking = models.Booking(
        asset_id=book_in.asset_id, booked_by_id=current_user.id,
        start_time=book_in.start_time, end_time=book_in.end_time,
        purpose=book_in.purpose, status="Upcoming"
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    log_activity(db, current_user.id, "CREATE_BOOKING", "bookings", booking.id,
                 f"Booked {asset.tag} from {book_in.start_time} to {book_in.end_time}")
    return enrich_booking(booking)


@router.get("/bookings")
def get_bookings(
    asset_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role in ["Admin", "Asset Manager"]:
        query = db.query(models.Booking)
    else:
        query = db.query(models.Booking).filter(
            models.Booking.booked_by_id == current_user.id)
    if asset_id:
        query = query.filter(models.Booking.asset_id == asset_id)
    return [enrich_booking(b) for b in query.order_by(models.Booking.start_time.desc()).all()]


@router.get("/bookings/all")
def get_all_bookings_for_asset(asset_id: int, db: Session = Depends(get_db),
                               current_user: models.User = Depends(auth.get_current_user)):
    """Get all bookings for a specific shared asset (for calendar display)."""
    bookings = db.query(models.Booking).filter(
        models.Booking.asset_id == asset_id,
        models.Booking.status.notin_(["Cancelled"])
    ).all()
    return [enrich_booking(b) for b in bookings]


@router.post("/bookings/{book_id}/cancel")
def cancel_booking(book_id: int, db: Session = Depends(get_db),
                   current_user: models.User = Depends(auth.get_current_user)):
    booking = db.query(models.Booking).filter(models.Booking.id == book_id).first()
    if not booking:
        raise HTTPException(404, "Booking not found.")
    if current_user.role not in ["Admin", "Asset Manager"] and \
            booking.booked_by_id != current_user.id:
        raise HTTPException(403, "Cannot cancel bookings of other employees.")
    if booking.status in ["Completed", "Cancelled"]:
        raise HTTPException(400, f"Booking is already {booking.status}.")
    booking.status = "Cancelled"
    db.commit()
    log_activity(db, current_user.id, "CANCEL_BOOKING", "bookings", booking.id,
                 f"Cancelled booking {book_id} on {booking.asset.tag}")
    return enrich_booking(booking)


# ══════════════════════════════════════════════════════════════════════════════
# 6. MAINTENANCE KANBAN
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/maintenance")
def raise_maintenance(req_in: schemas.MaintenanceCreate, db: Session = Depends(get_db),
                      current_user: models.User = Depends(auth.get_current_user)):
    asset = db.query(models.Asset).filter(models.Asset.id == req_in.asset_id).first()
    if not asset:
        raise HTTPException(404, "Asset not found.")
    active = db.query(models.MaintenanceRequest).filter(
        models.MaintenanceRequest.asset_id == asset.id,
        models.MaintenanceRequest.status.notin_(["Resolved", "Rejected"])
    ).first()
    if active:
        raise HTTPException(400, "This asset already has an open maintenance request.")

    req = models.MaintenanceRequest(
        asset_id=req_in.asset_id, raised_by_id=current_user.id,
        issue_description=req_in.issue_description, priority=req_in.priority,
        status="Pending"
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    log_activity(db, current_user.id, "CREATE_MAINTENANCE", "maintenance_requests", req.id,
                 f"Raised maintenance for {asset.tag} — {req_in.priority} priority")
    # Notify asset managers
    managers = db.query(models.User).filter(
        models.User.role.in_(["Admin", "Asset Manager"])).all()
    for mgr in managers:
        notify_user(db, mgr.id, "MAINTENANCE_RAISED",
                    f"Maintenance request raised for {asset.tag} ({req_in.priority}).",
                    f"maintenance:{req.id}")
    return enrich_maintenance(req)


@router.post("/maintenance/{maint_id}/approve")
def approve_maintenance(maint_id: int, db: Session = Depends(get_db),
                        current_user: models.User = Depends(
                            auth.require_role(["Admin", "Asset Manager"]))):
    req = db.query(models.MaintenanceRequest).filter(
        models.MaintenanceRequest.id == maint_id).first()
    if not req:
        raise HTTPException(404, "Maintenance record not found.")
    if req.status != "Pending":
        raise HTTPException(400, "Request has already been processed.")
    req.status = "Approved"
    req.approved_by_id = current_user.id
    req.approval_date = date.today()
    req.asset.status = "Under Maintenance"
    db.commit()
    log_activity(db, current_user.id, "APPROVE_MAINTENANCE", "maintenance_requests", req.id,
                 f"Approved maintenance for {req.asset.tag} → Under Maintenance")
    notify_user(db, req.raised_by_id, "MAINTENANCE_APPROVED",
                f"Maintenance for {req.asset.name} approved.", f"maintenance:{req.id}")
    return enrich_maintenance(req)


@router.post("/maintenance/{maint_id}/reject")
def reject_maintenance(maint_id: int, reject_in: schemas.MaintenanceReject,
                       db: Session = Depends(get_db),
                       current_user: models.User = Depends(
                           auth.require_role(["Admin", "Asset Manager"]))):
    req = db.query(models.MaintenanceRequest).filter(
        models.MaintenanceRequest.id == maint_id).first()
    if not req:
        raise HTTPException(404, "Maintenance record not found.")
    if req.status != "Pending":
        raise HTTPException(400, "Request has already been processed.")
    req.status = "Rejected"
    req.rejection_reason = reject_in.rejection_reason
    db.commit()
    log_activity(db, current_user.id, "REJECT_MAINTENANCE", "maintenance_requests", req.id,
                 f"Rejected maintenance for {req.asset.tag}")
    notify_user(db, req.raised_by_id, "MAINTENANCE_REJECTED",
                f"Maintenance for {req.asset.name} was rejected: {reject_in.rejection_reason}",
                f"maintenance:{req.id}")
    return enrich_maintenance(req)


@router.post("/maintenance/{maint_id}/assign")
def assign_maintenance(maint_id: int, assign: schemas.MaintenanceAssign,
                       db: Session = Depends(get_db),
                       current_user: models.User = Depends(
                           auth.require_role(["Admin", "Asset Manager"]))):
    req = db.query(models.MaintenanceRequest).filter(
        models.MaintenanceRequest.id == maint_id).first()
    if not req:
        raise HTTPException(404, "Maintenance record not found.")
    if req.status not in ["Approved", "Assigned"]:
        raise HTTPException(400, "Must be Approved before assigning.")
    req.status = "Assigned"
    req.technician_id = assign.technician_id
    db.commit()
    log_activity(db, current_user.id, "ASSIGN_MAINTENANCE", "maintenance_requests", req.id,
                 f"Assigned technician {assign.technician_id} to {req.asset.tag}")
    notify_user(db, assign.technician_id, "TASK_ASSIGNED",
                f"You are assigned to repair {req.asset.tag}.", f"maintenance:{req.id}")
    return enrich_maintenance(req)


@router.post("/maintenance/{maint_id}/start")
def start_maintenance(maint_id: int, db: Session = Depends(get_db),
                      current_user: models.User = Depends(auth.get_current_user)):
    req = db.query(models.MaintenanceRequest).filter(
        models.MaintenanceRequest.id == maint_id).first()
    if not req:
        raise HTTPException(404, "Maintenance record not found.")
    if current_user.role not in ["Admin", "Asset Manager"] and \
            req.technician_id != current_user.id:
        raise HTTPException(403, "Not the assigned technician.")
    if req.status != "Assigned":
        raise HTTPException(400, "Must be Assigned first.")
    req.status = "In Progress"
    db.commit()
    log_activity(db, current_user.id, "START_MAINTENANCE", "maintenance_requests", req.id,
                 f"Started repair on {req.asset.tag}")
    return enrich_maintenance(req)


@router.post("/maintenance/{maint_id}/resolve")
def resolve_maintenance(maint_id: int, action: schemas.MaintenanceResolve,
                        db: Session = Depends(get_db),
                        current_user: models.User = Depends(auth.get_current_user)):
    req = db.query(models.MaintenanceRequest).filter(
        models.MaintenanceRequest.id == maint_id).first()
    if not req:
        raise HTTPException(404, "Maintenance record not found.")
    if current_user.role not in ["Admin", "Asset Manager"] and \
            req.technician_id != current_user.id:
        raise HTTPException(403, "Not the assigned technician.")
    if req.status != "In Progress":
        raise HTTPException(400, "Must be In Progress to resolve.")
    req.status = "Resolved"
    req.resolution_notes = action.resolution_notes
    req.resolved_date = date.today()
    req.asset.status = "Available"
    db.commit()
    log_activity(db, current_user.id, "RESOLVE_MAINTENANCE", "maintenance_requests", req.id,
                 f"Resolved {req.asset.tag} → Available. Notes: {action.resolution_notes}")
    notify_user(db, req.raised_by_id, "MAINTENANCE_RESOLVED",
                f"Maintenance for {req.asset.name} resolved.", f"maintenance:{req.id}")
    return enrich_maintenance(req)


@router.get("/maintenance")
def get_maintenance(db: Session = Depends(get_db),
                    current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role in ["Admin", "Asset Manager"]:
        reqs = db.query(models.MaintenanceRequest).order_by(
            models.MaintenanceRequest.id.desc()).all()
    else:
        reqs = db.query(models.MaintenanceRequest).filter(
            or_(models.MaintenanceRequest.raised_by_id == current_user.id,
                models.MaintenanceRequest.technician_id == current_user.id)
        ).order_by(models.MaintenanceRequest.id.desc()).all()
    return [enrich_maintenance(m) for m in reqs]


# ══════════════════════════════════════════════════════════════════════════════
# 7. AUDIT CYCLES
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/audits")
def create_audit_cycle(audit_in: schemas.AuditCycleCreate, db: Session = Depends(get_db),
                       current_user: models.User = Depends(auth.require_role(["Admin"]))):
    if audit_in.end_date < audit_in.start_date:
        raise HTTPException(400, "End date must be on or after start date.")
    if not audit_in.auditor_ids:
        raise HTTPException(400, "At least one auditor required.")

    cycle = models.AuditCycle(
        name=audit_in.name,
        scope_department_id=audit_in.scope_department_id,
        scope_location=audit_in.scope_location,
        start_date=audit_in.start_date,
        end_date=audit_in.end_date,
        status="In Progress"
    )
    db.add(cycle)
    db.commit()
    db.refresh(cycle)

    for uid in audit_in.auditor_ids:
        db.execute(
            models.audit_cycle_auditors.insert().values(
                audit_cycle_id=cycle.id, user_id=uid)
        )
    db.commit()

    # Auto-generate audit lines
    query = db.query(models.Asset).filter(
        models.Asset.status.notin_(["Retired", "Disposed"]))
    if audit_in.scope_department_id:
        dep_asset_ids = db.query(models.Allocation.asset_id).filter(
            models.Allocation.department_id == audit_in.scope_department_id,
            models.Allocation.state.in_(["approved", "overdue"])
        ).subquery()
        query = query.filter(models.Asset.id.in_(dep_asset_ids))
    if audit_in.scope_location:
        query = query.filter(models.Asset.location == audit_in.scope_location)

    assets = query.all()
    for asset in assets:
        db.add(models.AuditLine(audit_cycle_id=cycle.id, asset_id=asset.id, result=None))
    db.commit()
    db.refresh(cycle)

    log_activity(db, current_user.id, "CREATE_AUDIT", "audit_cycles", cycle.id,
                 f"Created audit '{cycle.name}' with {len(assets)} assets")
    for uid in audit_in.auditor_ids:
        notify_user(db, uid, "AUDIT_ASSIGNED",
                    f"You are assigned to audit '{cycle.name}'.", f"audits:{cycle.id}")
    return enrich_audit_cycle(cycle, db)


@router.get("/audits")
def get_audit_cycles(db: Session = Depends(get_db),
                     current_user: models.User = Depends(auth.get_current_user)):
    cycles = db.query(models.AuditCycle).order_by(models.AuditCycle.id.desc()).all()
    return [enrich_audit_cycle(c, db) for c in cycles]


@router.get("/audits/{cycle_id}/lines")
def get_audit_lines(cycle_id: int, db: Session = Depends(get_db),
                    current_user: models.User = Depends(auth.get_current_user)):
    lines = db.query(models.AuditLine).filter(
        models.AuditLine.audit_cycle_id == cycle_id).all()
    return [enrich_audit_line(l) for l in lines]


@router.put("/audits/{cycle_id}/lines/{line_id}")
def verify_audit_line(cycle_id: int, line_id: int, line_up: schemas.AuditLineUpdate,
                      db: Session = Depends(get_db),
                      current_user: models.User = Depends(auth.get_current_user)):
    cycle = db.query(models.AuditCycle).filter(models.AuditCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(404, "Audit cycle not found.")
    if cycle.status == "Closed":
        raise HTTPException(400, "Cannot modify a closed audit cycle.")

    # Check auditor authorization
    if current_user.role != "Admin":
        assoc = db.execute(
            models.audit_cycle_auditors.select().where(
                and_(models.audit_cycle_auditors.c.audit_cycle_id == cycle_id,
                     models.audit_cycle_auditors.c.user_id == current_user.id)
            )
        ).first()
        if not assoc:
            raise HTTPException(403, "Not authorized as an auditor for this cycle.")

    line = db.query(models.AuditLine).filter(
        models.AuditLine.id == line_id,
        models.AuditLine.audit_cycle_id == cycle_id
    ).first()
    if not line:
        raise HTTPException(404, "Audit line not found.")

    line.result = line_up.result
    line.notes = line_up.notes
    line.verified_by_id = current_user.id
    line.verification_date = date.today()
    db.commit()
    db.refresh(line)

    if line_up.result in ["Missing", "Damaged"]:
        for mgr in db.query(models.User).filter(
                models.User.role.in_(["Admin", "Asset Manager"])).all():
            notify_user(db, mgr.id, "AUDIT_DISCREPANCY",
                        f"Discrepancy: {line.asset.tag} flagged as {line_up.result}.",
                        f"audits:{cycle_id}")
    return enrich_audit_line(line)


@router.post("/audits/{cycle_id}/close")
def close_audit_cycle(cycle_id: int, db: Session = Depends(get_db),
                      current_user: models.User = Depends(auth.require_role(["Admin"]))):
    cycle = db.query(models.AuditCycle).filter(models.AuditCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(404, "Audit cycle not found.")
    if cycle.status == "Closed":
        raise HTTPException(400, "Audit cycle already closed.")

    unverified = [l for l in cycle.lines if l.result is None]
    if unverified:
        raise HTTPException(400, f"Cannot close: {len(unverified)} assets still unverified.")

    cycle.status = "Closed"
    missing_count = damaged_count = 0
    for line in cycle.lines:
        if line.result == "Missing":
            line.asset.status = "Lost"
            missing_count += 1
            # Close active allocations
            for alloc in db.query(models.Allocation).filter(
                    models.Allocation.asset_id == line.asset_id,
                    models.Allocation.state.in_(["approved", "overdue"])).all():
                alloc.state = "returned"
                alloc.actual_return_date = date.today()
                alloc.checkin_notes = f"Auto-closed: asset flagged Lost in audit '{cycle.name}'"
        elif line.result == "Damaged":
            damaged_count += 1

    db.commit()
    log_activity(db, current_user.id, "CLOSE_AUDIT", "audit_cycles", cycle.id,
                 f"Closed audit '{cycle.name}'. Missing: {missing_count}, Damaged: {damaged_count}")
    return {"message": "Audit closed.", "missing": missing_count, "damaged": damaged_count}


# ══════════════════════════════════════════════════════════════════════════════
# 8. DASHBOARD KPIs
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/dashboard/kpis")
def get_dashboard_kpis(db: Session = Depends(get_db),
                       current_user: models.User = Depends(auth.get_current_user)):
    today = date.today()

    # Role-scoped asset query
    if current_user.role in ["Admin", "Asset Manager"]:
        assets = db.query(models.Asset).all()
        allocs = db.query(models.Allocation).filter(
            models.Allocation.state.in_(["approved", "overdue"])).all()
        bookings = db.query(models.Booking).filter(
            models.Booking.status.in_(["Upcoming", "Ongoing"])).all()
        transfers = db.query(models.Transfer).filter(
            models.Transfer.state == "Requested").all()
    elif current_user.role == "Department Head":
        dept_alloc_ids = db.query(models.Allocation.asset_id).filter(
            models.Allocation.department_id == current_user.department_id,
            models.Allocation.state.in_(["approved", "overdue"])
        ).subquery()
        assets = db.query(models.Asset).filter(models.Asset.id.in_(dept_alloc_ids)).all()
        allocs = db.query(models.Allocation).filter(
            models.Allocation.department_id == current_user.department_id,
            models.Allocation.state.in_(["approved", "overdue"])).all()
        bookings = db.query(models.Booking).filter(
            models.Booking.booked_by_id == current_user.id,
            models.Booking.status.in_(["Upcoming", "Ongoing"])).all()
        transfers = db.query(models.Transfer).filter(
            or_(models.Transfer.requested_by_id == current_user.id,
                models.Transfer.target_holder_id == current_user.id),
            models.Transfer.state == "Requested").all()
    else:  # Employee
        assets = db.query(models.Asset).filter(models.Asset.shared_flag == True).all()
        allocs = db.query(models.Allocation).filter(
            models.Allocation.employee_id == current_user.id,
            models.Allocation.state.in_(["approved", "overdue"])).all()
        bookings = db.query(models.Booking).filter(
            models.Booking.booked_by_id == current_user.id,
            models.Booking.status.in_(["Upcoming", "Ongoing"])).all()
        transfers = []

    available = sum(1 for a in assets if a.status == "Available")
    allocated = sum(1 for a in assets if a.status == "Allocated")
    under_maint = sum(1 for a in assets if a.status == "Under Maintenance")
    total = len(assets)

    overdue_returns = [a for a in allocs
                       if a.expected_return_date and a.expected_return_date < today]
    upcoming_returns = [a for a in allocs if not a.expected_return_date or
                        a.expected_return_date >= today]

    # Recent activity
    logs = db.query(models.ActivityLog).order_by(
        models.ActivityLog.id.desc()).limit(10).all()

    return {
        "available": available,
        "allocated": allocated,
        "under_maintenance": under_maint,
        "active_bookings": len(bookings),
        "pending_transfers": len(transfers),
        "upcoming_returns": len(upcoming_returns),
        "overdue_returns": len(overdue_returns),
        "total_assets": total,
        "overdue_list": [enrich_allocation(a) for a in overdue_returns],
        "recent_activity": [enrich_log(l, db) for l in logs]
    }


# ══════════════════════════════════════════════════════════════════════════════
# 9. REPORTS
# ══════════════════════════════════════════════════════════════════════════════

def _make_xlsx(headers: list, rows: list, sheet_name: str) -> bytes:
    from openpyxl import Workbook
    wb = Workbook()
    ws = wb.active
    ws.title = sheet_name
    ws.append(headers)
    for row in rows:
        ws.append(row)
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def _make_pdf(title: str, headers: list, rows: list) -> bytes:
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A4))
    styles = getSampleStyleSheet()
    elements = [Paragraph(title, styles["Title"]), Spacer(1, 12)]

    table_data = [headers] + [[str(c) for c in row] for row in rows]
    t = Table(table_data)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F6E5F")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F6F7F9")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DFE3E9")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(t)
    doc.build(elements)
    return buf.getvalue()


@router.get("/reports/utilization")
def report_utilization(
    export: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["Admin", "Asset Manager", "Department Head"]))
):
    depts = db.query(models.Department).filter(models.Department.status == "Active").all()
    rows = []
    for dept in depts:
        total = db.query(models.Allocation).filter(
            models.Allocation.department_id == dept.id).count()
        active = db.query(models.Allocation).filter(
            models.Allocation.department_id == dept.id,
            models.Allocation.state.in_(["approved", "overdue"])).count()
        rows.append({
            "department": dept.name,
            "total_allocations": total,
            "active_allocations": active,
            "utilization_pct": round(active / total * 100, 1) if total else 0
        })

    if export == "xlsx":
        data = _make_xlsx(
            ["Department", "Total Allocations", "Active Allocations", "Utilization %"],
            [[r["department"], r["total_allocations"], r["active_allocations"], r["utilization_pct"]]
             for r in rows],
            "Utilization"
        )
        return StreamingResponse(io.BytesIO(data), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                 headers={"Content-Disposition": "attachment; filename=utilization.xlsx"})
    if export == "pdf":
        data = _make_pdf("Utilization by Department",
                         ["Department", "Total", "Active", "Utilization %"],
                         [[r["department"], r["total_allocations"], r["active_allocations"], r["utilization_pct"]]
                          for r in rows])
        return StreamingResponse(io.BytesIO(data), media_type="application/pdf",
                                 headers={"Content-Disposition": "attachment; filename=utilization.pdf"})
    return rows


@router.get("/reports/maintenance-frequency")
def report_maintenance_frequency(
    export: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["Admin", "Asset Manager", "Department Head"]))
):
    from sqlalchemy import func
    results = db.query(
        models.Asset.tag, models.Asset.name,
        func.count(models.MaintenanceRequest.id).label("total"),
        func.sum(
            (models.MaintenanceRequest.status == "Resolved").cast(int)
        ).label("resolved")
    ).join(models.MaintenanceRequest, models.Asset.id == models.MaintenanceRequest.asset_id,
           isouter=True).group_by(models.Asset.id).order_by(
        func.count(models.MaintenanceRequest.id).desc()
    ).limit(20).all()

    rows = [{"tag": r.tag, "name": r.name, "total": r.total or 0, "resolved": r.resolved or 0}
            for r in results]

    if export == "xlsx":
        data = _make_xlsx(["Tag", "Asset Name", "Total Requests", "Resolved"],
                          [[r["tag"], r["name"], r["total"], r["resolved"]] for r in rows],
                          "Maintenance Frequency")
        return StreamingResponse(io.BytesIO(data),
                                 media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                 headers={"Content-Disposition": "attachment; filename=maintenance_frequency.xlsx"})
    if export == "pdf":
        data = _make_pdf("Maintenance Frequency",
                         ["Tag", "Asset Name", "Total Requests", "Resolved"],
                         [[r["tag"], r["name"], r["total"], r["resolved"]] for r in rows])
        return StreamingResponse(io.BytesIO(data), media_type="application/pdf",
                                 headers={"Content-Disposition": "attachment; filename=maintenance_frequency.pdf"})
    return rows


@router.get("/reports/allocation-summary")
def report_allocation_summary(
    export: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["Admin", "Asset Manager", "Department Head"]))
):
    assets = db.query(models.Asset).all()
    rows = []
    for asset in assets:
        alloc_count = len(asset.allocations)
        active_alloc = next((a for a in asset.allocations
                             if a.state in ["approved", "overdue"]), None)
        rows.append({
            "tag": asset.tag,
            "name": asset.name,
            "status": asset.status,
            "location": asset.location,
            "total_allocations": alloc_count,
            "current_holder": active_alloc.employee.name if active_alloc and active_alloc.employee else None
        })

    if export == "xlsx":
        data = _make_xlsx(
            ["Tag", "Name", "Status", "Location", "Total Allocations", "Current Holder"],
            [[r["tag"], r["name"], r["status"], r["location"], r["total_allocations"],
              r["current_holder"] or ""] for r in rows],
            "Allocation Summary"
        )
        return StreamingResponse(io.BytesIO(data),
                                 media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                 headers={"Content-Disposition": "attachment; filename=allocation_summary.xlsx"})
    if export == "pdf":
        data = _make_pdf("Allocation Summary",
                         ["Tag", "Name", "Status", "Location", "Allocations", "Holder"],
                         [[r["tag"], r["name"], r["status"], r["location"], r["total_allocations"],
                           r["current_holder"] or ""] for r in rows])
        return StreamingResponse(io.BytesIO(data), media_type="application/pdf",
                                 headers={"Content-Disposition": "attachment; filename=allocation_summary.pdf"})
    return rows


@router.get("/reports/booking-heatmap")
def report_booking_heatmap(
    export: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["Admin", "Asset Manager", "Department Head"]))
):
    bookings = db.query(models.Booking).filter(
        models.Booking.status != "Cancelled").all()

    # Build heatmap: day_of_week x hour_of_day
    heatmap = {}
    for b in bookings:
        dow = b.start_time.weekday()  # 0=Mon
        hour = b.start_time.hour
        key = (dow, hour)
        heatmap[key] = heatmap.get(key, 0) + 1

    rows = [{"day": k[0], "hour": k[1], "count": v} for k, v in heatmap.items()]

    if export == "xlsx":
        data = _make_xlsx(["Day (0=Mon)", "Hour", "Booking Count"],
                          [[r["day"], r["hour"], r["count"]] for r in rows],
                          "Booking Heatmap")
        return StreamingResponse(io.BytesIO(data),
                                 media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                 headers={"Content-Disposition": "attachment; filename=booking_heatmap.xlsx"})
    return rows


# ══════════════════════════════════════════════════════════════════════════════
# 10. NOTIFICATIONS & LOGS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/notifications")
def get_notifications(db: Session = Depends(get_db),
                      current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Notification).filter(
        models.Notification.recipient_id == current_user.id
    ).order_by(models.Notification.id.desc()).all()


@router.post("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, db: Session = Depends(get_db),
                           current_user: models.User = Depends(auth.get_current_user)):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notif_id,
        models.Notification.recipient_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(404, "Notification not found.")
    notif.read_status = True
    db.commit()
    return {"message": "Marked as read."}


@router.post("/notifications/read-all")
def mark_all_read(db: Session = Depends(get_db),
                  current_user: models.User = Depends(auth.get_current_user)):
    db.query(models.Notification).filter(
        models.Notification.recipient_id == current_user.id,
        models.Notification.read_status == False
    ).update({"read_status": True})
    db.commit()
    return {"message": "All notifications marked as read."}


@router.get("/logs")
def get_activity_logs(
    action_type: Optional[str] = Query(None),
    limit: int = Query(100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role == "Admin":
        query = db.query(models.ActivityLog)
    else:
        query = db.query(models.ActivityLog).filter(
            models.ActivityLog.user_id == current_user.id)

    if action_type:
        query = query.filter(models.ActivityLog.action_type.ilike(f"%{action_type}%"))

    logs = query.order_by(models.ActivityLog.id.desc()).limit(limit).all()
    return [enrich_log(l, db) for l in logs]


# ══════════════════════════════════════════════════════════════════════════════
# 11. SCHEDULED JOBS (callable manually for demo)
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/internal/run-scheduled-jobs")
def run_scheduled_jobs(db: Session = Depends(get_db)):
    """Manually trigger all scheduled maintenance jobs. Hit this endpoint during demo."""
    today = date.today()
    now = datetime.utcnow()
    results = {"overdue_allocations": 0, "overdue_bookings": 0, "booking_transitions": 0,
               "reminders_sent": 0}

    # 1. Flag overdue allocations
    overdue_allocs = db.query(models.Allocation).filter(
        models.Allocation.state == "approved",
        models.Allocation.expected_return_date < today
    ).all()
    for alloc in overdue_allocs:
        alloc.state = "overdue"
        notify_user(db, alloc.employee_id, "OVERDUE_RETURN",
                    f"Asset {alloc.asset.tag} is overdue for return since {alloc.expected_return_date}.",
                    f"allocations:{alloc.id}")
        results["overdue_allocations"] += 1
    db.commit()

    # 2. Booking status auto-transitions
    # Upcoming → Ongoing
    upcoming = db.query(models.Booking).filter(
        models.Booking.status == "Upcoming",
        models.Booking.start_time <= now
    ).all()
    for b in upcoming:
        b.status = "Ongoing"
        results["booking_transitions"] += 1

    # Ongoing → Completed
    ongoing = db.query(models.Booking).filter(
        models.Booking.status == "Ongoing",
        models.Booking.end_time <= now
    ).all()
    for b in ongoing:
        b.status = "Completed"
        results["booking_transitions"] += 1
    db.commit()

    # 3. Booking reminders (30 min before start)
    reminder_window = now + timedelta(minutes=30)
    upcoming_remind = db.query(models.Booking).filter(
        models.Booking.status == "Upcoming",
        models.Booking.reminder_sent == False,
        models.Booking.start_time <= reminder_window,
        models.Booking.start_time > now
    ).all()
    for b in upcoming_remind:
        notify_user(db, b.booked_by_id, "BOOKING_REMINDER",
                    f"Reminder: Your booking for {b.asset.tag} starts in 30 minutes.",
                    f"bookings:{b.id}")
        b.reminder_sent = True
        results["reminders_sent"] += 1
    db.commit()

    return {"message": "Scheduled jobs executed.", "results": results}
