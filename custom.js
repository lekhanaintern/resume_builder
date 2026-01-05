/* ========= Global Variables ========= */
let sectionStates = {
  experienceContainer: true,
  educationContainer: true,
  projectsContainer: true,
  skillsMainContainer: true,
  hobbiesContainer: true,
  certificationsContainer: true
};

/* ========= Regex ========= */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const urlRegex = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]{2,}(\/[\w\-._~:/?#[\]@!$&'()*+,;=.]+)?$/;

/* ========= Initialize default entries on page load ========= */
window.addEventListener('DOMContentLoaded', function() {
  // Add one default entry for each optional section
  addExperience();
  addEducation();
  addProject();
  addHobby();
  addCertification();
});

/* ========= Section Toggle Function ========= */
function toggleSection(containerId, button) {
  const container = document.getElementById(containerId);
  const checkbox = button.querySelector('input[type="checkbox"]');
  
  if (sectionStates[containerId]) {
    // Hide section
    container.style.display = 'none';
    button.classList.add('section-hidden');
    checkbox.checked = false;
    sectionStates[containerId] = false;
  } else {
    // Show section
    container.style.display = 'block';
    button.classList.remove('section-hidden');
    checkbox.checked = true;
    sectionStates[containerId] = true;
  }
}

/* ========= Error helpers ========= */
function showError(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message || "";
}

function requireValue(id, errorId, label) {
  const el = document.getElementById(id);
  const value = (el.value || "").trim();
  if (!value) {
    showError(errorId, `${label} is required.`);
    return null;
  }
  showError(errorId, "");
  return value;
}

/* ========= Validation ========= */
function validatePersonal() {
  let ok = true;

  const name = requireValue("name", "error-name", "Name");
  if (!name) ok = false;

  const email = requireValue("email", "error-email", "Email");
  if (!email || !emailRegex.test(email)) {
    showError("error-email", "Valid email is required.");
    ok = false;
  }

  const phone = requireValue("phone", "error-phone", "Phone number");
  const phoneRegex = /^(?:\d[\s-]?){9}\d$/;

  if (!phone || !phoneRegex.test(phone)) {
    showError("error-phone", "Valid phone number is required.");
    ok = false;
  } else {
    showError("error-phone", "");
  }

  const dob = requireValue("dob", "error-dob", "Date of birth");
  if (!dob) ok = false;

  const location = requireValue("location", "error-location", "Location");
  if (!location) ok = false;

  // LinkedIn and GitHub are optional, but if entered, must be valid
  const linkedin = document.getElementById("linkedin").value.trim();
  if (linkedin && !urlRegex.test(linkedin)) {
    showError("error-linkedin", "LinkedIn URL is invalid.");
    ok = false;
  } else {
    showError("error-linkedin", "");
  }

  const github = document.getElementById("github").value.trim();
  if (github && !urlRegex.test(github)) {
    showError("error-github", "GitHub URL is invalid.");
    ok = false;
  } else {
    showError("error-github", "");
  }

  const objective = requireValue("objective", "error-objective", "Objective");
  if (!objective) ok = false;

  return ok;
}

function validateExperienceEntries() {
  // If section is hidden, skip validation
  if (!sectionStates.experienceContainer) {
    showError("error-experienceContainer", "");
    return true;
  }

  const container = document.getElementById("experienceContainer");
  const entries = Array.from(container.querySelectorAll(".entry.experience-entry"));
  
  // Experience is optional - if no entries, that's fine
  if (entries.length === 0) {
    showError("error-experienceContainer", "");
    return true;
  }
  
  showError("error-experienceContainer", "");

  let ok = true;
  entries.forEach((div) => {
    const jobRole = div.querySelector(".jobRole").value.trim();
    const company = div.querySelector(".company").value.trim();
    const startDate = div.querySelector(".startDate").value;
    const endDate = div.querySelector(".endDate").value;
    const errId = div.querySelector(".err");
    
    // If any field is filled, all fields must be filled
    const anyFilled = jobRole || company || startDate || endDate;
    
    if (!anyFilled) {
      errId.textContent = "";
      return; // Skip this entry if completely empty
    }
    
    let msg = "";
    if (!jobRole) msg = "Job role is required.";
    else if (!company) msg = "Company name is required.";
    else if (!startDate || !endDate) msg = "Join and last working dates are required.";
    else if (new Date(endDate) <= new Date(startDate)) msg = "Last working date must be after join date.";
    errId.textContent = msg;
    if (msg) ok = false;
  });
  return ok;
}

function validateEducationEntries() {
  // If section is hidden, skip validation
  if (!sectionStates.educationContainer) {
    showError("error-educationContainer", "");
    return true;
  }

  const container = document.getElementById("educationContainer");
  const entries = Array.from(container.querySelectorAll(".entry.education-entry"));

  // Education is optional
  if (entries.length === 0) {
    showError("error-educationContainer", "");
    return true;
  }
  
  showError("error-educationContainer", "");

  let ok = true;

  entries.forEach(div => {
    const college = div.querySelector(".college").value.trim();
    const university = div.querySelector(".university").value.trim();
    const course = div.querySelector(".course").value.trim();
    const year = div.querySelector(".year").value.trim();
    const cgpa = div.querySelector(".cgpa").value.trim();
    const errId = div.querySelector(".err");

    // If any field is filled, required fields must be filled
    const anyFilled = college || university || course || year || cgpa;
    
    if (!anyFilled) {
      errId.textContent = "";
      return; // Skip this entry if completely empty
    }

    let msg = "";
    if (!college) msg = "College is required.";
    else if (!university) msg = "University is required.";
    else if (!course) msg = "Course is required.";
    else if (!year || !/^\d{4}$/.test(year)) msg = "Year must be a 4-digit number.";
    else if (cgpa && isNaN(Number(cgpa))) msg = "CGPA must be a number.";

    errId.textContent = msg;
    if (msg) ok = false;
  });

  return ok;
}

function validateProjects() {
  // If section is hidden, skip validation
  if (!sectionStates.projectsContainer) {
    showError("error-projectsContainer", "");
    return true;
  }

  const container = document.getElementById("projectsContainer");
  const entries = Array.from(container.querySelectorAll(".entry.project-entry"));
  
  // Projects are optional
  if (entries.length === 0) {
    showError("error-projectsContainer", "");
    return true;
  }
  
  showError("error-projectsContainer", "");
  let ok = true;
  entries.forEach(div => {
    const title = div.querySelector(".projectTitle").value.trim();
    const desc = div.querySelector(".projectDesc").value.trim();
    const link = div.querySelector(".projectLink").value.trim();
    const company = div.querySelector(".projectCompany").value.trim();
    const errId = div.querySelector(".err");
    
    // If any field is filled, required fields must be filled
    const anyFilled = title || desc || link || company;
    
    if (!anyFilled) {
      errId.textContent = "";
      return; // Skip this entry if completely empty
    }
    
    let msg = "";
    if (!title) msg = "Project title is required.";
    else if (!desc) msg = "Project description is required.";
    else if (link && !urlRegex.test(link)) msg = "Project link is invalid.";
    else if (!company) msg = "Company name is required.";
    errId.textContent = msg;
    if (msg) ok = false;
  });
  return ok;
}

function validateSkills() {
  // If section is hidden, skip validation
  if (!sectionStates.skillsMainContainer) {
    showError("error-skillsPersonal", "");
    showError("error-skillsProfessional", "");
    showError("error-skillsTechnical", "");
    return true;
  }

  // Skills are optional - no validation needed
  showError("error-skillsPersonal", "");
  showError("error-skillsProfessional", "");
  showError("error-skillsTechnical", "");
  
  return true;
}

function validateHobbies() {
  // If section is hidden, skip validation
  if (!sectionStates.hobbiesContainer) {
    showError("error-hobbiesContainer", "");
    return true;
  }

  const container = document.getElementById("hobbiesContainer");
  const entries = Array.from(container.querySelectorAll(".entry.hobby-entry"));
  
  // Hobbies are completely optional - no validation needed
  // Clear all error messages
  showError("error-hobbiesContainer", "");
  entries.forEach(div => {
    const errId = div.querySelector(".err");
    if (errId) errId.textContent = "";
  });
  
  return true;
}

function validateCertifications() {
  // If section is hidden, skip validation
  if (!sectionStates.certificationsContainer) {
    showError("error-certificationsContainer", "");
    return true;
  }

  const container = document.getElementById("certificationsContainer");
  const entries = Array.from(container.querySelectorAll(".entry.cert-entry"));
  
  // Certifications are completely optional - no validation needed
  // Clear all error messages
  showError("error-certificationsContainer", "");
  entries.forEach(div => {
    const errId = div.querySelector(".err");
    if (errId) errId.textContent = "";
  });
  
  return true;
}

/* ========= Dynamic Add/Delete ========= */
function createDeleteButton(container) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "✖";
  btn.className = "btn btn-sm btn-outline-danger";
  btn.onclick = () => container.remove();
  btn.title = "Remove this entry";
  return btn;
}

function addExperience() {
  const wrap = document.createElement("div");
  wrap.className = "entry experience-entry";
  wrap.innerHTML = `
    <div class="row g-2 align-items-end">
      <div class="col-md-4">
        <label class="form-label">Company name</label>
        <input type="text" class="form-control company" placeholder="Company Pvt Ltd" title="enter the company name">
      </div>
      <div class="col-md-4">
        <label class="form-label">Job role</label>
        <input type="text" class="form-control jobRole" placeholder="Software Engineer" title="enter the job role">
      </div>
      <div class="col-md-2">
        <label class="form-label">Date of join</label>
        <input type="date" class="form-control startDate" title="enter the date of joining">
      </div>
      <div class="col-md-2">
        <label class="form-label">Last working date</label>
        <input type="date" class="form-control endDate" title="enter your last working date">
      </div>
      <div class="col-md-3">
        <label class="form-label">Experience</label>
        <input type="text" class="form-control expOut" placeholder="0 years 0 months" readonly title="your experience">
      </div>
      <div class="col-12">
        <div class="err error"></div>
      </div>
    </div>
  `;

  function calculateExperience() {
    const startVal = wrap.querySelector(".startDate").value;
    const endVal = wrap.querySelector(".endDate").value;
    const out = wrap.querySelector(".expOut");
    const err = wrap.querySelector(".err");

    err.textContent = "";
    out.value = "";

    if (!startVal || !endVal) return;

    const start = new Date(startVal);
    const end = new Date(endVal);

    if (end <= start) {
      err.textContent = "Last working date must be after join date.";
      return;
    }

    let months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());

    if (end.getDate() < start.getDate()) months--;

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    out.value = `${years} year${years !== 1 ? "s" : ""} ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`;
  }

  wrap.querySelector(".startDate").addEventListener("change", calculateExperience);
  wrap.querySelector(".endDate").addEventListener("change", calculateExperience);

  const actions = document.createElement("div");
  actions.className = "d-flex justify-content-end mt-2";
  actions.appendChild(createDeleteButton(wrap));
  wrap.appendChild(actions);

  document.getElementById("experienceContainer").appendChild(wrap);
}

function addEducation() {
  const wrap = document.createElement("div");
  wrap.className = "entry education-entry";
  wrap.innerHTML = `
    <div class="row g-2 align-items-end">
      <div class="col-md-3">
        <label class="form-label">College</label>
        <input type="text" class="form-control college" placeholder="ABC College" title="enter your college name">
      </div>
      <div class="col-md-3">
        <label class="form-label">University</label>
        <input type="text" class="form-control university" placeholder="XYZ University" title="enter your university name" >
      </div>
      <div class="col-md-2">
        <label class="form-label">Course</label>
        <input type="text" class="form-control course" placeholder="B.E / B.Sc / PU / SSLC" title="enter the course">
      </div>
      <div class="col-md-2">
        <label class="form-label">Year</label>
        <input type="text" class="form-control year" placeholder="2023" title="enter the year of completion">
      </div>
      <div class="col-md-2">
        <label class="form-label">CGPA/percentage</label>
        <input type="text" class="form-control cgpa" placeholder="8.5" title="enter your secured cgpa/percentage">
      </div>
      <div class="col-12">
        <div class="err error"></div>
      </div>
    </div>
  `;

  const actions = document.createElement("div");
  actions.className = "d-flex justify-content-end mt-2";
  actions.appendChild(createDeleteButton(wrap));
  wrap.appendChild(actions);

  document.getElementById("educationContainer").appendChild(wrap);
}

function addProject() {
  const wrap = document.createElement("div");
  wrap.className = "entry project-entry";
  wrap.innerHTML = `
  <div class="row g-2 project-entry-box">
    <div class="col-12">
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label">Project title</label>
          <input type="text" class="form-control projectTitle" placeholder="Portfolio Website" title="Please enter the project name">
        </div>
        <div class="col-md-4">
          <label class="form-label">Project link</label>
          <input type="url" class="form-control projectLink" placeholder="https://example.com" title="enter the link of the project">
        </div>
        <div class="col-md-4">
          <label class="form-label">Company name</label>
          <input type="text" class="form-control projectCompany" placeholder="Company / Academic" title="specify whether it is a company project or academic project">
        </div>
      </div>
    </div>
    <div class="col-12">
      <label class="form-label">Description</label>
      <textarea class="form-control projectDesc" rows="4" placeholder="Describe your project briefly..." title="give the description of the project"></textarea>
    </div>
    <div class="col-12">
      <div class="err error"></div>
    </div>
  </div>
`;
  
  const actions = document.createElement("div");
  actions.className = "d-flex justify-content-end mt-2";
  actions.appendChild(createDeleteButton(wrap));
  wrap.appendChild(actions);
  document.getElementById("projectsContainer").appendChild(wrap);
}

/* ========= IMPROVED SKILLS FUNCTIONS ========= */

function addSkill(containerId, value = "") {
  const container = document.getElementById(containerId);

  // Create skill item div
  const skillItem = document.createElement("div");
  skillItem.className = "skill-item";

  // Create input field
  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  input.placeholder = "Enter skill name...";
  input.className = "skill-input";

  // Create remove button
  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "btn-remove";
  removeBtn.innerHTML = "×";
  removeBtn.onclick = () => {
    skillItem.remove();
  };

  // Append input and button to skill item
  skillItem.appendChild(input);
  skillItem.appendChild(removeBtn);

  // Append skill item to container
  container.appendChild(skillItem);

  // Focus on the newly added input
  input.focus();
}

function getSkills(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  
  const inputs = container.querySelectorAll(".skill-input");
  
  return Array.from(inputs)
    .map(input => input.value.trim())
    .filter(value => value !== "");
}

/* ========= END OF IMPROVED SKILLS FUNCTIONS ========= */

function addHobby() {
  const wrap = document.createElement("div");
  wrap.className = "entry hobby-entry d-flex align-items-center gap-2";
  const input = document.createElement("input");
  input.type = "text";
  input.className = "form-control hobbyItem";
  input.placeholder = "e.g., Reading, Hiking";
  input.title = "enter your other hobbies and interest";
  const err = document.createElement("div");
  err.className = "err error ms-2";
  wrap.appendChild(input);
  wrap.appendChild(createDeleteButton(wrap));
  wrap.appendChild(err);
  document.getElementById("hobbiesContainer").appendChild(wrap);
}

function addCertification() {
  const wrap = document.createElement("div");
  wrap.className = "entry cert-entry d-flex align-items-center gap-2";
  const input = document.createElement("input");
  input.type = "text";
  input.className = "form-control certItem";
  input.placeholder = "e.g., AWS Certified Cloud Practitioner";
  input.title = "enter the name of the certification";
  const err = document.createElement("div");
  err.className = "err error ms-2";
  wrap.appendChild(input);
  wrap.appendChild(createDeleteButton(wrap));
  wrap.appendChild(err);
  document.getElementById("certificationsContainer").appendChild(wrap);
}

/* ========= Preview ========= */
function collectList(selector, mapper) {
  return Array.from(document.querySelectorAll(selector))
    .map(mapper).filter(x => x && (typeof x === 'string' ? x.trim().length > 0 : true));
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function handlePreview() {
  // First check if declaration checkbox is ticked
  const declarationChecked = document.getElementById("declarationCheck").checked;
  if (!declarationChecked) {
    showError("error-declaration", "You must agree to the declaration before previewing the resume.");
    document.getElementById("declarationCheck").focus();
    document.getElementById("declarationCheck").scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  
  // Clear declaration error if checkbox is checked
  showError("error-declaration", "");

  // Now validate all fields
  const ok =
    validatePersonal() &&
    validateExperienceEntries() &&
    validateEducationEntries() &&
    validateProjects() &&
    validateSkills() &&
    validateHobbies() &&
    validateCertifications();

  if (!ok) {
    alert("Please fix all validation errors before previewing.");
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  // Personal
  const name = escapeHtml(document.getElementById("name").value.trim());
  const email = escapeHtml(document.getElementById("email").value.trim());
  const phone = escapeHtml(document.getElementById("phone").value.trim());
  const dob = document.getElementById("dob").value;
  const location = escapeHtml(document.getElementById("location").value.trim());
  const linkedin = document.getElementById("linkedin").value.trim();
  const github = document.getElementById("github").value.trim();
  const objective = escapeHtml(document.getElementById("objective").value.trim());

  // Photo
  const photoInput = document.getElementById("photo");
  const includePhotoInPreview = document.getElementById("includePhotoInPDF").checked;
  let photoURL = "";
  if (photoInput.files && photoInput.files[0] && includePhotoInPreview) {
    photoURL = URL.createObjectURL(photoInput.files[0]);
  }

  // Build professional ATS-friendly preview HTML
  let previewHTML = `
    <div class="resume-document">
      <div class="resume-header">
        ${photoURL ? `<img src="${photoURL}" alt="Profile Photo" class="resume-photo" id="previewPhoto">` : ""}
        <div class="resume-header-content">
          <h1 class="resume-name">${name}</h1>
          <div class="resume-contact-info">
            <span class="contact-item">${email}</span>
            <span class="separator">|</span>
            <span class="contact-item">${phone}</span>
            <span class="separator">|</span>
            <span class="contact-item">${location}</span>
          </div>
          ${linkedin || github ? `
            <div class="resume-links">
              ${linkedin ? `<a href="${escapeHtml(linkedin)}" target="_blank" class="resume-link">${escapeHtml(linkedin)}</a>` : ""}
              ${linkedin && github ? `<span class="separator">|</span>` : ""}
              ${github ? `<a href="${escapeHtml(github)}" target="_blank" class="resume-link">${escapeHtml(github)}</a>` : ""}
            </div>
          ` : ""}
          <div class="resume-dob">Date of Birth: ${new Date(dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        </div>
      </div>
      
      <div class="resume-section">
        <h2 class="section-title">PROFESSIONAL SUMMARY</h2>
        <p class="objective-text">${objective}</p>
      </div>
  `;

  // Experience (only if section is visible and has entries)
  if (sectionStates.experienceContainer) {
    const experiences = collectList("#experienceContainer .experience-entry", (div) => {
      const role = div.querySelector(".jobRole").value.trim();
      const company = div.querySelector(".company").value.trim();
      const start = div.querySelector(".startDate").value;
      const end = div.querySelector(".endDate").value;
      const expOut = div.querySelector(".expOut").value.trim();
      
      if (!role && !company && !start && !end) return null;
      
      return `
        <div class="experience-item">
          <div class="experience-header">
            <div class="experience-left">
              <h3 class="job-title">${escapeHtml(role)}</h3>
              <div class="company-name">${escapeHtml(company)}</div>
            </div>
            <div class="experience-right">
              <div class="date-range">${formatDate(start)} - ${formatDate(end)}</div>
              <div class="duration">${escapeHtml(expOut)}</div>
            </div>
          </div>
        </div>
      `;
    });
    
    if (experiences.length > 0) {
      previewHTML += `
        <div class="resume-section">
          <h2 class="section-title">WORK EXPERIENCE</h2>
          ${experiences.join("")}
        </div>
      `;
    }
  }

  // Education (only if section is visible and has entries)
  if (sectionStates.educationContainer) {
    const educations = collectList("#educationContainer .education-entry", (div) => {
      const college = div.querySelector(".college").value.trim();
      const university = div.querySelector(".university").value.trim();
      const course = div.querySelector(".course").value.trim();
      const year = div.querySelector(".year").value.trim();
      const cgpa = div.querySelector(".cgpa").value.trim();
      
      if (!college && !university && !course && !year) return null;
      
      return `
        <div class="education-item">
          <div class="education-header">
            <div class="education-left">
              <h3 class="degree-title">${escapeHtml(course)}</h3>
              <div class="institution-name">${escapeHtml(college)}, ${escapeHtml(university)}</div>
            </div>
            <div class="education-right">
              <div class="edu-year">${escapeHtml(year)}</div>
              ${cgpa ? `<div class="cgpa-info">CGPA: ${escapeHtml(cgpa)}</div>` : ""}
            </div>
          </div>
        </div>
      `;
    });
    
    if (educations.length > 0) {
      previewHTML += `
        <div class="resume-section">
          <h2 class="section-title">EDUCATION</h2>
          ${educations.join("")}
        </div>
      `;
    }
  }

  // Projects (only if section is visible and has entries)
  if (sectionStates.projectsContainer) {
    const projects = collectList("#projectsContainer .project-entry", (div) => {
      const title = div.querySelector(".projectTitle").value.trim();
      const desc = div.querySelector(".projectDesc").value.trim();
      const link = div.querySelector(".projectLink").value.trim();
      const company = div.querySelector(".projectCompany").value.trim();
      
      if (!title && !desc && !company) return null;
      
      return `
        <div class="project-item">
          <div class="project-header">
            <h3 class="project-title">${escapeHtml(title)}</h3>
            <div class="project-company">${escapeHtml(company)}</div>
          </div>
          ${link ? `<div class="project-link"><a href="${escapeHtml(link)}" target="_blank">${escapeHtml(link)}</a></div>` : ""}
          <p class="project-description">${escapeHtml(desc)}</p>
        </div>
      `;
    });
    
    if (projects.length > 0) {
      previewHTML += `
        <div class="resume-section">
          <h2 class="section-title">PROJECTS</h2>
          ${projects.join("")}
        </div>
      `;
    }
  }

  // Skills (only if section is visible and has skills)
  if (sectionStates.skillsMainContainer) {
    const skillsPersonal = getSkills("personalSkills");
    const skillsProfessional = getSkills("professionalSkills");
    const skillsTechnical = getSkills("technicalSkills");
    
    if (skillsPersonal.length > 0 || skillsProfessional.length > 0 || skillsTechnical.length > 0) {
      previewHTML += `
        <div class="resume-section">
          <h2 class="section-title">SKILLS</h2>
          <div class="skills-columns-container">
      `;
      
      if (skillsPersonal.length > 0) {
        previewHTML += `
          <div class="skill-column">
            <h3 class="skill-column-title">Personal Skills</h3>
            <ul class="skill-column-list">
              ${skillsPersonal.map(skill => `<li>${escapeHtml(skill)}</li>`).join("")}
            </ul>
          </div>
        `;
      }
      
      if (skillsProfessional.length > 0) {
        previewHTML += `
          <div class="skill-column">
            <h3 class="skill-column-title">Professional Skills</h3>
            <ul class="skill-column-list">
              ${skillsProfessional.map(skill => `<li>${escapeHtml(skill)}</li>`).join("")}
            </ul>
          </div>
        `;
      }
      
      if (skillsTechnical.length > 0) {
        previewHTML += `
          <div class="skill-column">
            <h3 class="skill-column-title">Technical Skills</h3>
            <ul class="skill-column-list">
              ${skillsTechnical.map(skill => `<li>${escapeHtml(skill)}</li>`).join("")}
            </ul>
          </div>
        `;
      }
      
      previewHTML += `
          </div>
        </div>
      `;
    }
  }

  // Hobbies (only if section is visible and has entries)
  if (sectionStates.hobbiesContainer) {
    const hobbies = collectList("#hobbiesContainer .hobby-entry", (div) => {
      const hobbyInput = div.querySelector(".hobbyItem");
      return hobbyInput ? hobbyInput.value.trim() : null;
    });
    
    if (hobbies.length > 0) {
      previewHTML += `
        <div class="resume-section">
          <h2 class="section-title">INTERESTS & HOBBIES</h2>
          <ul class="hobbies-list">
            ${hobbies.map(h => `<li>${escapeHtml(h)}</li>`).join("")}
          </ul>
        </div>
      `;
    }
  }

  // Certifications (only if section is visible and has entries)
  if (sectionStates.certificationsContainer) {
    const certs = collectList("#certificationsContainer .cert-entry", (div) => {
      const certInput = div.querySelector(".certItem");
      return certInput ? certInput.value.trim() : null;
    });
    
    if (certs.length > 0) {
      previewHTML += `
        <div class="resume-section">
          <h2 class="section-title">CERTIFICATIONS</h2>
          <ul class="certification-list">
            ${certs.map(c => `<li>${escapeHtml(c)}</li>`).join("")}
          </ul>
        </div>
      `;
    }
  }

  // Declaration with name appended
  const declarationBase = escapeHtml(document.getElementById("declaration").value.trim());

  previewHTML += `
    <div class="resume-section declaration-section">
      <h2 class="section-title">DECLARATION</h2>
      <p class="declaration-text">${declarationBase}</p>
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-name">${name}</div>
      </div>
    </div>
    </div>
  `;

  const preview = document.getElementById("resumePreview");
  preview.innerHTML = previewHTML;

  // Scroll to preview
  preview.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ========= PDF ========= */
async function downloadPDF() {
  try {
    const preview = document.getElementById("resumePreview");

    if (!preview || !preview.innerHTML.trim() || preview.innerHTML.includes("Fill the form")) {
      alert("Please preview the resume first before downloading.");
      return;
    }

    // Check if jsPDF is loaded
    if (typeof window.jspdf === 'undefined') {
      alert("PDF library not loaded. Please check if js/jspdf.umd.min.js file exists.");
      return;
    }

    // Check if html2canvas is loaded
    if (typeof html2canvas === 'undefined') {
      alert("HTML2Canvas library not loaded. Please check if js/html2canvas.min.js file exists.");
      return;
    }

    // Check if user wants to include photo in PDF
    const includePhoto = document.getElementById("includePhotoInPDF").checked;
    const photoElement = document.getElementById("previewPhoto");
    
    // Temporarily hide photo if user doesn't want it in PDF
    let photoDisplayStyle = "";
    if (!includePhoto && photoElement) {
      photoDisplayStyle = photoElement.style.display;
      photoElement.style.display = "none";
    }

    const { jsPDF } = window.jspdf;

    const canvas = await html2canvas(preview, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false
    });

    // Restore photo visibility
    if (!includePhoto && photoElement) {
      photoElement.style.display = photoDisplayStyle;
    }

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save("resume.pdf");
  } catch (error) {
    console.error("PDF Generation Error:", error);
    alert("Error generating PDF: " + error.message + "\n\nPlease ensure all library files are loaded correctly.");
  }
}

// Auto-resize textareas
document.addEventListener("input", function (e) {
  if (e.target.classList.contains("projectDesc")) {
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  }
});
// ==================== DATABASE API INTEGRATION ====================
const API_URL = 'http://localhost:5000/api';

// Function to save resume to MSSQL database
async function saveResumeToDatabase() {
    try {
        console.log('💾 Saving resume to MSSQL database...');
        
        // Collect all form data
        const resumeData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            dob: document.getElementById('dob').value,
            location: document.getElementById('location').value.trim(),
            linkedin: document.getElementById('linkedin').value.trim(),
            github: document.getElementById('github').value.trim(),
            objective: document.getElementById('objective').value.trim(),
            declaration: document.getElementById('declaration').value.trim(),
            
            // Collect experience
            experience: collectList("#experienceContainer .experience-entry", (div) => {
                const company = div.querySelector(".company").value.trim();
                const jobRole = div.querySelector(".jobRole").value.trim();
                const startDate = div.querySelector(".startDate").value;
                const endDate = div.querySelector(".endDate").value;
                
                if (!company && !jobRole) return null;
                return { company, jobRole, startDate, endDate };
            }),
            
            // Collect education
            education: collectList("#educationContainer .education-entry", (div) => {
                const college = div.querySelector(".college").value.trim();
                const university = div.querySelector(".university").value.trim();
                const course = div.querySelector(".course").value.trim();
                const year = div.querySelector(".year").value.trim();
                const cgpa = div.querySelector(".cgpa").value.trim();
                
                if (!college && !university) return null;
                return { college, university, course, year, cgpa };
            }),
            
            // Collect projects
            projects: collectList("#projectsContainer .project-entry", (div) => {
                const title = div.querySelector(".projectTitle").value.trim();
                const description = div.querySelector(".projectDesc").value.trim();
                const link = div.querySelector(".projectLink").value.trim();
                const company = div.querySelector(".projectCompany").value.trim();
                
                if (!title) return null;
                return { title, description, link, company };
            }),
            
            // Collect skills
            personalSkills: getSkills("personalSkills"),
            professionalSkills: getSkills("professionalSkills"),
            technicalSkills: getSkills("technicalSkills"),
            
            // Collect hobbies
            hobbies: collectList("#hobbiesContainer .hobby-entry", (div) => {
                const value = div.querySelector(".hobbyItem").value.trim();
                return value || null;
            }),
            
            // Collect certifications
            certifications: collectList("#certificationsContainer .cert-entry", (div) => {
                const value = div.querySelector(".certItem").value.trim();
                return value || null;
            })
        };
        
        console.log('📤 Sending data to MSSQL backend...');
        
        // Send to backend
        const response = await fetch(`${API_URL}/save-resume`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(resumeData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`✅ SUCCESS!\n\nYour resume has been saved to MSSQL database!\n\nResume ID: ${result.resume_id}\n\nYou can now download it as PDF.`);
            console.log('✅ Resume saved with ID:', result.resume_id);
            return result.resume_id;
        } else {
            alert(`❌ Error saving resume:\n\n${result.error}\n\nCheck the backend console for details.`);
            console.error('Error:', result.error);
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Failed to connect to database!\n\nMake sure:\n1. Backend server is running (python backend.py)\n2. SQL Server is running\n3. Check backend terminal for errors');
        return null;
    }
}

// Modify the existing handlePreview function
const originalHandlePreview = handlePreview;
handlePreview = async function() {
    // First do the original preview
    originalHandlePreview();
    
    // Check if preview was successful
    const preview = document.getElementById("resumePreview");
    if (preview && !preview.innerHTML.includes("Fill the form")) {
        // Save to database
        await saveResumeToDatabase();
    }
};
function initializeUserAvatar() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = user.firstName || user.username || 'User';
    const userEmail = user.email || 'user@example.com';
    
    document.getElementById('userAvatar').textContent = userName.substring(0, 1).toUpperCase();
    document.getElementById('dropdownUserName').textContent = userName;
    document.getElementById('dropdownUserEmail').textContent = userEmail;
}

// Navigation functions
function goToDashboard() {
    window.location.href = 'dashboard.html';
}

function goToCreateResume() {
    window.location.href = 'index.html';
}

function goToAdmin() {
    window.location.href = 'admin.html';
}

// Toggle dropdown menu
document.addEventListener('DOMContentLoaded', function() {
    initializeUserAvatar();
    
    const avatar = document.getElementById('userAvatar');
    const dropdown = document.getElementById('dropdownMenu');
    
    avatar.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target) && !avatar.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
});