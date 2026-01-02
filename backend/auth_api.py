"""
Authentication API for Resume Builder
Runs on port 5001 to avoid conflict with existing backend.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pyodbc
import bcrypt
import re

app = Flask(__name__)
CORS(app)

# ============ DATABASE CONFIGURATION ============
# Update this after running test_connection.py
DB_SERVER = "(local)\SQLEXPRESS"  # Change to your SQL Server instance
DB_NAME = "ResumeBuilderDB"

# ============ DATABASE CONNECTION ============
def get_db_connection():
    """Create database connection"""
    try:
        conn_string = (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={DB_SERVER};"
            f"DATABASE={DB_NAME};"
            "Trusted_Connection=yes;"
        )
        conn = pyodbc.connect(conn_string)
        return conn
    except Exception as e:
        print(f"❌ Database error: {e}")
        raise

# ============ VALIDATION FUNCTIONS ============
def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    phone_clean = re.sub(r'[\s\-()]', '', phone)
    return len(phone_clean) == 10 and phone_clean.isdigit()

def validate_password(password):
    return len(password) >= 6

def validate_username(username):
    return (3 <= len(username) <= 50 and 
            re.match(r'^[a-zA-Z0-9_]+$', username) is not None)

# ============ HEALTH CHECK ============
@app.route('/api/auth/health', methods=['GET'])
def health_check():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM Users")
        user_count = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        
        return jsonify({
            'status': 'OK',
            'service': 'Authentication API',
            'database': 'Connected',
            'total_users': user_count
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'ERROR',
            'message': str(e)
        }), 500

# ============ CHECK USERNAME ============
@app.route('/api/auth/check-username', methods=['POST'])
def check_username():
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        
        if not username:
            return jsonify({'exists': False}), 200
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM Users WHERE Username = ?", (username,))
        count = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        
        return jsonify({'exists': count > 0}), 200
    except Exception as e:
        print(f"❌ Check username error: {e}")
        return jsonify({'exists': False}), 500

# ============ CHECK EMAIL ============
@app.route('/api/auth/check-email', methods=['POST'])
def check_email():
    try:
        data = request.get_json()
        email = data.get('emailId', '').strip()
        
        if not email:
            return jsonify({'exists': False}), 200
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM Users WHERE EmailId = ?", (email,))
        count = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        
        return jsonify({'exists': count > 0}), 200
    except Exception as e:
        print(f"❌ Check email error: {e}")
        return jsonify({'exists': False}), 500

# ============ REGISTER ============
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        username = data.get('username', '').strip()
        first_name = data.get('firstName', '').strip()
        last_name = data.get('lastName', '').strip()
        password = data.get('password', '')
        email_id = data.get('emailId', '').strip()
        phone_number = data.get('phoneNumber', '').strip()
        
        print(f"📝 Registration: {username}")
        
        # Validate
        if not all([username, first_name, last_name, password, email_id, phone_number]):
            return jsonify({'success': False, 'message': 'All fields required'}), 400
        
        if not validate_username(username):
            return jsonify({'success': False, 'message': 'Invalid username'}), 400
        
        if not validate_email(email_id):
            return jsonify({'success': False, 'message': 'Invalid email'}), 400
        
        if not validate_phone(phone_number):
            return jsonify({'success': False, 'message': 'Invalid phone'}), 400
        
        if not validate_password(password):
            return jsonify({'success': False, 'message': 'Password too short'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check duplicates
        cursor.execute(
            "SELECT Username, EmailId FROM Users WHERE Username = ? OR EmailId = ?",
            (username, email_id)
        )
        existing = cursor.fetchone()
        
        if existing:
            cursor.close()
            conn.close()
            msg = 'Username taken' if existing[0] == username else 'Email registered'
            return jsonify({'success': False, 'message': msg}), 409
        
        # Hash and insert
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        cursor.execute("""
            INSERT INTO Users (Username, FirstName, LastName, Password, EmailId, PhoneNumber)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (username, first_name, last_name, hashed.decode('utf-8'), email_id, phone_number))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ Registered: {username}")
        return jsonify({'success': True, 'message': 'Registration successful'}), 201
        
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return jsonify({'success': False, 'message': 'Server error'}), 500

# ============ LOGIN ============
@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        print(f"🔐 Login: {username}")
        
        if not username or not password:
            return jsonify({'success': False, 'message': 'Credentials required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT UserId, Username, FirstName, LastName, Password 
            FROM Users WHERE Username = ?
        """, (username,))
        
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not user:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        user_id, db_username, first_name, last_name, hashed = user
        
        if not bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8')):
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        print(f"✅ Login successful: {username}")
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'userId': user_id,
                'username': db_username,
                'firstName': first_name,
                'lastName': last_name
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        return jsonify({'success': False, 'message': 'Server error'}), 500

# ============ LOGOUT ============
@app.route('/api/auth/logout', methods=['POST'])
def logout():
    # Client-side will clear localStorage
    return jsonify({'success': True, 'message': 'Logged out'}), 200

# ============ VERIFY SESSION ============
@app.route('/api/auth/verify', methods=['POST'])
def verify_session():
    """Verify if user session is valid"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        
        if not user_id:
            return jsonify({'valid': False}), 200
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT Username FROM Users WHERE UserId = ?", (user_id,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        return jsonify({'valid': user is not None}), 200
    except Exception:
        return jsonify({'valid': False}), 200

if __name__ == '__main__':
    print("\n" + "="*70)
    print("🔐 AUTHENTICATION API - Resume Builder")
    print("="*70)
    print("\n📚 Endpoints:")
    print("   GET  /api/auth/health          → Status check")
    print("   POST /api/auth/register        → Register user")
    print("   POST /api/auth/login           → Login user")
    print("   POST /api/auth/logout          → Logout user")
    print("   POST /api/auth/verify          → Verify session")
    print("   POST /api/auth/check-username  → Check availability")
    print("   POST /api/auth/check-email     → Check availability")
    print("\n" + "="*70)
    print("✅ Auth Server: http://localhost:5001")
    print("✅ Resume API:  http://localhost:5000 (your existing backend)")
    print("="*70 + "\n")
    
    # Test DB connection
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM Users")
        count = cursor.fetchone()[0]
        print(f"✅ Database connected! Users: {count}\n")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"⚠️  Database warning: {e}\n")
    
    app.run(debug=True, port=5001, host='0.0.0.0')