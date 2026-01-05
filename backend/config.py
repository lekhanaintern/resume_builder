"""
Configuration file for Unified Backend - Resume Builder & Job Portal
Update DB_SERVER to match your SQL Server instance name
"""

class Config:
    # ============================================================
    # DATABASE CONFIGURATION
    # ============================================================
    
    # Database Connection Settings
    DB_DRIVER = "ODBC Driver 17 for SQL Server"
    DB_SERVER = "HP-victus\\SQLEXPRESS"  # ← CHANGE THIS to your server name
    DB_NAME = "ResumeBuilderDB"  # Database name for both Resume and Job Portal
    
    # Authentication Method
    USE_WINDOWS_AUTH = True  # Set to False to use SQL Server authentication
    
    # SQL Server Authentication (only if USE_WINDOWS_AUTH = False)
    DB_USERNAME = "your_username"
    DB_PASSWORD = "your_password"
    
    @classmethod
    def get_connection_string(cls):
        """
        Generate connection string based on configuration
        Supports both Windows Authentication and SQL Server Authentication
        """
        if cls.USE_WINDOWS_AUTH:
            # Windows Authentication (Recommended for local development)
            return (
                f"DRIVER={{{cls.DB_DRIVER}}};"
                f"SERVER={cls.DB_SERVER};"
                f"DATABASE={cls.DB_NAME};"
                "Trusted_Connection=yes;"
            )
        else:
            # SQL Server Authentication
            return (
                f"DRIVER={{{cls.DB_DRIVER}}};"
                f"SERVER={cls.DB_SERVER};"
                f"DATABASE={cls.DB_NAME};"
                f"UID={cls.DB_USERNAME};"
                f"PWD={cls.DB_PASSWORD};"
            )
    
    @classmethod
    def update_server(cls, server_name):
        """
        Update SQL Server instance name
        Example: update_server("localhost\\SQLEXPRESS")
        """
        cls.DB_SERVER = server_name
        print(f"✅ Server updated to: {server_name}")
    
    @classmethod
    def update_database(cls, db_name):
        """
        Update database name
        Example: update_database("ResumeBuilderDB")
        """
        cls.DB_NAME = db_name
        print(f"✅ Database updated to: {db_name}")
    
    @classmethod
    def switch_to_sql_auth(cls, username, password):
        """
        Switch from Windows Authentication to SQL Server Authentication
        Example: switch_to_sql_auth("sa", "your_password")
        """
        cls.USE_WINDOWS_AUTH = False
        cls.DB_USERNAME = username
        cls.DB_PASSWORD = password
        print("✅ Switched to SQL Server Authentication")
    
    @classmethod
    def switch_to_windows_auth(cls):
        """
        Switch from SQL Server Authentication to Windows Authentication
        """
        cls.USE_WINDOWS_AUTH = True
        print("✅ Switched to Windows Authentication")
    
    @classmethod
    def test_connection(cls):
        """
        Test database connection with current configuration
        Returns: (success: bool, message: str)
        """
        try:
            import pyodbc
            conn_string = cls.get_connection_string()
            conn = pyodbc.connect(conn_string, timeout=5)
            cursor = conn.cursor()
            cursor.execute("SELECT @@VERSION")
            version = cursor.fetchone()[0]
            cursor.close()
            conn.close()
            return (True, f"✅ Connection successful!\nSQL Server: {version[:80]}...")
        except ImportError:
            return (False, "❌ pyodbc module not installed. Run: pip install pyodbc")
        except Exception as e:
            return (False, f"❌ Connection failed: {str(e)}")
    
    @classmethod
    def get_config_summary(cls):
        """
        Get current configuration summary
        Returns: Dictionary with current settings
        """
        return {
            'driver': cls.DB_DRIVER,
            'server': cls.DB_SERVER,
            'database': cls.DB_NAME,
            'auth_method': 'Windows Authentication' if cls.USE_WINDOWS_AUTH else 'SQL Server Authentication',
            'username': cls.DB_USERNAME if not cls.USE_WINDOWS_AUTH else 'N/A'
        }
    
    @classmethod
    def print_config(cls):
        """Print current configuration to console"""
        print("\n" + "="*60)
        print("📊 CURRENT DATABASE CONFIGURATION")
        print("="*60)
        config = cls.get_config_summary()
        print(f"🔧 Driver:         {config['driver']}")
        print(f"🖥️  Server:         {config['server']}")
        print(f"📁 Database:       {config['database']}")
        print(f"🔐 Authentication: {config['auth_method']}")
        if not cls.USE_WINDOWS_AUTH:
            print(f"👤 Username:       {config['username']}")
        print("="*60 + "\n")

    # ============================================================
    # SERVER CONFIGURATION
    # ============================================================
    
    # Flask Server Settings
    SERVER_HOST = '0.0.0.0'  # Listen on all network interfaces
    SERVER_PORT = 5000        # Default port for Flask
    DEBUG_MODE = True         # Set to False in production
    
    # CORS Settings
    CORS_ORIGINS = '*'        # Allow all origins (restrict in production)
    
    # Session Settings
    SECRET_KEY = 'your-secret-key-here-change-in-production'
    SESSION_TYPE = 'filesystem'
    
    @classmethod
    def update_server_port(cls, port):
        """
        Update Flask server port
        Example: update_server_port(8000)
        """
        cls.SERVER_PORT = port
        print(f"✅ Server port updated to: {port}")
    
    @classmethod
    def enable_production_mode(cls):
        """
        Switch to production mode settings
        - Disables debug mode
        - Sets secure secret key (should use environment variable)
        """
        cls.DEBUG_MODE = False
        cls.CORS_ORIGINS = ['https://yourdomain.com']  # Update with actual domain
        print("✅ Production mode enabled")
        print("⚠️  Remember to:")
        print("   1. Set SECRET_KEY from environment variable")
        print("   2. Update CORS_ORIGINS with your domain")
        print("   3. Use HTTPS in production")


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def get_server_name_from_system():
    """
    Try to automatically detect SQL Server instance name
    Returns: List of detected SQL Server instances or empty list
    """
    import subprocess
    import platform
    
    if platform.system() == 'Windows':
        try:
            # Try to get SQL Server instances from registry
            result = subprocess.run(
                ['reg', 'query', 'HKLM\\SOFTWARE\\Microsoft\\Microsoft SQL Server', '/s'],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            instances = []
            lines = result.stdout.split('\n')
            for line in lines:
                if 'InstalledInstances' in line:
                    # Parse instance names
                    pass
            
            return instances
        except Exception:
            return []
    return []


def quick_test():
    """
    Quick connection test - run this to verify your configuration
    """
    print("\n" + "="*60)
    print("🔍 TESTING DATABASE CONNECTION")
    print("="*60)
    
    Config.print_config()
    
    success, message = Config.test_connection()
    print(message)
    
    if success:
        print("\n✅ Your configuration is correct!")
        print("   You can now run: python unified_backend.py")
    else:
        print("\n❌ Connection failed. Please check:")
        print("   1. SQL Server is running")
        print("   2. Server name is correct (HP-victus\\SQLEXPRESS)")
        print("   3. Database 'ResumeBuilderDB' exists")
        print("   4. ODBC Driver 17 is installed")
        print("   5. Windows Authentication is enabled (or use SQL Auth)")
    
    print("="*60 + "\n")


# ============================================================
# CONFIGURATION PRESETS
# ============================================================

class LocalConfig(Config):
    """Configuration preset for local development"""
    DB_SERVER = "localhost\\SQLEXPRESS"
    DB_NAME = "ResumeBuilderDB"
    USE_WINDOWS_AUTH = True
    DEBUG_MODE = True


class ProductionConfig(Config):
    """Configuration preset for production deployment"""
    DEBUG_MODE = False
    CORS_ORIGINS = ['https://yourdomain.com']
    # Use environment variables in production:
    # import os
    # DB_SERVER = os.environ.get('DB_SERVER')
    # DB_USERNAME = os.environ.get('DB_USERNAME')
    # DB_PASSWORD = os.environ.get('DB_PASSWORD')


# ============================================================
# AUTO-CONFIGURATION
# ============================================================

# Uncomment to run quick test when importing config
# quick_test()


if __name__ == '__main__':
    # Run configuration test when executing this file directly
    print("="*60)
    print("🚀 CONFIGURATION UTILITY")
    print("="*60)
    print("\nAvailable commands:")
    print("1. Test connection:    quick_test()")
    print("2. View config:        Config.print_config()")
    print("3. Update server:      Config.update_server('SERVER\\INSTANCE')")
    print("4. Update database:    Config.update_database('DatabaseName')")
    print("5. Switch auth:        Config.switch_to_sql_auth('user', 'pass')")
    print("\nRunning connection test...\n")
    
    quick_test()