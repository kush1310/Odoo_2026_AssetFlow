from database import SessionLocal
import models

def patch_users():
    db = SessionLocal()
    try:
        users = db.query(models.User).order_by(models.User.id).all()
        for idx, user in enumerate(users):
            if not user.employee_id_tag:
                user.employee_id_tag = f"EMP-{idx+1:04d}"
                print(f"Assigned {user.employee_id_tag} to {user.name}")
            if user.email == "varma@assetflow.com":
                user.role = "Technician"
                print(f"Set role of {user.name} to Technician")
        db.commit()
        print("User patch completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error patching users: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    patch_users()
