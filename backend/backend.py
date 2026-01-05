"""
UNIFIED BACKEND FOR RESUME BUILDER & JOB PORTAL
- Resume management endpoints
- Job posting and management endpoints
- User authentication
- Analytics and admin dashboard
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pyodbc
import bcrypt
import re
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ============ DATABASE CONNECTION ============
class Config:
    DB_SERVER = 'localhost\\SQLEXPRESS'
    DB_NAME = 'ResumeBuilderDB'
    
    @staticmethod
    def get_connection_string():
        return (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={Config.DB_SERVER};"
            f"DATABASE={Config.DB_NAME};"
            f"Trusted_Connection=yes;"
        )

def get_db_connection():
    """Create and return database connection"""
    try:
        conn = pyodbc.connect(Config.get_connection_string())
        return conn
    except Exception as e:
        print(f"❌ Database connection error: {e}")
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

# ============================================================
# HEALTH CHECK
# ============================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM Users")
        user_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM Resumes")
        resume_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM Jobs")
        job_count = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        
        return jsonify({
            'status': 'OK',
            'service': 'Resume Builder & Job Portal API',
            'database': 'Connected',
            'total_users': user_count,
            'total_resumes': resume_count,
            'total_jobs': job_count,
            'timestamp': datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'ERROR',
            'message': str(e)
        }), 500

# ============================================================
# AUTHENTICATION ENDPOINTS
# ============================================================

@app.route('/api/check-username', methods=['POST'])
def check_username():
    """Check if username already exists"""
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

@app.route('/api/check-email', methods=['POST'])
def check_email():
    """Check if email already exists"""
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

@app.route('/api/register', methods=['POST'])
def register():
    """Register new user"""
    try:
        data = request.get_json()
        
        username = data.get('username', '').strip()
        first_name = data.get('firstName', '').strip()
        last_name = data.get('lastName', '').strip()
        password = data.get('password', '')
        email_id = data.get('emailId', '').strip()
        phone_number = data.get('phoneNumber', '').strip()
        
        print(f"\n📝 Registration attempt: {username}")
        
        # Validate all fields
        if not all([username, first_name, last_name, password, email_id, phone_number]):
            return jsonify({'success': False, 'message': 'All fields are required'}), 400
        
        if not validate_username(username):
            return jsonify({'success': False, 'message': 'Invalid username format'}), 400
        
        if not validate_email(email_id):
            return jsonify({'success': False, 'message': 'Invalid email format'}), 400
        
        if not validate_phone(phone_number):
            return jsonify({'success': False, 'message': 'Invalid phone number'}), 400
        
        if not validate_password(password):
            return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if username or email already exists
        cursor.execute(
            "SELECT Username, EmailId FROM Users WHERE Username = ? OR EmailId = ?",
            (username, email_id)
        )
        existing = cursor.fetchone()
        
        if existing:
            cursor.close()
            conn.close()
            msg = 'Username already taken' if existing[0] == username else 'Email already registered'
            print(f"❌ Registration failed: {msg}")
            return jsonify({'success': False, 'message': msg}), 409
        
        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Insert new user
        cursor.execute("""
            INSERT INTO Users (Username, FirstName, LastName, Password, EmailId, PhoneNumber)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (username, first_name, last_name, hashed_password.decode('utf-8'), email_id, phone_number))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ User registered successfully: {username}")
        return jsonify({'success': True, 'message': 'Registration successful'}), 201
        
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        print(f"\n🔐 Login attempt: {username}")
        
        if not username or not password:
            return jsonify({'success': False, 'message': 'Username and password required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user from database
        cursor.execute("""
            SELECT UserId, Username, FirstName, LastName, Password, EmailId
            FROM Users 
            WHERE Username = ?
        """, (username,))
        
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not user:
            print(f"❌ User not found: {username}")
            return jsonify({'success': False, 'message': 'Invalid username or password'}), 401
        
        user_id, db_username, first_name, last_name, hashed_password, email = user
        
        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8')):
            print(f"❌ Invalid password for: {username}")
            return jsonify({'success': False, 'message': 'Invalid username or password'}), 401
        
        print(f"✅ Login successful: {username}")
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'userId': user_id,
                'username': db_username,
                'firstName': first_name,
                'lastName': last_name,
                'email': email
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """Logout user"""
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200

@app.route('/api/verify', methods=['POST'])
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

# ============================================================
# USER MANAGEMENT ENDPOINTS
# ============================================================

@app.route('/api/get-all-users', methods=['GET'])
def get_all_users():
    """Get all registered users with statistics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                u.UserId,
                u.Username,
                u.FirstName,
                u.LastName,
                u.EmailId,
                u.PhoneNumber,
                u.CreatedDate,
                COUNT(r.ResumeID) as ResumeCount
            FROM Users u
            LEFT JOIN Resumes r ON u.EmailId = (SELECT Email FROM PersonalInformation WHERE ResumeID = r.ResumeID)
            GROUP BY u.UserId, u.Username, u.FirstName, u.LastName, u.EmailId, u.PhoneNumber, u.CreatedDate
            ORDER BY u.CreatedDate DESC
        """)
        
        rows = cursor.fetchall()
        users = []
        
        for row in rows:
            users.append({
                'userId': row[0],
                'username': row[1],
                'firstName': row[2],
                'lastName': row[3],
                'name': f"{row[2]} {row[3]}",
                'email': row[4],
                'phone': row[5],
                'createdDate': str(row[6]) if row[6] else None,
                'resumeCount': row[7] or 0,
                'status': 'Active'
            })
        
        cursor.close()
        conn.close()
        
        print(f"📋 Retrieved {len(users)} users from database")
        
        return jsonify({
            'success': True,
            'count': len(users),
            'users': users
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting users: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/get-user/<int:user_id>', methods=['GET'])
def get_user_details(user_id):
    """Get detailed information about a specific user"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                UserId, Username, FirstName, LastName, EmailId, PhoneNumber, CreatedDate
            FROM Users
            WHERE UserId = ?
        """, (user_id,))
        
        user = cursor.fetchone()
        
        if not user:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Get user's resumes
        cursor.execute("""
            SELECT r.ResumeID, r.ResumeTitle, r.CreatedDate
            FROM Resumes r
            INNER JOIN PersonalInformation p ON r.ResumeID = p.ResumeID
            WHERE p.Email = ?
        """, (user[4],))
        
        resumes = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        user_data = {
            'userId': user[0],
            'username': user[1],
            'firstName': user[2],
            'lastName': user[3],
            'email': user[4],
            'phone': user[5],
            'createdDate': str(user[6]) if user[6] else None,
            'resumes': [
                {
                    'id': r[0],
                    'title': r[1],
                    'createdDate': str(r[2]) if r[2] else None
                } for r in resumes
            ]
        }
        
        return jsonify({'success': True, 'user': user_data}), 200
        
    except Exception as e:
        print(f"❌ Error getting user details: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================
# ANALYTICS ENDPOINTS
# ============================================================

@app.route('/api/analytics/overview', methods=['GET'])
def get_analytics_overview():
    """Get comprehensive analytics overview"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Total statistics
        cursor.execute("SELECT COUNT(*) FROM Resumes")
        total_resumes = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM Users")
        total_users = cursor.fetchone()[0]
        
        cursor.execute("SELECT SUM(ISNULL(visitor_count, 0)) FROM Resumes")
        total_views = cursor.fetchone()[0] or 0
        
        cursor.execute("SELECT SUM(ISNULL(download_count, 0)) FROM Resumes")
        total_downloads = cursor.fetchone()[0] or 0
        
        cursor.execute("SELECT COUNT(*) FROM Jobs")
        total_jobs = cursor.fetchone()[0]
        
        # Recent activity (last 7 days)
        cursor.execute("""
            SELECT COUNT(*) FROM Resumes 
            WHERE CreatedDate >= DATEADD(day, -7, GETDATE())
        """)
        recent_resumes = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM Jobs 
            WHERE PostedDate >= DATEADD(day, -7, GETDATE())
        """)
        recent_jobs = cursor.fetchone()[0]
        
        # Location distribution
        cursor.execute("""
            SELECT TOP 10 Location, COUNT(*) as count
            FROM PersonalInformation
            WHERE Location IS NOT NULL
            GROUP BY Location
            ORDER BY count DESC
        """)
        locations = [{'location': row[0], 'count': row[1]} for row in cursor.fetchall()]
        
        # Skills distribution (top 10)
        cursor.execute("""
            SELECT TOP 10 SkillName, COUNT(*) as count
            FROM Skills
            GROUP BY SkillName
            ORDER BY count DESC
        """)
        skills = [{'skill': row[0], 'count': row[1]} for row in cursor.fetchall()]
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'analytics': {
                'totals': {
                    'resumes': total_resumes,
                    'users': total_users,
                    'views': total_views,
                    'downloads': total_downloads,
                    'jobs': total_jobs
                },
                'recent': {
                    'resumes_last_7_days': recent_resumes,
                    'jobs_last_7_days': recent_jobs
                },
                'locations': locations,
                'skills': skills
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting analytics: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analytics/timeline', methods=['GET'])
def get_timeline_analytics():
    """Get resume creation timeline for last 30 days"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                CAST(CreatedDate AS DATE) as date,
                COUNT(*) as count
            FROM Resumes
            WHERE CreatedDate >= DATEADD(day, -30, GETDATE())
            GROUP BY CAST(CreatedDate AS DATE)
            ORDER BY date
        """)
        
        timeline = [
            {
                'date': str(row[0]),
                'count': row[1]
            } for row in cursor.fetchall()
        ]
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'timeline': timeline
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting timeline: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================
# RESUME ENDPOINTS
# ============================================================

@app.route('/api/save-resume', methods=['POST'])
def save_resume():
    """Save a complete resume to the database"""
    try:
        print("\n" + "="*70)
        print("📥 RECEIVING NEW RESUME DATA")
        print("="*70)
        
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. INSERT INTO RESUMES TABLE
        print("📝 Step 1: Creating Resume record...")
        cursor.execute("""
            INSERT INTO Resumes (ResumeTitle, Status, CreatedDate, UpdatedDate, visitor_count, download_count)
            OUTPUT INSERTED.ResumeID
            VALUES (?, 'Active', GETDATE(), GETDATE(), 0, 0)
        """, (f"{data.get('name', 'Untitled')} - Resume",))
        
        resume_id = cursor.fetchone()[0]
        print(f"   ✅ Resume created with ID: {resume_id}")
        
        # 2. INSERT INTO PERSONAL INFORMATION TABLE
        print("📝 Step 2: Saving Personal Information...")
        cursor.execute("""
            INSERT INTO PersonalInformation 
            (ResumeID, FullName, Email, PhoneNumber, DateOfBirth, Location, 
             PhotoPath, LinkedInURL, GitHubURL, CareerObjective, CreatedDate, UpdatedDate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())
        """, (
            resume_id,
            data.get('name'),
            data.get('email'),
            data.get('phone'),
            data.get('dob'),
            data.get('location'),
            data.get('photo', ''),
            data.get('linkedin', ''),
            data.get('github', ''),
            data.get('objective')
        ))
        print("   ✅ Personal information saved")
        
        # 3. INSERT WORK EXPERIENCE
        experience_list = data.get('experience', [])
        if experience_list:
            print(f"📝 Step 3: Saving {len(experience_list)} Work Experience entries...")
            for exp in experience_list:
                if exp and exp.get('company'):
                    experience_text = ""
                    if exp.get('startDate') and exp.get('endDate'):
                        try:
                            start = datetime.strptime(exp['startDate'], '%Y-%m-%d')
                            end = datetime.strptime(exp['endDate'], '%Y-%m-%d')
                            months = (end.year - start.year) * 12 + (end.month - start.month)
                            years = months // 12
                            months = months % 12
                            experience_text = f"{years} year(s) {months} month(s)"
                        except (ValueError, TypeError) as e:
                            print(f"   ⚠️  Warning: Could not parse dates: {e}")
                            experience_text = ""
                    
                    cursor.execute("""
                        INSERT INTO WorkExperience 
                        (ResumeID, CompanyName, JobRole, DateOfJoin, LastWorkingDate, Experience, CreatedDate, UpdatedDate)
                        VALUES (?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())
                    """, (
                        resume_id,
                        exp.get('company'),
                        exp.get('jobRole'),
                        exp.get('startDate'),
                        exp.get('endDate'),
                        experience_text
                    ))
            print(f"   ✅ Saved {len(experience_list)} experience entries")
        else:
            print("   ⏭️  Step 3: No work experience to save")
        
        # 4. INSERT EDUCATION
        education_list = data.get('education', [])
        if education_list:
            print(f"📝 Step 4: Saving {len(education_list)} Education entries...")
            for edu in education_list:
                if edu and edu.get('college'):
                    year_val = None
                    cgpa_val = None
                    
                    try:
                        if edu.get('year'):
                            year_val = int(edu.get('year'))
                    except (ValueError, TypeError) as e:
                        print(f"   ⚠️  Warning: Invalid year value: {e}")
                    
                    try:
                        if edu.get('cgpa'):
                            cgpa_val = float(edu.get('cgpa'))
                    except (ValueError, TypeError) as e:
                        print(f"   ⚠️  Warning: Invalid CGPA value: {e}")
                    
                    cursor.execute("""
                        INSERT INTO Education 
                        (ResumeID, College, University, Course, Year, CGPA, CreatedDate, UpdatedDate)
                        VALUES (?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())
                    """, (
                        resume_id,
                        edu.get('college'),
                        edu.get('university'),
                        edu.get('course'),
                        year_val,
                        cgpa_val
                    ))
            print(f"   ✅ Saved {len(education_list)} education entries")
        else:
            print("   ⏭️  Step 4: No education to save")
        
        # 5. INSERT PROJECTS
        projects_list = data.get('projects', [])
        if projects_list:
            print(f"📝 Step 5: Saving {len(projects_list)} Project entries...")
            for proj in projects_list:
                if proj and proj.get('title'):
                    cursor.execute("""
                        INSERT INTO Projects 
                        (ResumeID, ProjectTitle, ProjectLink, Organization, Description, CreatedDate, UpdatedDate)
                        VALUES (?, ?, ?, ?, ?, GETDATE(), GETDATE())
                    """, (
                        resume_id,
                        proj.get('title'),
                        proj.get('link', ''),
                        proj.get('company', ''),
                        proj.get('description', '')
                    ))
            print(f"   ✅ Saved {len(projects_list)} project entries")
        else:
            print("   ⏭️  Step 5: No projects to save")
        
        # 6. INSERT SKILLS
        personal_skills = data.get('personalSkills', [])
        professional_skills = data.get('professionalSkills', [])
        technical_skills = data.get('technicalSkills', [])
        
        total_skills = len(personal_skills) + len(professional_skills) + len(technical_skills)
        
        if total_skills > 0:
            print(f"📝 Step 6: Saving {total_skills} Skills...")
            
            for skill in personal_skills:
                if skill:
                    cursor.execute("""
                        INSERT INTO Skills (ResumeID, SkillType, SkillName, CreatedDate, UpdatedDate)
                        VALUES (?, 'Personal', ?, GETDATE(), GETDATE())
                    """, (resume_id, skill))
            
            for skill in professional_skills:
                if skill:
                    cursor.execute("""
                        INSERT INTO Skills (ResumeID, SkillType, SkillName, CreatedDate, UpdatedDate)
                        VALUES (?, 'Professional', ?, GETDATE(), GETDATE())
                    """, (resume_id, skill))
            
            for skill in technical_skills:
                if skill:
                    cursor.execute("""
                        INSERT INTO Skills (ResumeID, SkillType, SkillName, CreatedDate, UpdatedDate)
                        VALUES (?, 'Technical', ?, GETDATE(), GETDATE())
                    """, (resume_id, skill))
            
            print(f"   ✅ Saved {total_skills} skills")
        else:
            print("   ⏭️  Step 6: No skills to save")
        
        # 7. INSERT CERTIFICATIONS
        certifications_list = data.get('certifications', [])
        if certifications_list:
            print(f"📝 Step 7: Saving {len(certifications_list)} Certifications...")
            for cert in certifications_list:
                if cert:
                    cursor.execute("""
                        INSERT INTO Certifications (ResumeID, CertificationName, CreatedDate, UpdatedDate)
                        VALUES (?, ?, GETDATE(), GETDATE())
                    """, (resume_id, cert))
            print(f"   ✅ Saved {len(certifications_list)} certifications")
        else:
            print("   ⏭️  Step 7: No certifications to save")
        
        # 8. INSERT HOBBIES/INTERESTS
        hobbies_list = data.get('hobbies', [])
        if hobbies_list:
            print(f"📝 Step 8: Saving {len(hobbies_list)} Interests/Hobbies...")
            for hobby in hobbies_list:
                if hobby:
                    cursor.execute("""
                        INSERT INTO Interests (ResumeID, InterestName, CreatedDate, UpdatedDate)
                        VALUES (?, ?, GETDATE(), GETDATE())
                    """, (resume_id, hobby))
            print(f"   ✅ Saved {len(hobbies_list)} hobbies")
        else:
            print("   ⏭️  Step 8: No hobbies to save")
        
        # Commit all changes
        conn.commit()
        cursor.close()
        conn.close()
        
        print("="*70)
        print(f"✅ RESUME SAVED SUCCESSFULLY! (ID: {resume_id})")
        print("="*70 + "\n")
        
        return jsonify({
            "success": True,
            "message": "Resume saved successfully!",
            "resume_id": resume_id
        }), 201
        
    except Exception as e:
        print(f"❌ ERROR SAVING RESUME: {e}\n")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/get-resumes', methods=['GET'])
def get_all_resumes():
    """Get list of all saved resumes"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                r.ResumeID,
                r.ResumeTitle,
                r.Status,
                p.FullName,
                p.Email,
                p.PhoneNumber,
                p.Location,
                r.CreatedDate,
                r.UpdatedDate,
                ISNULL(r.visitor_count, 0) as visitor_count,
                ISNULL(r.download_count, 0) as download_count
            FROM Resumes r
            LEFT JOIN PersonalInformation p ON r.ResumeID = p.ResumeID
            ORDER BY r.CreatedDate DESC
        """)
        
        rows = cursor.fetchall()
        resumes = []
        
        for row in rows:
            resumes.append({
                "id": row[0],
                "title": row[1],
                "status": row[2],
                "name": row[3],
                "email": row[4],
                "phone": row[5],
                "location": row[6],
                "created_at": str(row[7]) if row[7] else None,
                "updated_at": str(row[8]) if row[8] else None,
                "visitor_count": int(row[9]) if row[9] is not None else 0,
                "download_count": int(row[10]) if row[10] is not None else 0
            })
        
        cursor.close()
        conn.close()
        
        print(f"📋 Retrieved {len(resumes)} resumes from database")
        
        return jsonify({
            "success": True,
            "count": len(resumes),
            "resumes": resumes
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting resumes: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/get-resume/<int:resume_id>', methods=['GET'])
def get_resume_details(resume_id):
    """Get complete details of a single resume"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT 
                r.ResumeID, r.ResumeTitle, r.Status, r.CreatedDate, r.UpdatedDate,
                ISNULL(r.visitor_count, 0) as visitor_count,
                ISNULL(r.download_count, 0) as download_count,
                p.FullName, p.Email, p.PhoneNumber, p.DateOfBirth, p.Location,
                p.LinkedInURL, p.GitHubURL, p.CareerObjective
            FROM Resumes r
            LEFT JOIN PersonalInformation p ON r.ResumeID = p.ResumeID
            WHERE r.ResumeID = ?
        """, (resume_id,))
        
        row = cursor.fetchone()
        if not row:
            cursor.close()
            conn.close()
            return jsonify({"success": False, "error": "Resume not found"}), 404
        
        resume = {
            "id": row[0], "title": row[1], "status": row[2],
            "created_at": str(row[3]) if row[3] else None,
            "updated_at": str(row[4]) if row[4] else None,
            "visitor_count": int(row[5]), "download_count": int(row[6]),
            "name": row[7], "email": row[8], "phone": row[9],
            "dob": str(row[10]) if row[10] else None,
            "location": row[11], "linkedin": row[12], "github": row[13],
            "objective": row[14],
            "experience": [], "education": [], "projects": [], "skills": []
        }

        # Fetch Experience
        cursor.execute("SELECT CompanyName, JobRole, DateOfJoin, LastWorkingDate FROM WorkExperience WHERE ResumeID = ?", (resume_id,))
        resume["experience"] = [{"company": r[0], "role": r[1], "start": str(r[2]), "end": str(r[3])} for r in cursor.fetchall()]

        # Fetch Education
        cursor.execute("SELECT College, Course, Year, CGPA FROM Education WHERE ResumeID = ?", (resume_id,))
        resume["education"] = [{"college": r[0], "course": r[1], "year": r[2], "cgpa": r[3]} for r in cursor.fetchall()]

        # Fetch Projects
        cursor.execute("SELECT ProjectTitle, ProjectLink, Description FROM Projects WHERE ResumeID = ?", (resume_id,))
        resume["projects"] = [{"title": r[0], "link": r[1], "desc": r[2]} for r in cursor.fetchall()]

        # Fetch Skills
        cursor.execute("SELECT SkillName, SkillType FROM Skills WHERE ResumeID = ?", (resume_id,))
        resume["skills"] = [{"name": r[0], "type": r[1]} for r in cursor.fetchall()]
        
        cursor.close()
        conn.close()
        
        print(f"📄 Resume {resume_id} details fetched.")
        return jsonify({"success": True, "resume": resume}), 200
        
    except Exception as e:
        print(f"❌ Error getting resume details: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/increment-view/<int:resume_id>', methods=['POST'])
def increment_view_count(resume_id):
    """Increment visitor count for a resume"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE Resumes 
            SET visitor_count = ISNULL(visitor_count, 0) + 1,
                UpdatedDate = GETDATE()
            WHERE ResumeID = ?
        """, (resume_id,))
        conn.commit()
        
        # Get updated count
        cursor.execute("SELECT ISNULL(visitor_count, 0) FROM Resumes WHERE ResumeID = ?", (resume_id,))
        new_count = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        print(f"👁️  View count incremented for resume {resume_id}. New count: {new_count}")
        return jsonify({"success": True, "new_count": new_count}), 200
        
    except Exception as e:
        print(f"❌ Error incrementing view count: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/increment-download/<int:resume_id>', methods=['POST'])
def increment_download_count(resume_id):
    """Increment download count for a resume"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE Resumes 
            SET download_count = ISNULL(download_count, 0) + 1,
                UpdatedDate = GETDATE()
            WHERE ResumeID = ?
        """, (resume_id,))
        
        # Get updated count
        cursor.execute("SELECT ISNULL(download_count, 0) FROM Resumes WHERE ResumeID = ?", (resume_id,))
        result = cursor.fetchone()
        new_count = result[0] if result else 0
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"⬇️  Resume {resume_id} downloaded. Download count: {new_count}")
        
        return jsonify({
            "success": True, 
            "message": "Download count incremented",
            "download_count": new_count
        }), 200
        
    except Exception as e:
        print(f"❌ Error incrementing download count: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/delete-resume/<int:resume_id>', methods=['DELETE'])
def delete_resume(resume_id):
    """Delete a resume"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT ResumeID FROM Resumes WHERE ResumeID = ?", (resume_id,))
        if not cursor.fetchone():
            return jsonify({"success": False, "error": "Resume not found"}), 404
        
        cursor.execute("DELETE FROM Resumes WHERE ResumeID = ?", (resume_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"🗑️  Resume {resume_id} deleted successfully")
        
        return jsonify({"success": True, "message": "Resume deleted"}), 200
        
    except Exception as e:
        print(f"❌ Error deleting resume: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# ============================================================
# JOB POSTING ENDPOINTS
# ============================================================

@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    """Get all jobs with company and skills information"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                j.JobID, j.JobTitle, j.JobDescription, j.EducationRequirement,
                j.ExperienceYears, j.JobType, j.SalaryPackage, j.JobLocation,
                j.ApplicationDeadline, j.Benefits, j.ContactEmail, j.JobStatus,
                j.PostedDate, c.CompanyName, c.CompanyID
            FROM Jobs j
            INNER JOIN Companies c ON j.CompanyID = c.CompanyID
            ORDER BY j.PostedDate DESC
        """)
        
        jobs = []
        for row in cursor.fetchall():
            job_id = row[0]
            
            # Get skills for this job
            cursor.execute("""
                SELECT js.jobskillName
                FROM JobSkills jsk
                INNER JOIN jobskill js ON jsk.SkillID = js.jobskillID
                WHERE jsk.JobID = ?
            """, (job_id,))
            
            skills = [skill_row[0] for skill_row in cursor.fetchall()]
            
            jobs.append({
                'jobId': job_id,
                'jobTitle': row[1],
                'jobDescription': row[2],
                'educationRequirement': row[3],
                'experienceYears': float(row[4]),
                'jobType': row[5],
                'salaryPackage': row[6],
                'jobLocation': row[7],
                'applicationDeadline': row[8].isoformat() if row[8] else None,
                'benefits': row[9],
                'contactEmail': row[10],
                'jobStatus': row[11],
                'postedDate': row[12].isoformat() if row[12] else None,
                'companyName': row[13],
                'companyId': row[14],
                'skills': skills
            })
        
        conn.close()
        print(f"📋 Retrieved {len(jobs)} jobs from database")
        return jsonify({'success': True, 'jobs': jobs, 'count': len(jobs)}), 200
        
    except Exception as e:
        print(f"❌ Error in get_jobs: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/jobs/<int:job_id>', methods=['GET'])
def get_job(job_id):
    """Get a specific job by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                j.JobID, j.JobTitle, j.JobDescription, j.EducationRequirement,
                j.ExperienceYears, j.JobType, j.SalaryPackage, j.JobLocation,
                j.ApplicationDeadline, j.Benefits, j.ContactEmail, j.JobStatus,
                j.PostedDate, c.CompanyName, c.CompanyID
            FROM Jobs j
            INNER JOIN Companies c ON j.CompanyID = c.CompanyID
            WHERE j.JobID = ?
        """, (job_id,))
        
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            return jsonify({'success': False, 'error': 'Job not found'}), 404
        
        cursor.execute("""
            SELECT js.jobskillName, js.jobskillID
            FROM JobSkills jsk
            INNER JOIN jobskill js ON jsk.SkillID = js.jobskillID
            WHERE jsk.JobID = ?
        """, (job_id,))
        
        skills = [{'skillId': skill_row[1], 'skillName': skill_row[0]} for skill_row in cursor.fetchall()]
        
        job = {
            'jobId': row[0],
            'jobTitle': row[1],
            'jobDescription': row[2],
            'educationRequirement': row[3],
            'experienceYears': float(row[4]),
            'jobType': row[5],
            'salaryPackage': row[6],
            'jobLocation': row[7],
            'applicationDeadline': row[8].isoformat() if row[8] else None,
            'benefits': row[9],
            'contactEmail': row[10],
            'jobStatus': row[11],
            'postedDate': row[12].isoformat() if row[12] else None,
            'companyName': row[13],
            'companyId': row[14],
            'skills': skills
        }
        
        conn.close()
        return jsonify({'success': True, 'job': job}), 200
        
    except Exception as e:
        print(f"❌ Error in get_job: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/jobs', methods=['POST'])
def create_job():
    """Create a new job posting with safety checks for None values"""
    conn = None
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'No data received'}), 400
            
        print(f"📝 Received job data: {data}")
        
        # --- THE FIX FOR 'NoneType' error ---
        # We use (data.get('field') or "") to ensure we never call .strip() on None
        title = (data.get('title') or "").strip()
        company_name = (data.get('company') or "").strip()
        description = (data.get('description') or "").strip()
        education = (data.get('education') or "").strip()
        location = (data.get('location') or "").strip()
        package = (data.get('package') or "").strip()
        job_type = (data.get('jobType') or "").strip()
        benefits = (data.get('benefits') or "").strip() # This was crashing
        contact_email = (data.get('email') or "").strip() # This was crashing
        
        # Safe extraction for numeric/list data
        experience = data.get('experience', '0')
        skills = data.get('skills', [])
        deadline = data.get('deadline')

        # Basic Validation
        if not title or not company_name:
            return jsonify({'success': False, 'error': 'Job Title and Company are required'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # 1. Handle Company (Get ID or Create)
        cursor.execute("SELECT CompanyID FROM Companies WHERE CompanyName = ?", (company_name,))
        comp_row = cursor.fetchone()
        if comp_row:
            company_id = comp_row[0]
        else:
            cursor.execute("INSERT INTO Companies (CompanyName) OUTPUT INSERTED.CompanyID VALUES (?)", (company_name,))
            company_id = cursor.fetchone()[0]

        # 2. Insert the Job
        # We convert experience to float here to match SQL DECIMAL type
        cursor.execute("""
            INSERT INTO Jobs (
                CompanyID, JobTitle, JobDescription, EducationRequirement,
                ExperienceYears, JobType, SalaryPackage, JobLocation,
                ApplicationDeadline, Benefits, ContactEmail, JobStatus, PostedDate
            )
            OUTPUT INSERTED.JobID
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', GETDATE())
        """, (
            company_id, title, description, education,
            float(experience) if experience else 0.0,
            job_type, package, location, deadline, benefits, contact_email
        ))
        
        job_id = cursor.fetchone()[0]

        # 3. Handle Skills (The Many-to-Many link)
        if isinstance(skills, list):
            for s_name in skills:
                s_name = s_name.strip()
                if not s_name: 
                    continue
                
                # Check if skill exists in master table
                cursor.execute("SELECT jobskillID FROM jobskill WHERE jobskillName = ?", (s_name,))
                s_row = cursor.fetchone()
                if s_row:
                    s_id = s_row[0]
                else:
                    cursor.execute("INSERT INTO jobskill (jobskillName) OUTPUT INSERTED.jobskillID VALUES (?)", (s_name,))
                    s_id = cursor.fetchone()[0]
                
                # Link Job to Skill in junction table
                cursor.execute("INSERT INTO JobSkills (JobID, SkillID) VALUES (?, ?)", (job_id, s_id))

        conn.commit()
        print(f"✅ Job {job_id} created successfully!")
        return jsonify({'success': True, 'message': 'Job posted successfully', 'jobId': job_id}), 201

    except Exception as e:
        if conn: 
            conn.rollback()
        print(f"❌ Error in create_job: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/jobs/<int:job_id>', methods=['PUT'])
def update_job(job_id):
    """Update an existing job"""
    try:
        data = request.json
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT JobID FROM Jobs WHERE JobID = ?", (job_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'error': 'Job not found'}), 404
        
        update_fields = []
        params = []
        
        if 'title' in data:
            update_fields.append("JobTitle = ?")
            params.append(data['title'].strip())
        
        if 'description' in data:
            update_fields.append("JobDescription = ?")
            params.append(data['description'].strip())
        
        if 'education' in data:
            update_fields.append("EducationRequirement = ?")
            params.append(data['education'])
        
        if 'experience' in data:
            update_fields.append("ExperienceYears = ?")
            params.append(float(data['experience']))
        
        if 'jobType' in data:
            update_fields.append("JobType = ?")
            params.append(data['jobType'])
        
        if 'package' in data:
            update_fields.append("SalaryPackage = ?")
            params.append(data['package'].strip())
        
        if 'location' in data:
            update_fields.append("JobLocation = ?")
            params.append(data['location'].strip())
        
        if 'status' in data:
            update_fields.append("JobStatus = ?")
            params.append(data['status'])
        
        if update_fields:
            params.append(job_id)
            sql = f"UPDATE Jobs SET {', '.join(update_fields)} WHERE JobID = ?"
            cursor.execute(sql, params)
        
        if 'skills' in data:
            cursor.execute("DELETE FROM JobSkills WHERE JobID = ?", (job_id,))
            
            for skill_name in data['skills']:
                skill_name = skill_name.strip()
                if not skill_name:
                    continue
                
                cursor.execute("SELECT jobskillID FROM jobskill WHERE jobskillName = ?", 
                              (skill_name,))
                skill_row = cursor.fetchone()
                
                if skill_row:
                    skill_id = skill_row[0]
                else:
                    cursor.execute(
                        "INSERT INTO jobskill (jobskillName) OUTPUT INSERTED.jobskillID VALUES (?)",
                        (skill_name,)
                    )
                    skill_id = cursor.fetchone()[0]
                
                cursor.execute(
                    "INSERT INTO JobSkills (JobID, SkillID) VALUES (?, ?)",
                    (job_id, skill_id)
                )
        
        conn.commit()
        conn.close()
        
        print(f"✅ Job {job_id} updated successfully")
        return jsonify({'success': True, 'message': 'Job updated successfully'}), 200
        
    except Exception as e:
        print(f"❌ Error in update_job: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/jobs/<int:job_id>', methods=['DELETE'])
def delete_job(job_id):
    """Delete a job posting"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT JobID FROM Jobs WHERE JobID = ?", (job_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'error': 'Job not found'}), 404
        
        cursor.execute("DELETE FROM Jobs WHERE JobID = ?", (job_id,))
        
        conn.commit()
        conn.close()
        
        print(f"🗑️  Job {job_id} deleted successfully")
        return jsonify({'success': True, 'message': 'Job deleted successfully'}), 200
        
    except Exception as e:
        print(f"❌ Error in delete_job: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/jobs/search', methods=['GET'])
def search_jobs():
    """Search and filter jobs"""
    try:
        keyword = request.args.get('keyword', '').strip()
        location = request.args.get('location', '').strip()
        job_type = request.args.get('jobType', '').strip()
        experience_min = request.args.get('experienceMin', type=float)
        experience_max = request.args.get('experienceMax', type=float)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT DISTINCT
                j.JobID, j.JobTitle, j.JobDescription, j.EducationRequirement,
                j.ExperienceYears, j.JobType, j.SalaryPackage, j.JobLocation,
                j.ApplicationDeadline, j.Benefits, j.ContactEmail, j.JobStatus,
                j.PostedDate, c.CompanyName, c.CompanyID
            FROM Jobs j
            INNER JOIN Companies c ON j.CompanyID = c.CompanyID
            WHERE j.JobStatus = 'Open'
        """
        
        params = []
        
        if keyword:
            query += " AND (j.JobTitle LIKE ? OR j.JobDescription LIKE ? OR c.CompanyName LIKE ?)"
            search_term = f'%{keyword}%'
            params.extend([search_term, search_term, search_term])
        
        if location:
            query += " AND j.JobLocation LIKE ?"
            params.append(f'%{location}%')
        
        if job_type:
            query += " AND j.JobType = ?"
            params.append(job_type)
        
        if experience_min is not None:
            query += " AND j.ExperienceYears >= ?"
            params.append(experience_min)
        
        if experience_max is not None:
            query += " AND j.ExperienceYears <= ?"
            params.append(experience_max)
        
        query += " ORDER BY j.PostedDate DESC"
        
        cursor.execute(query, params)
        
        jobs = []
        for row in cursor.fetchall():
            job_id = row[0]
            
            cursor.execute("""
                SELECT js.jobskillName
                FROM JobSkills jsk
                INNER JOIN jobskill js ON jsk.SkillID = js.jobskillID
                WHERE jsk.JobID = ?
            """, (job_id,))
            
            skills = [skill_row[0] for skill_row in cursor.fetchall()]
            
            jobs.append({
                'jobId': job_id,
                'jobTitle': row[1],
                'jobDescription': row[2],
                'educationRequirement': row[3],
                'experienceYears': float(row[4]),
                'jobType': row[5],
                'salaryPackage': row[6],
                'jobLocation': row[7],
                'applicationDeadline': row[8].isoformat() if row[8] else None,
                'benefits': row[9],
                'contactEmail': row[10],
                'jobStatus': row[11],
                'postedDate': row[12].isoformat() if row[12] else None,
                'companyName': row[13],
                'companyId': row[14],
                'skills': skills
            })
        
        conn.close()
        print(f"🔍 Search returned {len(jobs)} jobs")
        return jsonify({'success': True, 'jobs': jobs, 'count': len(jobs)}), 200
        
    except Exception as e:
        print(f"❌ Error in search_jobs: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================
# COMPANY & SKILL ENDPOINTS
# ============================================================

@app.route('/api/companies', methods=['GET'])
def get_companies():
    """Get all companies"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT CompanyID, CompanyName, CreatedAt FROM Companies ORDER BY CompanyName")
        
        companies = []
        for row in cursor.fetchall():
            companies.append({
                'companyId': row[0],
                'companyName': row[1],
                'createdAt': row[2].isoformat() if row[2] else None
            })
        
        conn.close()
        return jsonify({'success': True, 'companies': companies}), 200
        
    except Exception as e:
        print(f"❌ Error in get_companies: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/skills', methods=['GET'])
def get_skills():
    """Get all skills from master table"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT jobskillID, jobskillName FROM jobskill ORDER BY jobskillName")
        
        skills = []
        for row in cursor.fetchall():
            skills.append({
                'skillId': row[0],
                'skillName': row[1]
            })
        
        conn.close()
        return jsonify({'success': True, 'skills': skills}), 200
        
    except Exception as e:
        print(f"❌ Error in get_skills: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================
# START SERVER
# ============================================================
if __name__ == '__main__':
    print("\n" + "="*70)
    print("🚀 UNIFIED BACKEND - RESUME BUILDER & JOB PORTAL API")
    print("="*70)
    print(f"📊 Database: {Config.DB_NAME}")
    print(f"🖥️  Server: {Config.DB_SERVER}")
    print("="*70)
    
    # Test database connection
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM Users")
        user_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM Resumes")
        resume_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM Jobs")
        job_count = cursor.fetchone()[0]
        print("✅ Database connected!")
        print(f"   Users: {user_count}")
        print(f"   Resumes: {resume_count}")
        print(f"   Jobs: {job_count}")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"⚠️  Database warning: {e}")
    
    print("\n📚 Available API Endpoints:")
    print("\n   AUTHENTICATION:")
    print("   POST   /api/register")
    print("   POST   /api/login")
    print("   POST   /api/logout")
    print("   POST   /api/check-username")
    print("   POST   /api/check-email")
    print("\n   USER MANAGEMENT:")
    print("   GET    /api/get-all-users")
    print("   GET    /api/get-user/<id>")
    print("\n   ANALYTICS:")
    print("   GET    /api/analytics/overview")
    print("   GET    /api/analytics/timeline")
    print("\n   RESUME MANAGEMENT:")
    print("   POST   /api/save-resume")
    print("   GET    /api/get-resumes")
    print("   GET    /api/get-resume/<id>")
    print("   POST   /api/increment-view/<id>")
    print("   POST   /api/increment-download/<id>")
    print("   DELETE /api/delete-resume/<id>")
    print("\n   JOB MANAGEMENT:")
    print("   GET    /api/jobs")
    print("   GET    /api/jobs/<id>")
    print("   POST   /api/jobs")
    print("   PUT    /api/jobs/<id>")
    print("   DELETE /api/jobs/<id>")
    print("   GET    /api/jobs/search")
    print("\n   UTILITIES:")
    print("   GET    /api/companies")
    print("   GET    /api/skills")
    print("   GET    /api/health")
    print("\n" + "="*70)
    print("✅ Server ready: http://localhost:5000")
    print("   Press Ctrl+C to stop")
    print("="*70 + "\n")
    
    app.run(debug=True, port=5000, host='0.0.0.0')