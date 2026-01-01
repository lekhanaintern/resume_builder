# backend.py - Resume Builder API for MSSQL Database
from flask import Flask, request, jsonify
from flask_cors import CORS
import pyodbc
from datetime import datetime
from config import Config

app = Flask(__name__)
CORS(app)  # Allow frontend to connect

# ============ DATABASE CONNECTION ============
def get_db_connection():
    """Create and return database connection"""
    try:
        conn = pyodbc.connect(Config.get_connection_string())
        return conn
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        raise

# ============ TEST DATABASE CONNECTION ON STARTUP ============
def test_connection():
    """Test if database connection works"""
    try:
        print("🔍 Testing database connection...")
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT @@VERSION, DB_NAME()")
        version, db_name = cursor.fetchone()
        cursor.close()
        conn.close()
        print(f"✅ Connected to database: {db_name}")
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

# ============ API ENDPOINT 1: SAVE RESUME ============
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
            INSERT INTO Resumes (ResumeTitle, Status, CreatedDate)
            OUTPUT INSERTED.ResumeID
            VALUES (?, 'Active', GETDATE())
        """, (f"{data.get('name', 'Untitled')} - Resume",))
        
        resume_id = cursor.fetchone()[0]
        print(f"   ✅ Resume created with ID: {resume_id}")
        
        # 2. INSERT INTO PERSONAL INFORMATION TABLE
        print("📝 Step 2: Saving Personal Information...")
        cursor.execute("""
            INSERT INTO PersonalInformation 
            (ResumeID, FullName, Email, PhoneNumber, DateOfBirth, Location, 
             PhotoPath, LinkedInURL, GitHubURL, CareerObjective, CreatedDate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE())
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
                    # Calculate experience duration
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
                        (ResumeID, CompanyName, JobRole, DateOfJoin, LastWorkingDate, Experience, CreatedDate)
                        VALUES (?, ?, ?, ?, ?, ?, GETDATE())
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
                    # Convert year and cgpa to proper types
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
                        (ResumeID, College, University, Course, Year, CGPA, CreatedDate)
                        VALUES (?, ?, ?, ?, ?, ?, GETDATE())
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
                        (ResumeID, ProjectTitle, ProjectLink, Organization, Description, CreatedDate)
                        VALUES (?, ?, ?, ?, ?, GETDATE())
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
                        INSERT INTO Skills (ResumeID, SkillType, SkillName, CreatedDate)
                        VALUES (?, 'Personal', ?, GETDATE())
                    """, (resume_id, skill))
            
            for skill in professional_skills:
                if skill:
                    cursor.execute("""
                        INSERT INTO Skills (ResumeID, SkillType, SkillName, CreatedDate)
                        VALUES (?, 'Professional', ?, GETDATE())
                    """, (resume_id, skill))
            
            for skill in technical_skills:
                if skill:
                    cursor.execute("""
                        INSERT INTO Skills (ResumeID, SkillType, SkillName, CreatedDate)
                        VALUES (?, 'Technical', ?, GETDATE())
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
                        INSERT INTO Certifications (ResumeID, CertificationName, CreatedDate)
                        VALUES (?, ?, GETDATE())
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
                        INSERT INTO Interests (ResumeID, InterestName, CreatedDate)
                        VALUES (?, ?, GETDATE())
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
            "message": "Resume saved successfully to MSSQL database!",
            "resume_id": resume_id
        }), 201
        
    except Exception as e:
        print(f"❌ ERROR SAVING RESUME: {e}\n")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# ============ API ENDPOINT 2: GET ALL RESUMES ============
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
                r.VisitorCount,
                r.DownloadCount
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
                "visitor_count": row[8],
                "download_count": row[9]
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

# ============ API ENDPOINT 3: DELETE RESUME ============
@app.route('/api/delete-resume/<int:resume_id>', methods=['DELETE'])
def delete_resume(resume_id):
    """Delete a resume (cascading delete removes all related records)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if resume exists
        cursor.execute("SELECT ResumeID FROM Resumes WHERE ResumeID = ?", (resume_id,))
        if not cursor.fetchone():
            return jsonify({"success": False, "error": "Resume not found"}), 404
        
        # Delete resume (cascade will delete all related records)
        cursor.execute("DELETE FROM Resumes WHERE ResumeID = ?", (resume_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"🗑️  Resume {resume_id} deleted successfully")
        
        return jsonify({"success": True, "message": "Resume deleted successfully"}), 200
        
    except Exception as e:
        print(f"❌ Error deleting resume: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# ============ START SERVER ============
if __name__ == '__main__':
    print("\n" + "="*70)
    print("🚀 RESUME BUILDER BACKEND API - MSSQL VERSION")
    print("="*70)
    print(f"📊 Database: {Config.DB_NAME}")
    print(f"🖥️  Server: {Config.DB_SERVER}")
    print("="*70)
    
    # Test database connection
    if test_connection():
        print("\n📚 Available API Endpoints:")
        print("   POST   /api/save-resume        → Save new resume")
        print("   GET    /api/get-resumes        → Get all resumes list")
        print("   DELETE /api/delete-resume/<id> → Delete a resume")
        print("\n" + "="*70)
        print("✅ Server is ready! Running on: http://localhost:5000")
        print("   Press Ctrl+C to stop the server")
        print("="*70 + "\n")
        
        app.run(debug=True, port=5000, host='0.0.0.0')
    else:
        print("\n❌ Cannot start server - Database connection failed!")
        print("="*70 + "\n")