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
    
    """
Database Connection Test Script
Run this before starting the backend to verify your configuration
"""



def main():
    print("\n" + "="*70)
    print("🔧 DATABASE CONFIGURATION TEST")
    print("="*70)
    
    # Show current configuration
    print("\n📋 Current Configuration:")
    print(f"   Server:   {Config.DB_SERVER}")
    print(f"   Database: {Config.DB_NAME}")
    print(f"   Auth:     {'Windows' if Config.USE_WINDOWS_AUTH else 'SQL Server'}")
    
    # Test connection
    print("\n🔍 Testing Connection...")
    success, message = Config.test_connection()
    
    print(message)
    
    if success:
        print("\n✅ SUCCESS! Your database is ready.")
        print("\n📊 Checking tables...")
        
        try:
            import pyodbc
            conn = pyodbc.connect(Config.get_connection_string())
            cursor = conn.cursor()
            
            # Check for required tables
            required_tables = [
                'Users', 'Resumes', 'PersonalInformation', 
                'WorkExperience', 'Education', 'Projects', 
                'Skills', 'Certifications', 'Interests',
                'Companies', 'Jobs', 'jobskill', 'JobSkills'
            ]
            
            cursor.execute("""
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_TYPE = 'BASE TABLE'
                ORDER BY TABLE_NAME
            """)
            
            existing_tables = [row[0] for row in cursor.fetchall()]
            
            print(f"\n   Found {len(existing_tables)} tables in database:")
            
            missing_tables = []
            for table in required_tables:
                if table in existing_tables:
                    print(f"   ✅ {table}")
                else:
                    print(f"   ❌ {table} (MISSING)")
                    missing_tables.append(table)
            
            if missing_tables:
                print(f"\n⚠️  WARNING: {len(missing_tables)} required table(s) missing!")
                print("   Please create these tables before running the backend.")
            else:
                print("\n✅ All required tables exist!")
            
            # Get record counts
            print("\n📊 Current Data:")
            cursor.execute("SELECT COUNT(*) FROM Users")
            print(f"   Users:   {cursor.fetchone()[0]}")
            
            cursor.execute("SELECT COUNT(*) FROM Resumes")
            print(f"   Resumes: {cursor.fetchone()[0]}")
            
            cursor.execute("SELECT COUNT(*) FROM Jobs")
            print(f"   Jobs:    {cursor.fetchone()[0]}")
            
            cursor.close()
            conn.close()
            
            print("\n" + "="*70)
            print("✅ READY TO START BACKEND")
            print("="*70)
            print("\nRun: python unified_backend.py")
            print("="*70 + "\n")
            
        except Exception as e:
            print(f"\n⚠️  Error checking tables: {e}")
    
    else:
        print("\n" + "="*70)
        print("❌ CONNECTION FAILED")
        print("="*70)
        print("\n🔧 Troubleshooting Steps:")
        print("\n1. Check SQL Server is running:")
        print("   - Open SQL Server Configuration Manager")
        print("   - Verify SQL Server (SQLEXPRESS) service is running")
        
        print("\n2. Verify your server name:")
        print("   - Open SQL Server Management Studio (SSMS)")
        print("   - Note the server name when connecting")
        print(f"   - Current config: {Config.DB_SERVER}")
        
        print("\n3. Check database exists:")
        print("   - In SSMS, expand 'Databases'")
        print(f"   - Look for: {Config.DB_NAME}")
        
        print("\n4. Verify ODBC Driver:")
        print("   - Run in Python: import pyodbc; print(pyodbc.drivers())")
        print("   - Should see 'ODBC Driver 17 for SQL Server'")
        
        print("\n5. If using SQL Server Auth:")
        print("   - Set Config.USE_WINDOWS_AUTH = False")
        print("   - Set Config.DB_USERNAME and Config.DB_PASSWORD")
        
        print("\n6. Common server name formats:")
        print("   - localhost\\SQLEXPRESS")
        print("   - .\\SQLEXPRESS")
        print("   - COMPUTERNAME\\SQLEXPRESS")
        print(f"   - {Config.DB_SERVER} (your current setting)")
        
        print("\n" + "="*70 + "\n")

if __name__ == '__main__':
    main()