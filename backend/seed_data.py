import datetime
import auth
from database import SessionLocal
import models

def seed():
    db = SessionLocal()
    try:
        # 1. Departments
        depts_data = [
            {"name": "Engineering", "code": "ENG"},
            {"name": "HR", "code": "HR"},
            {"name": "Procurement", "code": "PROC"},
            {"name": "Marketing", "code": "MKTG"}
        ]
        departments = {}
        for d in depts_data:
            existing = db.query(models.Department).filter(models.Department.code == d["code"]).first()
            if not existing:
                existing = models.Department(name=d["name"], code=d["code"], status="Active")
                db.add(existing)
                db.commit()
                db.refresh(existing)
            departments[d["code"]] = existing

        # 2. Users
        users_data = [
            {"name": "System Admin", "email": "admin@assetflow.com", "role": "Admin", "dept": None, "emp_id": "EMP-0001"},
            {"name": "Asset Manager", "email": "am@assetflow.com", "role": "Asset Manager", "dept": None, "emp_id": "EMP-0002"},
            {"name": "Aditi Rao", "email": "aditi@assetflow.com", "role": "Department Head", "dept": "ENG", "emp_id": "EMP-0003"},
            {"name": "Rohan Mehta", "email": "rohan@assetflow.com", "role": "Department Head", "dept": "PROC", "emp_id": "EMP-0004"},
            {"name": "Priya Shah", "email": "priya@assetflow.com", "role": "Employee", "dept": "ENG", "emp_id": "EMP-0005"},
            {"name": "Arjun Nair", "email": "arjun@assetflow.com", "role": "Employee", "dept": "ENG", "emp_id": "EMP-0006"},
            {"name": "Sana Iqbal", "email": "sana@assetflow.com", "role": "Employee", "dept": "HR", "emp_id": "EMP-0007"},
            {"name": "R. Varma", "email": "varma@assetflow.com", "role": "Technician", "dept": "ENG", "emp_id": "EMP-0008"}
        ]
        
        def get_unique_emp_tag(db, email, suggested_tag):
            user = db.query(models.User).filter(models.User.email == email).first()
            if user and user.employee_id_tag:
                return user.employee_id_tag
            existing = db.query(models.User).filter(models.User.employee_id_tag == suggested_tag).first()
            if not existing:
                return suggested_tag
            idx = 1
            while True:
                tag = f"EMP-{idx:04d}"
                if not db.query(models.User).filter(models.User.employee_id_tag == tag).first():
                    return tag
                idx += 1

        users = {}
        for u in users_data:
            existing = db.query(models.User).filter(models.User.email == u["email"]).first()
            dept_id = departments[u["dept"]].id if u["dept"] else None
            emp_tag = get_unique_emp_tag(db, u["email"], u["emp_id"])
            if not existing:
                existing = models.User(
                    name=u["name"],
                    email=u["email"],
                    password_hash=auth.get_password_hash("pass1111"),
                    role=u["role"],
                    department_id=dept_id,
                    status="Active",
                    employee_id_tag=emp_tag
                )
                db.add(existing)
                db.commit()
                db.refresh(existing)
            else:
                existing.role = u["role"]
                existing.employee_id_tag = emp_tag
                existing.department_id = dept_id
                db.commit()
                db.refresh(existing)
            users[u["email"]] = existing

        # Update department manager IDs
        eng = departments["ENG"]
        if not eng.manager_id:
            eng.manager_id = users["aditi@assetflow.com"].id
            db.commit()
        proc = departments["PROC"]
        if not proc.manager_id:
            proc.manager_id = users["rohan@assetflow.com"].id
            db.commit()

        # 3. Categories
        cats_data = [
            {"name": "Electronics", "code": "ELE"},
            {"name": "Furniture", "code": "FUR"},
            {"name": "Vehicles", "code": "VEH"},
            {"name": "AV Equipment", "code": "AV"},
            {"name": "Office Supplies", "code": "OFF"}
        ]
        categories = {}
        for c in cats_data:
            existing = db.query(models.AssetCategory).filter(models.AssetCategory.code == c["code"]).first()
            if not existing:
                existing = models.AssetCategory(name=c["name"], code=c["code"], status="Active")
                db.add(existing)
                db.commit()
                db.refresh(existing)
            categories[c["code"]] = existing

        # 4. Assets
        today = datetime.date.today()
        assets_data = [
            {"tag": "AF-0114", "name": "Dell Laptop", "cat": "ELE", "sn": "DL1234", "cost": 1200.0, "cond": "Good", "loc": "HQ Floor 2", "status": "Allocated", "shared": False},
            {"tag": "AF-0062", "name": "Projector", "cat": "AV", "sn": "PJ987", "cost": 800.0, "cond": "Good", "loc": "Room B2", "status": "Available", "shared": True},
            {"tag": "AF-0003", "name": "AC Unit", "cat": "ELE", "sn": "AC555", "cost": 500.0, "cond": "Fair", "loc": "Room C1", "status": "Under Maintenance", "shared": False},
            {"tag": "AF-0078", "name": "Forklift", "cat": "VEH", "sn": "FL999", "cost": 15000.0, "cond": "Good", "loc": "Warehouse", "status": "Under Maintenance", "shared": False},
            {"tag": "AF-0897", "name": "Printer", "cat": "ELE", "sn": "PR111", "cost": 300.0, "cond": "Poor", "loc": "HQ Floor 1", "status": "Under Maintenance", "shared": False},
            {"tag": "AF-0873", "name": "Chair", "cat": "FUR", "sn": "CH333", "cost": 100.0, "cond": "Good", "loc": "HQ Floor 2", "status": "Available", "shared": False},
            {"tag": "AF-0021", "name": "Office Chair", "cat": "FUR", "sn": "OCH44", "cost": 150.0, "cond": "Good", "loc": "HQ Floor 2", "status": "Allocated", "shared": False}
        ]
        assets = {}
        for a in assets_data:
            existing = db.query(models.Asset).filter(models.Asset.tag == a["tag"]).first()
            if not existing:
                existing = models.Asset(
                    tag=a["tag"],
                    name=a["name"],
                    category_id=categories[a["cat"]].id,
                    serial_number=a["sn"],
                    acquisition_date=today - datetime.timedelta(days=300),
                    acquisition_cost=a["cost"],
                    condition=a["cond"],
                    location=a["loc"],
                    status=a["status"],
                    shared_flag=a["shared"]
                )
                db.add(existing)
                db.commit()
                db.refresh(existing)
            assets[a["tag"]] = existing

        # 5. Allocations
        priya = users["priya@assetflow.com"]
        dell_laptop = assets["AF-0114"]
        chair = assets["AF-0021"]
        
        # Seed allocations if not present
        existing_alloc1 = db.query(models.Allocation).filter(models.Allocation.asset_id == dell_laptop.id).first()
        if not existing_alloc1:
            alloc1 = models.Allocation(
                asset_id=dell_laptop.id,
                employee_id=priya.id,
                department_id=departments["ENG"].id,
                allocation_date=today - datetime.timedelta(days=60),
                state="approved",
                condition_at_allocation="Good"
            )
            db.add(alloc1)
        
        existing_alloc2 = db.query(models.Allocation).filter(models.Allocation.asset_id == chair.id).first()
        if not existing_alloc2:
            alloc2 = models.Allocation(
                asset_id=chair.id,
                employee_id=priya.id,
                department_id=departments["ENG"].id,
                allocation_date=today - datetime.timedelta(days=30),
                expected_return_date=today - datetime.timedelta(days=3),
                state="approved",
                condition_at_allocation="Good"
            )
            db.add(alloc2)
        db.commit()

        # 6. Bookings
        projector = assets["AF-0062"]
        existing_booking = db.query(models.Booking).filter(models.Booking.asset_id == projector.id).first()
        if not existing_booking:
            now = datetime.datetime.utcnow()
            booking = models.Booking(
                asset_id=projector.id,
                booked_by_id=priya.id,
                start_time=now + datetime.timedelta(hours=2),
                end_time=now + datetime.timedelta(hours=3),
                purpose="Team Meeting",
                status="Upcoming"
            )
            db.add(booking)
            db.commit()

        # 7. Transfers
        varma = users["varma@assetflow.com"]
        existing_transfer = db.query(models.Transfer).filter(models.Transfer.asset_id == dell_laptop.id).first()
        if not existing_transfer:
            transfer = models.Transfer(
                asset_id=dell_laptop.id,
                source_holder_id=priya.id,
                target_holder_id=varma.id,
                requested_by_id=varma.id,
                state="Requested",
                reason="Need for new project"
            )
            db.add(transfer)
            db.commit()

        # 8. Maintenance & Scheduled Visits
        ac = assets["AF-0003"]
        forklift = assets["AF-0078"]
        
        existing_maint = db.query(models.MaintenanceRequest).filter(models.MaintenanceRequest.asset_id == projector.id).first()
        if not existing_maint:
            maint1 = models.MaintenanceRequest(
                asset_id=projector.id,
                raised_by_id=priya.id,
                issue_description="Bulb not turning on",
                priority="Medium",
                status="Resolved",
                resolution_notes="Replaced bulb",
                resolved_date=today - datetime.timedelta(days=2),
                parts_replaced="Projector Bulb Gen II"
            )
            db.add(maint1)

        existing_maint2 = db.query(models.MaintenanceRequest).filter(models.MaintenanceRequest.asset_id == ac.id).first()
        if not existing_maint2:
            maint2 = models.MaintenanceRequest(
                asset_id=ac.id,
                raised_by_id=priya.id,
                issue_description="Noisy compressor",
                priority="High",
                status="Approved",
                approval_date=today
            )
            db.add(maint2)

        existing_maint3 = db.query(models.MaintenanceRequest).filter(models.MaintenanceRequest.asset_id == forklift.id).first()
        if not existing_maint3:
            maint3 = models.MaintenanceRequest(
                asset_id=forklift.id,
                raised_by_id=varma.id,
                issue_description="Forklift battery issue",
                priority="High",
                status="Assigned",
                technician_id=varma.id,
                scheduled_time=datetime.datetime.now() + datetime.timedelta(days=1),
                duration_minutes=90
            )
            db.add(maint3)

        db.commit()
        print("Demo data seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    seed()
