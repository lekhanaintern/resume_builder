// ============================================
// Global Variables & Sample Data
// ============================================
let usersData = [];
let activityChart = null;

// Sample data for demonstration
const sampleCities = ['New Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'];
const sampleStatuses = ['Active', 'Inactive', 'Suspended'];
const sampleUserTypes = ['Individual', 'Agency', 'Sub Agency'];
const sampleNames = [
    'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy', 'Vikram Singh',
    'Ananya Iyer', 'Rahul Gupta', 'Pooja Mehta', 'Arjun Verma', 'Neha Agarwal',
    'Sanjay Nair', 'Kavya Rao', 'Rohan Das', 'Divya Krishnan', 'Karan Malhotra',
    'Isha Bansal', 'Varun Kapoor', 'Anjali Desai', 'Nikhil Joshi', 'Riya Saxena'
];

// ============================================
// Initialize Dashboard
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Dashboard initializing...');
    
    // Generate sample data
    generateSampleData();
    
    // Initialize all components
    updateStatCards();
    renderUserTypeDistribution();
    renderCityStats();
    renderUserTable();
    initializeActivityChart();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('✅ Dashboard initialized successfully!');
});

// ============================================
// Generate Sample Data
// ============================================
function generateSampleData() {
    usersData = [];
    
    for (let i = 0; i < 50; i++) {
        const user = {
            id: `USER-${Date.now()}-${i}`,
            name: sampleNames[Math.floor(Math.random() * sampleNames.length)],
            status: sampleStatuses[Math.floor(Math.random() * sampleStatuses.length)],
            city: sampleCities[Math.floor(Math.random() * sampleCities.length)],
            userType: sampleUserTypes[Math.floor(Math.random() * sampleUserTypes.length)],
            onboardingDate: generateRandomDate(),
            lastActive: new Date().toISOString()
        };
        usersData.push(user);
    }
    
    console.log('📊 Generated', usersData.length, 'sample users');
}

function generateRandomDate() {
    const start = new Date(2023, 0, 1);
    const end = new Date();
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
}

// ============================================
// Update Statistics Cards
// ============================================
function updateStatCards() {
    const totalUsers = usersData.length;
    const activeUsers = usersData.filter(u => u.status === 'Active').length;
    const inactiveUsers = usersData.filter(u => u.status === 'Inactive').length;
    const suspendedUsers = usersData.filter(u => u.status === 'Suspended').length;
    
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('activeUsers').textContent = activeUsers;
    document.getElementById('inactiveUsers').textContent = inactiveUsers;
    document.getElementById('suspendedUsers').textContent = suspendedUsers;
    
    console.log('📈 Stats updated:', { totalUsers, activeUsers, inactiveUsers, suspendedUsers });
}

// ============================================
// Render User Type Distribution
// ============================================
function renderUserTypeDistribution() {
    const userTypeCounts = {};
    const colors = {
        'Individual': { bg: '#eef2ff', color: '#6366f1' },
        'Agency': { bg: '#d1fae5', color: '#10b981' },
        'Sub Agency': { bg: '#fef3c7', color: '#f59e0b' }
    };
    
    // Count user types
    usersData.forEach(user => {
        userTypeCounts[user.userType] = (userTypeCounts[user.userType] || 0) + 1;
    });
    
    const container = document.getElementById('userTypeList');
    container.innerHTML = '';
    
    Object.keys(userTypeCounts).forEach((type, index) => {
        const count = userTypeCounts[type];
        const percentage = ((count / usersData.length) * 100).toFixed(1);
        const color = colors[type];
        
        const item = document.createElement('div');
        item.className = 'user-type-item';
        item.innerHTML = `
            <div class="user-type-info">
                <div class="user-type-icon" style="background: ${color.bg}; color: ${color.color};">
                    ${type.charAt(0)}
                </div>
                <div class="user-type-details">
                    <h6>${type}</h6>
                    <p>${count} users</p>
                </div>
            </div>
            <div class="user-type-progress">
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${percentage}%; background: ${color.color};"></div>
                </div>
                <div class="progress-label">${percentage}%</div>
            </div>
        `;
        
        container.appendChild(item);
    });
    
    console.log('👥 User type distribution rendered');
}

// ============================================
// Render City Statistics
// ============================================
function renderCityStats() {
    const cityCounts = {};
    
    // Count users per city
    usersData.forEach(user => {
        cityCounts[user.city] = (cityCounts[user.city] || 0) + 1;
    });
    
    // Sort by count and get top 5
    const sortedCities = Object.entries(cityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const container = document.getElementById('cityStatsList');
    container.innerHTML = '';
    
    sortedCities.forEach(([city, count]) => {
        const item = document.createElement('div');
        item.className = 'city-stat-item';
        item.innerHTML = `
            <div class="city-info">
                <div class="city-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                </div>
                <span class="city-name">${city}</span>
            </div>
            <span class="city-count">${count}</span>
        `;
        
        container.appendChild(item);
    });
    
    console.log('🌆 City stats rendered');
}

// ============================================
// Render User Table
// ============================================
function renderUserTable(filteredUsers = null) {
    const users = filteredUsers || usersData.slice(0, 10); // Show first 10 users
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span class="user-name">${user.name}</span></td>
            <td><span class="status-badge ${user.status.toLowerCase()}">${user.status}</span></td>
            <td>${user.city}</td>
            <td>${user.userType}</td>
            <td>${formatDate(user.onboardingDate)}</td>
            <td>
                <button class="action-btn" onclick="viewUser('${user.id}')">View</button>
                <button class="action-btn" onclick="editUser('${user.id}')">Edit</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    console.log('📋 User table rendered with', users.length, 'users');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// ============================================
// Initialize Activity Chart
// ============================================
function initializeActivityChart() {
    const ctx = document.getElementById('activityChart').getContext('2d');
    
    // Generate sample data for today and yesterday
    const todayData = generateActivityData();
    const yesterdayData = generateActivityData();
    
    // Calculate totals
    const todayTotal = todayData.reduce((a, b) => a + b, 0);
    const yesterdayTotal = yesterdayData.reduce((a, b) => a + b, 0);
    
    document.getElementById('todayVisits').textContent = todayTotal;
    document.getElementById('yesterdayVisits').textContent = yesterdayTotal;
    
    activityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'],
            datasets: [
                {
                    label: 'Today',
                    data: todayData,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 6
                },
                {
                    label: 'Yesterday',
                    data: yesterdayData,
                    borderColor: '#a5b4fc',
                    backgroundColor: 'rgba(165, 180, 252, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: '#a5b4fc',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1f2937',
                    padding: 12,
                    titleColor: '#f9fafb',
                    bodyColor: '#f9fafb',
                    borderColor: '#374151',
                    borderWidth: 1,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + ' visits';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#6b7280',
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: '#e5e7eb',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: '#6b7280',
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
    
    console.log('📊 Activity chart initialized');
}

function generateActivityData() {
    return Array.from({ length: 7 }, () => Math.floor(Math.random() * 50) + 10);
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
    // Menu toggle for mobile
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Navigation items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');
            
            const section = item.dataset.section;
            console.log('📍 Navigating to:', section);
            
            // You can add section-specific logic here
        });
    });
    
    console.log('🎯 Event listeners setup complete');
}

// ============================================
// Search Functionality
// ============================================
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
        renderUserTable();
        return;
    }
    
    const filteredUsers = usersData.filter(user => {
        return user.name.toLowerCase().includes(searchTerm) ||
               user.city.toLowerCase().includes(searchTerm) ||
               user.status.toLowerCase().includes(searchTerm) ||
               user.userType.toLowerCase().includes(searchTerm);
    });
    
    renderUserTable(filteredUsers);
    console.log('🔍 Search results:', filteredUsers.length, 'users found');
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// User Actions
// ============================================
function viewUser(userId) {
    const user = usersData.find(u => u.id === userId);
    if (user) {
        console.log('👁️ Viewing user:', user);
        alert(`Viewing user: ${user.name}\nStatus: ${user.status}\nCity: ${user.city}`);
    }
}

function editUser(userId) {
    const user = usersData.find(u => u.id === userId);
    if (user) {
        console.log('✏️ Editing user:', user);
        alert(`Editing user: ${user.name}\n(Edit functionality would open a modal or form)`);
    }
}

function refreshUsers() {
    console.log('🔄 Refreshing users data...');
    generateSampleData();
    updateStatCards();
    renderUserTypeDistribution();
    renderCityStats();
    renderUserTable();
    
    // Show notification
    showNotification('Users data refreshed successfully!');
}

// ============================================
// Utility Functions
// ============================================
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        font-family: 'DM Sans', sans-serif;
        font-weight: 500;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================================
// Export/Download Functions (Optional)
// ============================================
function exportUsersToJSON() {
    const dataStr = JSON.stringify(usersData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('Users data exported successfully!');
}

// ============================================
// Console Art (Easter Egg)
// ============================================
console.log(`
%c╔═══════════════════════════════════════╗
║   User Management Dashboard v1.0      ║
║   Built with ❤️ using Bootstrap       ║
╚═══════════════════════════════════════╝
`, 'color: #6366f1; font-family: monospace; font-size: 12px;');