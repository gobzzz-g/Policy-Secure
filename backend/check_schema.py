import sqlite3

conn = sqlite3.connect('insurance_claims.db')
cursor = conn.cursor()

# Check claims table structure
cursor.execute('PRAGMA table_info(claims)')
columns = cursor.fetchall()

print('\n=== Actual Claims Table Columns ===')
for col in columns:
    print(f'  {col[1]} ({col[2]})')

# Check if new columns exist
has_settlement = any('settlement_breakdown' in str(col) for col in columns)
has_confidence = any('confidence_score' in str(col) for col in columns)

print(f'\nSettlement breakdown column: {"✅ EXISTS" if has_settlement else "❌ MISSING"}')
print(f'Confidence score column: {"✅ EXISTS" if has_confidence else "❌ MISSING"}')

conn.close()
