import datetime
import auth
from database import SessionLocal, engine, Base
import models

def seed_database():
    db = SessionLocal()
    try:
        # Check if departments are already seeded
        if db.query(models.Department).first():
            return

        # 1. Departments
        depts = [
            models.Department(name="Engineering", code="ENG", status="Active"),
            models.Department(name="HR", code="HR", status="Active"),
            models.Department(name="Procurement", code="PROC", status="Active"),
            models.Department(name="Marketing", code="MKTG", status="Active")
        ]
        db.add_all(depts)
        db.commit()
        for d in depts:
            db.refresh(d)
            
        eng_dept = next(d for d in depts if d.code == "ENG")
        hr_dept = next(d for d in depts if d.code == "HR")
        proc_dept = next(d for d in depts if d.code == "PROC")

        # 2. Users
        users = [
            models.User(name="System Admin", email="admin@assetflow.com", password_hash=auth.get_password_hash("pass1111"), role="Admin", status="Active"),
            models.User(name="Asset Manager", email="am@assetflow.com", password_hash=auth.get_password_hash("pass1111"), role="Asset Manager", status="Active"),
            models.User(name="Aditi Rao", email="aditi@assetflow.com", password_hash=auth.get_password_hash("pass1111"), role="Department Head", department_id=eng_dept.id, status="Active"),
            models.User(name="Rohan Mehta", email="rohan@assetflow.com", password_hash=auth.get_password_hash("pass1111"), role="Department Head", department_id=proc_dept.id, status="Active"),
            models.User(name="Priya Shah", email="priya@assetflow.com", password_hash=auth.get_password_hash("pass1111"), role="Employee", department_id=eng_dept.id, status="Active"),
            models.User(name="Arjun Nair", email="arjun@assetflow.com", password_hash=auth.get_password_hash("pass1111"), role="Employee", department_id=eng_dept.id, status="Active"),
            models.User(name="Sana Iqbal", email="sana@assetflow.com", password_hash=auth.get_password_hash("pass1111"), role="Employee", department_id=hr_dept.id, status="Active"),
            models.User(name="R. Varma", email="varma@assetflow.com", password_hash=auth.get_password_hash("pass1111"), role="Employee", department_id=eng_dept.id, status="Active"), # Technician
        ]
        db.add_all(users)
        db.commit()
        for u in users:
            db.refresh(u)
            
        priya = next(u for u in users if u.email == "priya@assetflow.com")
        varma = next(u for u in users if u.email == "varma@assetflow.com")

        # 3. Categories
        cats = [
            models.AssetCategory(name="Electronics", code="ELE", status="Active"),
            models.AssetCategory(name="Furniture", code="FUR", status="Active"),
            models.AssetCategory(name="Vehicles", code="VEH", status="Active"),
            models.AssetCategory(name="AV Equipment", code="AV", status="Active"),
            models.AssetCategory(name="Office Supplies", code="OFF", status="Active"),
            models.AssetCategory(name="Lab Equipment", code="LAB", status="Active")
        ]
        db.add_all(cats)
        db.commit()
        for c in cats:
            db.refresh(c)
            
        elec = next(c for c in cats if c.code == "ELE")
        av = next(c for c in cats if c.code == "AV")

        # 4. Assets
        today = datetime.date.today()
        assets = [
            models.Asset(tag="AF-0114", name="Dell Laptop", category_id=elec.id, serial_number="DL1234", acquisition_date=today - datetime.timedelta(days=300), acquisition_cost=1200.0, condition="Good", location="HQ Floor 2", status="Allocated"),
            models.Asset(tag="AF-0062", name="Projector", category_id=av.id, serial_number="PJ987", acquisition_date=today - datetime.timedelta(days=600), acquisition_cost=800.0, condition="Good", location="Room B2", status="Available", shared_flag=True),
            models.Asset(tag="AF-0003", name="AC Unit", category_id=elec.id, serial_number="AC555", acquisition_date=today - datetime.timedelta(days=900), acquisition_cost=500.0, condition="Fair", location="Room C1", status="Under Maintenance"),
            models.Asset(tag="AF-0078", name="Forklift", category_id=cats[2].id, serial_number="FL999", acquisition_date=today - datetime.timedelta(days=1200), acquisition_cost=15000.0, condition="Good", location="Warehouse", status="Under Maintenance"),
            models.Asset(tag="AF-0897", name="Printer", category_id=elec.id, serial_number="PR111", acquisition_date=today - datetime.timedelta(days=150), acquisition_cost=300.0, condition="Poor", location="HQ Floor 1", status="Under Maintenance"),
            models.Asset(tag="AF-0873", name="Chair", category_id=cats[1].id, serial_number="CH333", acquisition_date=today - datetime.timedelta(days=150), acquisition_cost=100.0, condition="Good", location="HQ Floor 2", status="Available"),
            models.Asset(tag="AF-0021", name="Office Chair", category_id=cats[1].id, acquisition_date=today - datetime.timedelta(days=400), acquisition_cost=150.0, condition="Good", location="HQ Floor 2", status="Allocated"),
        ]
        db.add_all(assets)
        db.commit()
        for a in assets:
            db.refresh(a)
            
        dell_laptop = next(a for a in assets if a.tag == "AF-0114")
        projector = next(a for a in assets if a.tag == "AF-0062")
        chair = next(a for a in assets if a.tag == "AF-0021")
        ac = next(a for a in assets if a.tag == "AF-0003")

        # 5. Allocations
        allocations = [
            models.Allocation(asset_id=dell_laptop.id, employee_id=priya.id, department_id=eng_dept.id, allocation_date=today - datetime.timedelta(days=60), state="approved", condition_at_allocation="Good"),
            models.Allocation(asset_id=chair.id, employee_id=priya.id, department_id=eng_dept.id, allocation_date=today - datetime.timedelta(days=30), expected_return_date=today - datetime.timedelta(days=3), state="approved", condition_at_allocation="Good") # Overdue
        ]
        db.add_all(allocations)
        db.commit()

        # 6. Bookings
        now = datetime.datetime.utcnow()
        bookings = [
            models.Booking(asset_id=projector.id, booked_by_id=priya.id, start_time=now + datetime.timedelta(hours=2), end_time=now + datetime.timedelta(hours=3), purpose="Team Meeting", status="Upcoming")
        ]
        db.add_all(bookings)
        db.commit()

        # 7. Transfers
        transfers = [
            models.Transfer(asset_id=dell_laptop.id, source_holder_id=priya.id, target_holder_id=varma.id, requested_by_id=varma.id, state="Requested", reason="Need for new project")
        ]
        db.add_all(transfers)
        db.commit()

        # 8. Maintenance
        maint = [
            models.MaintenanceRequest(asset_id=projector.id, raised_by_id=priya.id, issue_description="Bulb not turning on", priority="Medium", status="Resolved", resolution_notes="Replaced bulb", resolved_date=today - datetime.timedelta(days=2)),
            models.MaintenanceRequest(asset_id=ac.id, raised_by_id=priya.id, issue_description="Noisy compressor", priority="High", status="Approved", approval_date=today),
            models.MaintenanceRequest(asset_id=next(a for a in assets if a.tag == "AF-0078").id, raised_by_id=varma.id, issue_description="Forklift battery issue", priority="High", status="Assigned", technician_id=varma.id)
        ]
        db.add_all(maint)
        db.commit()

        print("Database Seeded Successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
