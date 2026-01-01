# config.py - Database Connection Configuration

class Config:
    """Database Configuration for MSSQL Server - Windows Authentication"""
    
    # ===== CHANGE ONLY THIS LINE TO YOUR SERVER NAME =====
    DB_SERVER = 'HP-VICTUS\SQLEXPRESS'  # Change to YOUR server name
    
    # ===== LEAVE EVERYTHING ELSE AS IS =====
    DB_NAME = 'ResumeBuilderDB'
    DB_DRIVER = '{ODBC Driver 17 for SQL Server}'
    
    # Windows Authentication - NO USERNAME OR PASSWORD NEEDED!
    @staticmethod
    def get_connection_string():
        return (
            f'DRIVER={Config.DB_DRIVER};'
            f'SERVER={Config.DB_SERVER};'
            f'DATABASE={Config.DB_NAME};'
            f'Trusted_Connection=yes;'  # ← This uses Windows Auth
            f'TrustServerCertificate=yes;'
        )