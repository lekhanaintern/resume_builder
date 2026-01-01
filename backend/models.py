# models.py - Data Models for Resume Builder
from datetime import datetime
from typing import List, Optional

class PersonalInformation:
    """Model for personal information"""
    def __init__(self, name: str, email: str, phone: str, dob: str, 
                 location: str, objective: str, linkedin: str = "", 
                 github: str = "", photo: str = ""):
        self.name = name
        self.email = email
        self.phone = phone
        self.dob = dob
        self.location = location
        self.linkedin = linkedin
        self.github = github
        self.photo = photo
        self.objective = objective
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "dob": self.dob,
            "location": self.location,
            "linkedin": self.linkedin,
            "github": self.github,
            "photo": self.photo,
            "objective": self.objective
        }
    
    @staticmethod
    def from_dict(data: dict):
        """Create from dictionary"""
        return PersonalInformation(
            name=data.get('name', ''),
            email=data.get('email', ''),
            phone=data.get('phone', ''),
            dob=data.get('dob', ''),
            location=data.get('location', ''),
            objective=data.get('objective', ''),
            linkedin=data.get('linkedin', ''),
            github=data.get('github', ''),
            photo=data.get('photo', '')
        )
    
    def validate(self):
        """Validate required fields"""
        errors = []
        if not self.name:
            errors.append("Name is required")
        if not self.email:
            errors.append("Email is required")
        if not self.phone:
            errors.append("Phone is required")
        if not self.dob:
            errors.append("Date of birth is required")
        if not self.location:
            errors.append("Location is required")
        if not self.objective:
            errors.append("Objective is required")
        return errors


class WorkExperience:
    """Model for work experience"""
    def __init__(self, company: str, job_role: str, start_date: str, 
                 end_date: str, experience: str = ""):
        self.company = company
        self.job_role = job_role
        self.start_date = start_date
        self.end_date = end_date
        self.experience = experience
    
    def to_dict(self):
        return {
            "company": self.company,
            "jobRole": self.job_role,
            "startDate": self.start_date,
            "endDate": self.end_date,
            "experience": self.experience
        }
    
    @staticmethod
    def from_dict(data: dict):
        return WorkExperience(
            company=data.get('company', ''),
            job_role=data.get('jobRole', ''),
            start_date=data.get('startDate', ''),
            end_date=data.get('endDate', ''),
            experience=data.get('experience', '')
        )
    
    def calculate_experience(self):
        """Calculate years and months of experience"""
        if not self.start_date or not self.end_date:
            return "0 years 0 months"
        
        try:
            start = datetime.strptime(self.start_date, '%Y-%m-%d')
            end = datetime.strptime(self.end_date, '%Y-%m-%d')
            months = (end.year - start.year) * 12 + (end.month - start.month)
            years = months // 12
            months = months % 12
            return f"{years} year(s) {months} month(s)"
        except (ValueError, TypeError) as e:
            print(f"Warning: Could not calculate experience: {e}")
            return "0 years 0 months"


class Education:
    """Model for education"""
    def __init__(self, college: str, university: str, course: str, 
                 year: str, cgpa: str = ""):
        self.college = college
        self.university = university
        self.course = course
        self.year = year
        self.cgpa = cgpa
    
    def to_dict(self):
        return {
            "college": self.college,
            "university": self.university,
            "course": self.course,
            "year": self.year,
            "cgpa": self.cgpa
        }
    
    @staticmethod
    def from_dict(data: dict):
        return Education(
            college=data.get('college', ''),
            university=data.get('university', ''),
            course=data.get('course', ''),
            year=data.get('year', ''),
            cgpa=data.get('cgpa', '')
        )


class Project:
    """Model for project"""
    def __init__(self, title: str, description: str, link: str = "", 
                 company: str = ""):
        self.title = title
        self.description = description
        self.link = link
        self.company = company
    
    def to_dict(self):
        return {
            "title": self.title,
            "description": self.description,
            "link": self.link,
            "company": self.company
        }
    
    @staticmethod
    def from_dict(data: dict):
        return Project(
            title=data.get('title', ''),
            description=data.get('description', ''),
            link=data.get('link', ''),
            company=data.get('company', '')
        )


class Skills:
    """Model for skills"""
    def __init__(self, personal: List[str] = None, professional: List[str] = None, 
                 technical: List[str] = None):
        self.personal = personal or []
        self.professional = professional or []
        self.technical = technical or []
    
    def to_dict(self):
        return {
            "personal": self.personal,
            "professional": self.professional,
            "technical": self.technical
        }
    
    @staticmethod
    def from_dict(data: dict):
        return Skills(
            personal=data.get('personalSkills', []),
            professional=data.get('professionalSkills', []),
            technical=data.get('technicalSkills', [])
        )


class Resume:
    """Main Resume model that combines all other models"""
    def __init__(self, resume_id: Optional[int] = None):
        self.resume_id = resume_id
        self.personal_info: Optional[PersonalInformation] = None
        self.work_experience: List[WorkExperience] = []
        self.education: List[Education] = []
        self.projects: List[Project] = []
        self.skills: Optional[Skills] = None
        self.certifications: List[str] = []
        self.hobbies: List[str] = []
        self.declaration: str = ""
    
    def to_dict(self):
        """Convert entire resume to dictionary"""
        return {
            "resume_id": self.resume_id,
            "personal_info": self.personal_info.to_dict() if self.personal_info else {},
            "work_experience": [exp.to_dict() for exp in self.work_experience],
            "education": [edu.to_dict() for edu in self.education],
            "projects": [proj.to_dict() for proj in self.projects],
            "skills": self.skills.to_dict() if self.skills else {},
            "certifications": self.certifications,
            "hobbies": self.hobbies,
            "declaration": self.declaration
        }
    
    @staticmethod
    def from_dict(data: dict):
        """Create Resume from dictionary (from frontend)"""
        resume = Resume()
        
        # Personal Information
        if data:
            resume.personal_info = PersonalInformation.from_dict(data)
        
        # Work Experience
        if 'experience' in data:
            resume.work_experience = [
                WorkExperience.from_dict(exp) 
                for exp in data['experience'] 
                if exp
            ]
        
        # Education
        if 'education' in data:
            resume.education = [
                Education.from_dict(edu) 
                for edu in data['education'] 
                if edu
            ]
        
        # Projects
        if 'projects' in data:
            resume.projects = [
                Project.from_dict(proj) 
                for proj in data['projects'] 
                if proj
            ]
        
        # Skills
        resume.skills = Skills.from_dict(data)
        
        # Certifications & Hobbies
        resume.certifications = data.get('certifications', [])
        resume.hobbies = data.get('hobbies', [])
        resume.declaration = data.get('declaration', '')
        
        return resume
    
    def validate(self):
        """Validate entire resume"""
        errors = []
        
        if self.personal_info:
            personal_errors = self.personal_info.validate()
            errors.extend(personal_errors)
        else:
            errors.append("Personal information is required")
        
        return errors