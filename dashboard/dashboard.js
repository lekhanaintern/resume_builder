// Global Variables
let registrationsData = null;
let allUsers = [];
let filteredUsers = [];
let userTypeChart = null;
let cityChart = null;
let currentPage = 'overview';

// City data by state
const citiesByState = {
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Solapur"],
    "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum", "Gulbarga"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli"],
    "Delhi": ["New Delhi", "Central Delhi", "South Delhi", "North Delhi", "East Delhi", "West Delhi"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Meerut", "Allahabad", "Noida"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain"],
    "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar"],
    "Punjab": ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur"],
    "Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi", "Kullu"],
    "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"],
    "Tripura": ["Agartala", "Udaipur", "Dharmanagar", "Kailashahar"],
    "Meghalaya": ["Shillong", "Tura", "Nongstoin", "Jowai"],
    "Manipur": ["Imphal", "Thoubal", "Bishnupur", "Churachandpur"],
    "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang"],
    "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang"],
    "Mizoram": ["Aizawl", "Lunglei", "Champhai", "Serchhip"],
    "Sikkim": ["Gangtok", "Namchi", "Geyzing", "Mangan"]
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 300));
    document.getElementById('registrationForm').addEventListener('submit', handleRegistrationSubmit);
    
    // State-City dependency
    document.getElementById('regState').addEventListener('change', function() {
        const selectedState = this.value;
        const citySelect = document.getElementById('regCity');
        citySelect.innerHTML = '<option value="">Select City</option>';
        
        if (selectedState && citiesByState[selectedState]) {
            citiesByState[selectedState].forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });
        }
    });
    
    // Filter dropdowns
    document.getElementById('filterCity').addEventListener('change', applyFilters);
    document.getElementById('filterState').addEventListener('change', applyFilters);
    document.getElementById('filterStatus').addEventListener('change', applyFilters);
    document.getElementById('filterType').addEventListener('change', applyFilters);
    
    // Navigation
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            navigateToPage(page);
        });
    });
});

function navigateToPage(page) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    // Hide all pages
    document.getElementById('overviewPage').style.display = 'none';
    document.getElementById('usersPage').style.display = 'none';
    document.getElementById('registrationPage').style.display = 'none';

    // Show selected page
    if (page === 'overview') {
        document.getElementById('overviewPage').style.display = 'block';
    } else if (page === 'users') {
        document.getElementById('usersPage').style.display = 'block';
        renderUserTable(filteredUsers);
    } else if (page === 'registration') {
        document.getElementById('registrationPage').style.display = 'block';
    }

    currentPage = page;
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    if (file.type !== 'application/json') {
        alert('Please select a valid JSON file!');
        return;
    }
    
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.classList.remove('hide');
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            registrationsData = JSON.parse(content);
            allUsers = registrationsData.registrations || [];
            filteredUsers = [...allUsers];
            
            console.log('✅ File loaded:', allUsers.length, 'users');
            
            // Hide upload section and show dashboard content
            document.getElementById('uploadSection').style.display = 'none';
            document.getElementById('dashboardContent').style.display = 'block';
            
            loadingScreen.classList.add('hide');
            
            renderDashboard();
            
        } catch (error) {
            console.error('❌ Error:', error);
            loadingScreen.classList.add('hide');
            alert('Error reading file. Please make sure it\'s a valid JSON file.');
        }
    };
    
    reader.readAsText(file);
}

function renderDashboard() {
    updateStatistics();
    renderUserTypeChart();
    renderCityChart();
    populateFilterDropdowns();
}

function populateFilterDropdowns() {
    // Get unique cities
    const cities = [...new Set(allUsers.map(u => u.address.city))].sort();
    const citySelect = document.getElementById('filterCity');
    citySelect.innerHTML = '<option value="">All Cities</option>';
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });

    // Get unique states
    const states = [...new Set(allUsers.map(u => u.address.state))].sort();
    const stateSelect = document.getElementById('filterState');
    stateSelect.innerHTML = '<option value="">All States</option>';
    states.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateSelect.appendChild(option);
    });

    // Get unique user types
    const types = [...new Set(allUsers.map(u => u.accountDetails.userType))].sort();
    const typeSelect = document.getElementById('filterType');
    typeSelect.innerHTML = '<option value="">All Types</option>';
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeSelect.appendChild(option);
    });
}

function applyFilters() {
    const cityFilter = document.getElementById('filterCity').value;
    const stateFilter = document.getElementById('filterState').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const typeFilter = document.getElementById('filterType').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();

    filteredUsers = allUsers.filter(user => {
        const matchCity = !cityFilter || user.address.city === cityFilter;
        const matchState = !stateFilter || user.address.state === stateFilter;
        const matchStatus = !statusFilter || user.accountDetails.status === statusFilter;
        const matchType = !typeFilter || user.accountDetails.userType === typeFilter;
        
        let matchSearch = true;
        if (searchTerm) {
            const name = user.personalInformation.fullName.toLowerCase();
            const city = user.address.city.toLowerCase();
            const status = user.accountDetails.status.toLowerCase();
            matchSearch = name.includes(searchTerm) || 
                         city.includes(searchTerm) || 
                         status.includes(searchTerm);
        }

        return matchCity && matchState && matchStatus && matchType && matchSearch;
    });

    renderUserTable(filteredUsers);
}

function updateStatistics() {
    const total = allUsers.length;
    const active = allUsers.filter(u => u.accountDetails.status === 'Active').length;
    const inactive = allUsers.filter(u => u.accountDetails.status === 'Inactive').length;
    const suspended = allUsers.filter(u => u.accountDetails.status === 'Suspended').length;
    
    document.getElementById('totalUsers').textContent = total;
    document.getElementById('activeUsers').textContent = active;
    document.getElementById('inactiveUsers').textContent = inactive;
    document.getElementById('suspendedUsers').textContent = suspended;
    document.getElementById('userCountBadge').textContent = total;
}

function renderUserTypeChart() {
    const ctx = document.getElementById('userTypeChart').getContext('2d');
    
    const typeCounts = {};
    allUsers.forEach(user => {
        const type = user.accountDetails.userType;
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    const labels = Object.keys(typeCounts);
    const data = Object.values(typeCounts);
    const colors = ['#4f46e5', '#06b6d4', '#f59e0b'];
    
    if (userTypeChart) userTypeChart.destroy();
    
    userTypeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            cutout: '70%'
        }
    });
    
    const legendContainer = document.getElementById('userTypeLegend');
    legendContainer.innerHTML = '';
    
    labels.forEach((label, index) => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `
            <span class="legend-color" style="background: ${colors[index]};"></span>
            <span class="legend-label">${label}</span>
            <span class="legend-value">${data[index]}</span>
        `;
        legendContainer.appendChild(item);
    });
}

function renderCityChart() {
    const ctx = document.getElementById('cityChart').getContext('2d');
    
    const cityCounts = {};
    allUsers.forEach(user => {
        const city = user.address.city;
        cityCounts[city] = (cityCounts[city] || 0) + 1;
    });
    
    const sortedCities = Object.entries(cityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const labels = sortedCities.map(c => c[0]);
    const data = sortedCities.map(c => c[1]);
    
    if (cityChart) cityChart.destroy();
    
    cityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Users',
                data: data,
                backgroundColor: 'rgba(79, 70, 229, 0.8)',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function renderUserTable(usersToShow = filteredUsers) {
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = '';
    
    document.getElementById('resultCount').textContent = usersToShow.length;
    
    if (usersToShow.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 3rem; color: #a1a1aa;">No users found</td></tr>';
        return;
    }
    
    usersToShow.forEach(user => {
        const row = document.createElement('tr');
        const date = new Date(user.accountDetails.onboardingDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        row.innerHTML = `
            <td><span class="user-name">${user.personalInformation.fullName}</span></td>
            <td>${user.personalInformation.contactNumber}</td>
            <td>${user.address.city}</td>
            <td>${user.address.state}</td>
            <td><span class="status-badge ${user.accountDetails.status.toLowerCase()}">${user.accountDetails.status}</span></td>
            <td>${user.accountDetails.userType}</td>
            <td>${date}</td>
        `;
        
        tbody.appendChild(row);
    });
}

function handleSearch(e) {
    applyFilters();
}

function handleRegistrationSubmit(e) {
    e.preventDefault();
    
    const newUser = {
        personalInformation: {
            fullName: document.getElementById('fullName').value,
            contactNumber: document.getElementById('contactNumber').value,
            email: document.getElementById('email').value,
            dateOfBirth: document.getElementById('dateOfBirth').value,
            gender: document.getElementById('gender').value
        },
        address: {
            street: document.getElementById('street').value,
            city: document.getElementById('regCity').value,
            state: document.getElementById('regState').value,
            postalCode: document.getElementById('postalCode').value
        },
        accountDetails: {
            userType: document.getElementById('userType').value,
            status: document.getElementById('status').value,
            onboardingDate: new Date().toISOString()
        }
    };
    
    allUsers.push(newUser);
    filteredUsers = [...allUsers];
    
    // Update the registrationsData object
    if (registrationsData) {
        registrationsData.registrations = allUsers;
    }
    
    // Automatically download updated JSON
    downloadUpdatedJson();
    
    // Update dashboard
    renderDashboard();
    
    // Show success message with user info
    const successMsg = `✅ User "${newUser.personalInformation.fullName}" registered successfully!\n\n` +
                      `📧 Email: ${newUser.personalInformation.email}\n` +
                      `📍 Location: ${newUser.address.city}, ${newUser.address.state}\n` +
                      `📊 Type: ${newUser.accountDetails.userType}\n` +
                      `✓ Status: ${newUser.accountDetails.status}\n\n` +
                      `Updated JSON file has been downloaded automatically.`;
    alert(successMsg);
    
    // Reset form and navigate to users page
    document.getElementById('registrationForm').reset();
    navigateToPage('users');
}

function downloadUpdatedJson() {
    if (!registrationsData || allUsers.length === 0) {
        alert('⚠️ No data to download. Please upload a JSON file first or add some users.');
        return;
    }
    
    // Update registrationsData with current users
    registrationsData.registrations = allUsers;
    
    // Create JSON string
    const jsonString = JSON.stringify(registrationsData, null, 2);
    
    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `all_registrations_updated_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function resetForm() {
    document.getElementById('registrationForm').reset();
    navigateToPage('overview');
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function exportData() {
    if (allUsers.length === 0) {
        alert('No data to export. Please upload a JSON file first.');
        return;
    }
    
    let csv = 'Name,Contact,Email,City,State,Status,Type,Gender,Date of Birth,Onboarding Date\n';
    
    allUsers.forEach(user => {
        const row = [
            user.personalInformation.fullName,
            user.personalInformation.contactNumber,
            user.personalInformation.email || 'N/A',
            user.address.city,
            user.address.state,
            user.accountDetails.status,
            user.accountDetails.userType,
            user.personalInformation.gender,
            user.personalInformation.dateOfBirth,
            user.accountDetails.onboardingDate
        ].map(field => `"${field}"`).join(',');
        
        csv += row + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('✅ Data exported successfully!');
}

console.log('🎉 Dashboard ready! Upload your JSON file to begin.');