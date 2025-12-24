// ========================================
// Form Validation & Interaction Handler
// ========================================

(function() {
    'use strict';

    // Get form and elements
    const form = document.getElementById('userRegistrationForm');
    const tooltipContainer = document.getElementById('tooltipContainer');
    
    // ========================================
    // Validation Rules
    // ========================================
    
    const validationRules = {
        fullName: {
            required: true,
            pattern: /^[a-zA-Z\s]{2,50}$/,
            message: 'Please enter a valid name (2-50 characters, letters only)'
        },
        addressLine1: {
            required: true,
            minLength: 5,
            message: 'Address must be at least 5 characters long'
        },
        cityCapital: {
            required: true,
            message: 'Please select a capital city'
        },
        state: {
            required: true,
            message: 'Please select a state'
        },
        postalCode: {
            required: true,
            pattern: /^[0-9]{6}$/,
            message: 'Please enter a valid 6-digit PIN code'
        },
        dateOfBirth: {
            required: true,
            validate: validateAge,
            message: 'You must be at least 18 years old'
        },
        gender: {
            required: true,
            message: 'Please select a gender'
        },
        cityMulti: {
            required: true,
            message: 'Please select at least one preferred city'
        },
        languages: {
            required: true,
            message: 'Please select at least one language'
        },
        status: {
            required: true,
            message: 'Please select a status'
        },
        onboardingDate: {
            required: true,
            message: 'Please select an onboarding date'
        },
        type: {
            required: true,
            message: 'Please select a user type'
        }
    };

    // ========================================
    // Validation Functions
    // ========================================

    function validateAge(value) {
        if (!value) return false;
        const today = new Date();
        const birthDate = new Date(value);
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            return age - 1 >= 18;
        }
        return age >= 18;
    }

    function validateField(field) {
        const fieldName = field.name || field.id;
        const rule = validationRules[fieldName];
        
        if (!rule) return true;

        const formGroup = field.closest('.form-group');
        const errorMessage = formGroup.querySelector('.error-message');
        
        let isValid = true;
        let message = '';

        // Check if it's a radio button group
        if (field.type === 'radio') {
            const radioGroup = document.querySelectorAll(`input[name="${fieldName}"]`);
            const isChecked = Array.from(radioGroup).some(radio => radio.checked);
            
            if (rule.required && !isChecked) {
                isValid = false;
                message = rule.message;
            }
        }
        // Check if it's a multi-select
        else if (field.multiple) {
            const selectedOptions = Array.from(field.selectedOptions);
            
            if (rule.required && selectedOptions.length === 0) {
                isValid = false;
                message = rule.message;
            }
        }
        // Regular field validation
        else {
            const value = field.value.trim();

            if (rule.required && !value) {
                isValid = false;
                message = rule.message;
            } else if (rule.pattern && value && !rule.pattern.test(value)) {
                isValid = false;
                message = rule.message;
            } else if (rule.minLength && value.length < rule.minLength) {
                isValid = false;
                message = rule.message;
            } else if (rule.validate && !rule.validate(value)) {
                isValid = false;
                message = rule.message;
            }
        }

        // Update UI
        if (!isValid) {
            formGroup.classList.add('error');
            formGroup.classList.remove('success');
            if (errorMessage) {
                errorMessage.textContent = message;
            }
        } else {
            formGroup.classList.remove('error');
            formGroup.classList.add('success');
            if (errorMessage) {
                errorMessage.textContent = '';
            }
        }

        return isValid;
    }

    // ========================================
    // Tooltip Functionality
    // ========================================

    function showTooltip(e) {
        const tooltipIcon = e.target;
        const tooltipText = tooltipIcon.getAttribute('data-tooltip');
        
        if (!tooltipText) return;

        tooltipContainer.textContent = tooltipText;
        tooltipContainer.classList.add('show');

        const iconRect = tooltipIcon.getBoundingClientRect();
        const tooltipRect = tooltipContainer.getBoundingClientRect();

        let left = iconRect.left + (iconRect.width / 2) - (tooltipRect.width / 2);
        let top = iconRect.top - tooltipRect.height - 10;

        // Keep tooltip within viewport
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        if (top < 10) {
            top = iconRect.bottom + 10;
        }

        tooltipContainer.style.left = left + 'px';
        tooltipContainer.style.top = top + 'px';
    }

    function hideTooltip() {
        tooltipContainer.classList.remove('show');
    }

    // ========================================
    // Real-time Validation
    // ========================================

    function setupRealtimeValidation() {
        // Text inputs
        const textInputs = form.querySelectorAll('input[type="text"], input[type="date"]');
        textInputs.forEach(input => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => {
                if (input.closest('.form-group').classList.contains('error')) {
                    validateField(input);
                }
            });
        });

        // Selects
        const selects = form.querySelectorAll('select');
        selects.forEach(select => {
            select.addEventListener('change', () => validateField(select));
        });

        // Radio buttons
        const radioGroups = {};
        const radios = form.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => {
            if (!radioGroups[radio.name]) {
                radioGroups[radio.name] = [];
            }
            radioGroups[radio.name].push(radio);
            
            radio.addEventListener('change', () => {
                validateField(radio);
            });
        });
    }

    // ========================================
    // Postal Code Formatting
    // ========================================

    function setupPostalCodeFormatting() {
        const postalCode = document.getElementById('postalCode');
        
        postalCode.addEventListener('input', (e) => {
            // Remove non-numeric characters
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }

    // ========================================
    // Form Submission
    // ========================================

    function handleSubmit(e) {
        e.preventDefault();
        
        let isFormValid = true;
        const formData = {};

        // Validate all fields
        Object.keys(validationRules).forEach(fieldName => {
            const field = form.elements[fieldName];
            
            if (field) {
                if (!validateField(field)) {
                    isFormValid = false;
                }
            }
        });

        if (!isFormValid) {
            // Scroll to first error
            const firstError = form.querySelector('.form-group.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const input = firstError.querySelector('.form-control, input[type="radio"]');
                if (input) {
                    setTimeout(() => input.focus(), 500);
                }
            }
            return;
        }

        // Collect form data
        const formElements = new FormData(form);
        
        // Handle multi-select fields
        const cityMulti = Array.from(form.elements.cityMulti.selectedOptions).map(opt => opt.value);
        const pincodeMulti = Array.from(form.elements.pincodeMulti.selectedOptions).map(opt => opt.value);
        const languages = Array.from(form.elements.languages.selectedOptions).map(opt => opt.value);

        // Build data object
        for (let [key, value] of formElements.entries()) {
            formData[key] = value;
        }

        formData.cityMulti = cityMulti;
        formData.pincodeMulti = pincodeMulti;
        formData.languages = languages;

        // Show loading state
        const submitBtn = form.querySelector('.btn-primary');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        // Simulate API call
        setTimeout(() => {
            console.log('Form Data:', formData);
            
            // Show success message
            alert('Registration submitted successfully!\n\nCheck the console for form data.');
            
            // Reset form
            form.reset();
            
            // Remove all validation classes
            const formGroups = form.querySelectorAll('.form-group');
            formGroups.forEach(group => {
                group.classList.remove('error', 'success');
            });

            // Remove loading state
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1500);
    }

    // ========================================
    // Date Restrictions
    // ========================================

    function setupDateRestrictions() {
        const today = new Date();
        const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        const dateOfBirth = document.getElementById('dateOfBirth');
        
        // Set max date for DOB (18 years ago)
        dateOfBirth.max = maxDate.toISOString().split('T')[0];

        // Set onboarding date restrictions
        const onboardingDate = document.getElementById('onboardingDate');
        const minOnboardingDate = new Date(2000, 0, 1);
        
        onboardingDate.min = minOnboardingDate.toISOString().split('T')[0];
        onboardingDate.max = today.toISOString().split('T')[0];
    }

    // ========================================
    // Keyboard Navigation Enhancement
    // ========================================

    function setupKeyboardNavigation() {
        form.addEventListener('keydown', (e) => {
            // Submit on Ctrl/Cmd + Enter
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                form.dispatchEvent(new Event('submit'));
            }
        });
    }

    // ========================================
    // Multi-select Helper
    // ========================================

    function setupMultiSelectHelper() {
        const multiSelects = form.querySelectorAll('select[multiple]');
        
        multiSelects.forEach(select => {
            select.addEventListener('focus', function() {
                this.style.outline = '2px solid var(--primary-color)';
            });
            
            select.addEventListener('blur', function() {
                this.style.outline = '';
            });
        });
    }

    // ========================================
    // Initialize
    // ========================================

    function init() {
        // Setup all functionality
        setupRealtimeValidation();
        setupPostalCodeFormatting();
        setupDateRestrictions();
        setupKeyboardNavigation();
        setupMultiSelectHelper();

        // Event listeners
        form.addEventListener('submit', handleSubmit);

        // Tooltip event listeners
        const tooltipIcons = document.querySelectorAll('.tooltip-icon');
        tooltipIcons.forEach(icon => {
            icon.addEventListener('mouseenter', showTooltip);
            icon.addEventListener('mouseleave', hideTooltip);
            icon.addEventListener('focus', showTooltip);
            icon.addEventListener('blur', hideTooltip);
        });

        // Prevent form submission on Enter key in text fields
        form.querySelectorAll('input[type="text"]').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                }
            });
        });

        console.log('User Registration Form initialized successfully!');
    }

    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();