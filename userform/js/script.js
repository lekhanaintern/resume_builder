// ============================================
// Global State
// ============================================
let citiesData = [];
let statesData = [];
let pincodesData = [];
let languagesData = [];

let selectedPreferredCities = [];
let selectedPreferredPincodes = [];
let selectedLanguages = [];

// ============================================
// Initialize on Page Load
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Page loaded successfully');
    
    // Load JSON data
    loadJSONData();
    
    // Initialize custom selects
    initializeCustomSelects();
    
    // Initialize multi-selects
    initializeMultiSelect('preferredCities', 'preferredCitiesTags', 'preferredCitiesOptions');
    initializeMultiSelect('preferredPincodes', 'preferredPincodesTags', 'preferredPincodesOptions');
    initializeMultiSelect('languagesKnown', 'languagesKnownTags', 'languagesKnownOptions');
    
    // Set max date for date of birth (18 years ago)
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    document.getElementById('dateOfBirth').max = maxDate.toISOString().split('T')[0];
    
    // Set default onboarding date to today
    document.getElementById('onboardingDate').valueAsDate = new Date();
    
    // Form submission
    const form = document.getElementById('registrationForm');
    form.addEventListener('submit', handleSubmit);
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', handleOutsideClick);
});

// ============================================
// Load JSON Data
// ============================================
async function loadJSONData() {
    console.log('🔄 Starting to load JSON files...');
    
    try {
        // Load Cities
        console.log('📂 Loading cities.json...');
        const citiesResponse = await fetch('data/cities.json');
        if (!citiesResponse.ok) throw new Error('cities.json not found');
        citiesData = await citiesResponse.json();
        console.log('✅ cities.json loaded:', citiesData.length, 'cities');
        populateCustomSelect('city', citiesData, 'capital');
        
        // Load States
        console.log('📂 Loading states.json...');
        const statesResponse = await fetch('data/states.json');
        if (!statesResponse.ok) throw new Error('states.json not found');
        statesData = await statesResponse.json();
        console.log('✅ states.json loaded:', statesData.length, 'states');
        populateCustomSelect('state', statesData, 'name');
        
        // Load PIN codes
        console.log('📂 Loading pincodes.json...');
        const pincodesResponse = await fetch('data/pincodes.json');
        if (!pincodesResponse.ok) throw new Error('pincodes.json not found');
        pincodesData = await pincodesResponse.json();
        console.log('✅ pincodes.json loaded:', pincodesData.length, 'pincodes');
        
        // Load Languages
        console.log('📂 Loading languages.json...');
        const languagesResponse = await fetch('data/languages.json');
        if (!languagesResponse.ok) throw new Error('languages.json not found');
        languagesData = await languagesResponse.json();
        console.log('✅ languages.json loaded:', languagesData.length, 'languages');
        
        console.log('🎉 All JSON files loaded successfully!');
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        alert('Error loading form data. Please ensure you are running this through a web server and all JSON files are in the data folder.');
    }
}

// ============================================
// Custom Select Functionality
// ============================================
function initializeCustomSelects() {
    const customSelects = document.querySelectorAll('.custom-select');
    
    customSelects.forEach(select => {
        const trigger = select.querySelector('.select-trigger');
        const searchInput = select.querySelector('.search-input');
        const hiddenInput = select.nextElementSibling;
        const valueDisplay = select.querySelector('.select-value');
        
        // Toggle dropdown
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllSelects();
            select.classList.toggle('active');
            
            if (select.classList.contains('active') && searchInput) {
                setTimeout(() => searchInput.focus(), 100);
            }
        });
        
        // Search functionality
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const options = select.querySelectorAll('.select-option');
                
                options.forEach(option => {
                    const text = option.textContent.toLowerCase();
                    if (text.includes(searchTerm)) {
                        option.classList.remove('hidden');
                    } else {
                        option.classList.add('hidden');
                    }
                });
            });
            
            searchInput.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        // Initialize static options (for Status and Type dropdowns)
        const staticOptions = select.querySelectorAll('.select-option');
        staticOptions.forEach(option => {
            option.addEventListener('click', () => {
                selectOption(select, option, hiddenInput, valueDisplay);
            });
        });
    });
}

function populateCustomSelect(selectId, data, valueKey) {
    const customSelect = document.querySelector(`[data-select="${selectId}"]`);
    if (!customSelect) return;
    
    const optionsContainer = customSelect.querySelector('.select-options');
    const valueDisplay = customSelect.querySelector('.select-value');
    const hiddenInput = document.getElementById(selectId);
    
    // Populate options
    data.forEach(item => {
        const option = document.createElement('div');
        option.className = 'select-option';
        option.textContent = item[valueKey];
        option.dataset.value = item[valueKey];
        
        option.addEventListener('click', () => {
            selectOption(customSelect, option, hiddenInput, valueDisplay);
        });
        
        optionsContainer.appendChild(option);
    });
}

function selectOption(customSelect, option, hiddenInput, valueDisplay) {
    // Update hidden input
    hiddenInput.value = option.dataset.value;
    
    // Update display
    valueDisplay.textContent = option.textContent;
    valueDisplay.classList.remove('placeholder');
    
    // Update selected state
    const allOptions = customSelect.querySelectorAll('.select-option');
    allOptions.forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
    
    // Close dropdown
    customSelect.classList.remove('active');
    
    // Clear error if present
    const formGroup = customSelect.closest('.form-group');
    if (formGroup) {
        formGroup.classList.remove('error');
    }
}

function closeAllSelects() {
    document.querySelectorAll('.custom-select').forEach(select => {
        select.classList.remove('active');
    });
    document.querySelectorAll('.multi-select').forEach(select => {
        select.classList.remove('active');
    });
}

// ============================================
// Multi-Select Functionality
// ============================================
function initializeMultiSelect(fieldName, tagsId, optionsId) {
    const multiSelect = document.querySelector(`[data-field="${fieldName}"]`);
    if (!multiSelect) return;
    
    const input = multiSelect.querySelector('.multi-input');
    const tagsContainer = document.getElementById(tagsId);
    const optionsContainer = document.getElementById(optionsId);
    
    // Show dropdown on input focus
    input.addEventListener('focus', () => {
        multiSelect.classList.add('active');
        updateMultiSelectOptions(fieldName, optionsContainer, input.value);
    });
    
    // Search functionality
    input.addEventListener('input', (e) => {
        updateMultiSelectOptions(fieldName, optionsContainer, e.target.value);
    });
    
    // Prevent closing when clicking inside
    multiSelect.querySelector('.multi-select-input').addEventListener('click', (e) => {
        e.stopPropagation();
        input.focus();
    });
    
    multiSelect.querySelector('.multi-select-dropdown').addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

function updateMultiSelectOptions(fieldName, optionsContainer, searchTerm) {
    let data = [];
    let valueKey = '';
    let selectedArray = [];
    
    // Determine which dataset to use
    if (fieldName === 'preferredCities') {
        data = citiesData;
        valueKey = 'capital';
        selectedArray = selectedPreferredCities;
    } else if (fieldName === 'preferredPincodes') {
        data = pincodesData;
        valueKey = 'pincode';
        selectedArray = selectedPreferredPincodes;
    } else if (fieldName === 'languagesKnown') {
        data = languagesData;
        valueKey = 'name';
        selectedArray = selectedLanguages;
    }
    
    // Filter data based on search
    const filteredData = data.filter(item => 
        item[valueKey].toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Clear and populate options
    optionsContainer.innerHTML = '';
    
    if (filteredData.length === 0) {
        optionsContainer.innerHTML = '<div class="multi-option" style="cursor: default; color: var(--gray-400);">No results found</div>';
        return;
    }
    
    filteredData.slice(0, 100).forEach(item => {
        const option = document.createElement('div');
        option.className = 'multi-option';
        option.textContent = item[valueKey];
        option.dataset.value = item[valueKey];
        
        // Check if already selected
        if (selectedArray.includes(item[valueKey])) {
            option.classList.add('selected');
        }
        
        // Add click handler
        option.addEventListener('click', () => {
            toggleMultiSelectOption(fieldName, item[valueKey]);
        });
        
        optionsContainer.appendChild(option);
    });
}

function toggleMultiSelectOption(fieldName, value) {
    let selectedArray = [];
    let tagsId = '';
    
    if (fieldName === 'preferredCities') {
        selectedArray = selectedPreferredCities;
        tagsId = 'preferredCitiesTags';
    } else if (fieldName === 'preferredPincodes') {
        selectedArray = selectedPreferredPincodes;
        tagsId = 'preferredPincodesTags';
    } else if (fieldName === 'languagesKnown') {
        selectedArray = selectedLanguages;
        tagsId = 'languagesKnownTags';
    }
    
    const index = selectedArray.indexOf(value);
    
    if (index > -1) {
        // Remove from selection
        selectedArray.splice(index, 1);
    } else {
        // Add to selection
        selectedArray.push(value);
    }
    
    // Update global arrays
    if (fieldName === 'preferredCities') selectedPreferredCities = selectedArray;
    else if (fieldName === 'preferredPincodes') selectedPreferredPincodes = selectedArray;
    else if (fieldName === 'languagesKnown') selectedLanguages = selectedArray;
    
    // Update UI
    renderSelectedTags(tagsId, selectedArray, fieldName);
    
    // Update option state
    const multiSelect = document.querySelector(`[data-field="${fieldName}"]`);
    const optionsContainer = multiSelect.querySelector('.multi-options');
    updateMultiSelectOptions(fieldName, optionsContainer, '');
}

function renderSelectedTags(tagsId, selectedArray, fieldName) {
    const container = document.getElementById(tagsId);
    container.innerHTML = '';
    
    selectedArray.forEach(value => {
        const tag = document.createElement('div');
        tag.className = 'tag';
        
        const textSpan = document.createElement('span');
        textSpan.textContent = value;
        
        const removeBtn = document.createElement('span');
        removeBtn.className = 'tag-remove';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMultiSelectOption(fieldName, value);
        });
        
        tag.appendChild(textSpan);
        tag.appendChild(removeBtn);
        container.appendChild(tag);
    });
}

// ============================================
// Outside Click Handler
// ============================================
function handleOutsideClick(e) {
    if (!e.target.closest('.custom-select') && !e.target.closest('.multi-select')) {
        closeAllSelects();
    }
}

// ============================================
// Form Validation
// ============================================
function validateForm(form) {
    let isValid = true;
    const formGroups = form.querySelectorAll('.form-group');
    
    formGroups.forEach(group => {
        const input = group.querySelector('input[required], select[required], input[type="hidden"][required]');
        
        if (input) {
            // Check if it's a hidden input (for custom selects)
            if (input.type === 'hidden') {
                if (!input.value) {
                    group.classList.add('error');
                    isValid = false;
                } else {
                    group.classList.remove('error');
                }
            }
            // Regular input validation
            else if (!input.value || (input.type === 'tel' && !input.checkValidity()) || 
                     (input.type === 'text' && input.pattern && !input.checkValidity())) {
                group.classList.add('error');
                isValid = false;
            } else {
                group.classList.remove('error');
            }
        }
        
        // Radio button validation
        const radioInputs = group.querySelectorAll('input[type="radio"][required]');
        if (radioInputs.length > 0) {
            const checked = Array.from(radioInputs).some(radio => radio.checked);
            if (!checked) {
                group.classList.add('error');
                isValid = false;
            } else {
                group.classList.remove('error');
            }
        }
    });
    
    return isValid;
}

// ============================================
// Form Submission
// ============================================
function handleSubmit(e) {
    e.preventDefault();
    console.log('📝 Form submitted');
    
    const form = e.target;
    
    // Validate form
    if (!validateForm(form)) {
        console.warn('⚠️ Form validation failed');
        
        // Scroll to first error
        const firstError = form.querySelector('.form-group.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }
    
    // Collect form data
    const formData = {
        fullName: document.getElementById('fullName').value,
        contactNumber: document.getElementById('contactNumber').value,
        addressLine1: document.getElementById('addressLine1').value,
        addressLine2: document.getElementById('addressLine2').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        postalCode: document.getElementById('postalCode').value,
        dateOfBirth: document.getElementById('dateOfBirth').value,
        gender: document.querySelector('input[name="gender"]:checked').value,
        preferredCities: selectedPreferredCities,
        preferredPincodes: selectedPreferredPincodes,
        languagesKnown: selectedLanguages,
        status: document.getElementById('status').value,
        onboardingDate: document.getElementById('onboardingDate').value,
        userType: document.getElementById('userType').value
    };
    
    console.log('📋 Form Data:', formData);
    
    // Show success modal
    showModal();
    
    console.log('✅ Registration completed successfully!');
    
    // Reset form after modal is shown
    setTimeout(() => {
        resetForm(form);
    }, 1000);
}

// ============================================
// Modal Functions
// ============================================
function showModal() {
    const modal = document.getElementById('successModal');
    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('successModal');
    modal.classList.remove('show');
}

// ============================================
// Reset Form
// ============================================
function resetForm(form) {
    form.reset();
    
    // Clear custom select displays
    document.querySelectorAll('.select-value').forEach(value => {
        if (!value.textContent.startsWith('Select')) {
            value.textContent = value.textContent.includes('City') ? 'Select Capital City' : 
                               value.textContent.includes('State') ? 'Select State' :
                               value.textContent.includes('Status') ? 'Select Status' :
                               'Select Type';
            value.classList.add('placeholder');
        }
    });
    
    // Clear hidden inputs
    document.querySelectorAll('input[type="hidden"]').forEach(input => {
        if (input.id !== 'onboardingDate' && input.id !== 'dateOfBirth') {
            input.value = '';
        }
    });
    
    // Clear multi-select arrays
    selectedPreferredCities = [];
    selectedPreferredPincodes = [];
    selectedLanguages = [];
    
    // Clear tag displays
    document.getElementById('preferredCitiesTags').innerHTML = '';
    document.getElementById('preferredPincodesTags').innerHTML = '';
    document.getElementById('languagesKnownTags').innerHTML = '';
    
    // Clear multi-select inputs
    document.querySelectorAll('.multi-input').forEach(input => {
        input.value = '';
    });
    
    // Remove error states
    document.querySelectorAll('.form-group.error').forEach(group => {
        group.classList.remove('error');
    });
    
    // Reset onboarding date to today
    document.getElementById('onboardingDate').valueAsDate = new Date();
    
    console.log('🔄 Form reset');
}