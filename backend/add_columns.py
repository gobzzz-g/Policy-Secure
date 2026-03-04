import sqlite3

conn = sqlite3.connect('insurance_claims.db')
cursor = conn.cursor()

print("Adding missing columns...")

try:
    # Add settlement_breakdown column
    cursor.execute('ALTER TABLE claims ADD COLUMN settlement_breakdown JSON')
    print("✅ Added settlement_breakdown column")
except sqlite3.OperationalError as e:
    print(f"ℹ️ settlement_breakdown: {e}")

try:
    # Add confidence_score column
    cursor.execute('ALTER TABLE claims ADD COLUMN confidence_score FLOAT')
    print("✅ Added confidence_score column")
except sqlite3.OperationalError as e:
    print(f"ℹ️ confidence_score: {e}")

conn.commit()
conn.close()

print("\n✅ Database schema updated!")
