// models.js - JavaScript Data Models for Resume Builder

/**
 * Personal Information Model
 */
class PersonalInformation {
    constructor(data = {}) {
        this.name = data.name || '';
        this.email = data.email || '';
        this.phone = data.phone || '';
        this.dob = data.dob || '';
        this.location = data.location || '';
        this.linkedin = data.linkedin || '';
        this.github = data.github || '';
        this.photo = data.photo || '';
        this.objective = data.objective || '';
    }

    validate() {
        const errors = [];
        
        if (!this.name) errors.push('Name is required');
        if (!this.email) errors.push('Email is required');
        if (!this.phone) errors.push('Phone is required');
        if (!this.dob) errors.push('Date of birth is required');
        if (!this.location) errors.push('Location is required');
        if (!this.objective) errors.push('Objective is required');
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (this.email && !emailRegex.test(this.email)) {
            errors.push('Invalid email format');
        }
        
        return errors;
    }

    toJSON() {
        return {
            name: this.name,
            email: this.email,
            phone: this.phone,
            dob: this.dob,
            location: this.location,
            linkedin: this.linkedin,
            github: this.github,
            photo: this.photo,
            objective: this.objective
        };
    }
}

/**
 * Work Experience Model
 */
class WorkExperience {
    constructor(data = {}) {
        this.company = data.company || '';
        this.jobRole = data.jobRole || '';
        this.startDate = data.startDate || '';
        this.endDate = data.endDate || '';
        this.experience = data.experience || '';
    }

    calculateExperience() {
        if (!this.startDate || !this.endDate) {
            return '0 years 0 months';
        }

        const start = new Date(this.startDate);
        const end = new Date(this.endDate);

        let months = (end.getFullYear() - start.getFullYear()) * 12 + 
                     (end.getMonth() - start.getMonth());

        if (end.getDate() < start.getDate()) {
            months--;
        }

        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;

        return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    }

    validate() {
        const errors = [];
        
        if (!this.company) errors.push('Company name is required');
        if (!this.jobRole) errors.push('Job role is required');
        if (!this.startDate) errors.push('Start date is required');
        if (!this.endDate) errors.push('End date is required');
        
        if (this.startDate && this.endDate) {
            if (new Date(this.endDate) <= new Date(this.startDate)) {
                errors.push('End date must be after start date');
            }
        }
        
        return errors;
    }

    toJSON() {
        return {
            company: this.company,
            jobRole: this.jobRole,
            startDate: this.startDate,
            endDate: this.endDate,
            experience: this.calculateExperience()
        };
    }
}

/**
 * Education Model
 */
class Education {
    constructor(data = {}) {
        this.college = data.college || '';
        this.university = data.university || '';
        this.course = data.course || '';
        this.year = data.year || '';
        this.cgpa = data.cgpa || '';
    }

    validate() {
        const errors = [];
        
        if (!this.college) errors.push('College name is required');
        if (!this.university) errors.push('University name is required');
        if (!this.course) errors.push('Course is required');
        if (!this.year) errors.push('Year is required');
        
        if (this.year && !/^\d{4}$/.test(this.year)) {
            errors.push('Year must be a 4-digit number');
        }
        
        return errors;
    }

    toJSON() {
        return {
            college: this.college,
            university: this.university,
            course: this.course,
            year: this.year,
            cgpa: this.cgpa
        };
    }
}

/**
 * Project Model
 */
class Project {
    constructor(data = {}) {
        this.title = data.title || '';
        this.description = data.description || '';
        this.link = data.link || '';
        this.company = data.company || '';
    }

    validate() {
        const errors = [];
        
        if (!this.title) errors.push('Project title is required');
        if (!this.description) errors.push('Project description is required');
        if (!this.company) errors.push('Organization/Company is required');
        
        return errors;
    }

    toJSON() {
        return {
            title: this.title,
            description: this.description,
            link: this.link,
            company: this.company
        };
    }
}

/**
 * Skills Model
 */
class Skills {
    constructor(data = {}) {
        this.personalSkills = data.personalSkills || [];
        this.professionalSkills = data.professionalSkills || [];
        this.technicalSkills = data.technicalSkills || [];
    }

    toJSON() {
        return {
            personalSkills: this.personalSkills,
            professionalSkills: this.professionalSkills,
            technicalSkills: this.technicalSkills
        };
    }
}

/**
 * Main Resume Model
 */
class Resume {
    constructor() {
        this.resumeId = null;
        this.personalInfo = new PersonalInformation();
        this.workExperience = [];
        this.education = [];
        this.projects = [];
        this.skills = new Skills();
        this.certifications = [];
        this.hobbies = [];
        this.declaration = '';
    }

    fromFormData(formData) {
        this.personalInfo = new PersonalInformation(formData);

        this.workExperience = (formData.experience || [])
            .filter(exp => exp && exp.company)
            .map(exp => new WorkExperience(exp));

        this.education = (formData.education || [])
            .filter(edu => edu && edu.college)
            .map(edu => new Education(edu));

        this.projects = (formData.projects || [])
            .filter(proj => proj && proj.title)
            .map(proj => new Project(proj));

        this.skills = new Skills({
            personalSkills: formData.personalSkills || [],
            professionalSkills: formData.professionalSkills || [],
            technicalSkills: formData.technicalSkills || []
        });

        this.certifications = (formData.certifications || []).filter(c => c);
        this.hobbies = (formData.hobbies || []).filter(h => h);
        this.declaration = formData.declaration || '';

        return this;
    }

    validate() {
        const errors = [];

        const personalErrors = this.personalInfo.validate();
        errors.push(...personalErrors);

        this.workExperience.forEach((exp, index) => {
            const expErrors = exp.validate();
            expErrors.forEach(err => errors.push(`Experience ${index + 1}: ${err}`));
        });

        this.education.forEach((edu, index) => {
            const eduErrors = edu.validate();
            eduErrors.forEach(err => errors.push(`Education ${index + 1}: ${err}`));
        });

        this.projects.forEach((proj, index) => {
            const projErrors = proj.validate();
            projErrors.forEach(err => errors.push(`Project ${index + 1}: ${err}`));
        });

        return errors;
    }

    toJSON() {
        return {
            ...this.personalInfo.toJSON(),
            experience: this.workExperience.map(exp => exp.toJSON()),
            education: this.education.map(edu => edu.toJSON()),
            projects: this.projects.map(proj => proj.toJSON()),
            ...this.skills.toJSON(),
            certifications: this.certifications,
            hobbies: this.hobbies,
            declaration: this.declaration
        };
    }
}