# test_config.py - Test database connection
import pyodbc
from config import Config

print("\n" + "="*70)
print("🔍 TESTING SQL SERVER CONNECTION")
print("="*70)
print(f"📍 Server: {Config.DB_SERVER}")
print(f"📊 Database: {Config.DB_NAME}")
print(f"🔧 Driver: {Config.DB_DRIVER}")
print("="*70)

try:
    print("\n⏳ Attempting to connect...")
    conn_str = Config.get_connection_string()
    print(f"\n📝 Connection String:\n{conn_str}\n")
    
    conn = pyodbc.connect(conn_str, timeout=5)
    cursor = conn.cursor()
    
    # Get SQL Server info
    cursor.execute("SELECT @@VERSION, @@SERVERNAME, DB_NAME()")
    version, servername, dbname = cursor.fetchone()
    
    print("✅ CONNECTION SUCCESSFUL!")
    print("="*70)
    print(f"🖥️  Server Name: {servername}")
    print(f"📊 Database: {dbname}")
    print(" SQL Server Version:")
    print(f"   {version[:150]}...")
    print("="*70)
    
    # Check if tables exist
    print("\n📋 Checking for tables...")
    cursor.execute("""
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
    """)
    
    tables = [row[0] for row in cursor.fetchall()]
    
    if tables:
        print(f"\n✅ Found {len(tables)} tables in database:")
        for i, table in enumerate(tables, 1):
            print(f"   {i}. {table}")
    else:
        print("\n⚠️  WARNING: No tables found in database!")
        print("   You need to create the tables first.")
        print("   Run your table creation scripts in SSMS.")
    
    cursor.close()
    conn.close()
    
    print("\n" + "="*70)
    print("🎉 ALL CHECKS PASSED! You're ready to use the backend!")
    print("="*70 + "\n")
    
except pyodbc.Error as e:
    print("\n❌ CONNECTION FAILED!")
    print("="*70)
    print(f"Error Details:\n{e}")
    print("="*70)
    
    print("\n🔧 TROUBLESHOOTING STEPS:")
    print("1. Check if SQL Server is running:")
    print("   - Press Win+R, type 'services.msc', press Enter")
    print("   - Look for 'SQL Server (SQLEXPRESS)' or 'SQL Server (MSSQLSERVER)'")
    print("   - Make sure it's 'Running'")
    print("\n2. Verify database exists:")
    print("   - Open SQL Server Management Studio (SSMS)")
    print("   - Connect to your server")
    print("   - Check if 'ResumeBuilderDB' database exists")
    print("\n3. Try different server names in config.py:")
    print("   - localhost")
    print("   - localhost\\SQLEXPRESS")
    print("   - (local)\\SQLEXPRESS")
    print("   - YOUR-PC-NAME\\SQLEXPRESS")
    print("\n4. Check ODBC Driver:")
    print("   - Run in Python: import pyodbc; print(pyodbc.drivers())")
    print("="*70 + "\n")

except ImportError as e:
    print("\n❌ MODULE IMPORT ERROR!")
    print("="*70)
    print(f"Error: {e}")
    print("\n📦 Install required package:")
    print("   pip install pyodbc")
    print("="*70 + "\n")

except Exception as e:
    print("\n❌ UNEXPECTED ERROR!")
    print("="*70)
    print(f"Error: {e}")
    print("="*70 + "\n")