import sys
from sqlalchemy import text
from database import engine

def patch():
    statements = [
        # Users profile columns
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS dob DATE;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS company_username VARCHAR(100);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id_tag VARCHAR(100) UNIQUE;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;",
        
        # Security Lockout columns
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0 NOT NULL;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 1 NOT NULL;",
        
        # Maintenance requests scheduler columns
        "ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMP WITH TIME ZONE;",
        "ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60 NOT NULL;",
        "ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS parts_replaced TEXT;",
 
        # Audit cycles discrepancy report column
        "ALTER TABLE audit_cycles ADD COLUMN IF NOT EXISTS discrepancy_report TEXT;"
    ]
    
    print("Connecting to database to apply schema patches...")
    with engine.connect() as conn:
        transaction = conn.begin()
        try:
            for stmt in statements:
                print(f"Executing: {stmt}")
                conn.execute(text(stmt))
            transaction.commit()
            print("Database successfully patched!")
        except Exception as e:
            transaction.rollback()
            print(f"Error executing patch: {e}", file=sys.stderr)
            sys.exit(1)

if __name__ == '__main__':
    patch()
