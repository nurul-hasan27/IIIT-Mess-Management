/**
 * IIIT Bhubaneswar Mess Management System
 * Navigation & Client-Side Router Module
 */

const Nav = {
  routes: {
    'dashboard': { title: 'Dashboard', subtitle: 'Overview & Daily Mess Summary', handler: () => Dashboard.load() },
    'menu-today': { title: "Today's Menu", subtitle: 'Real-time meals and ingredients', handler: () => Menu.loadToday() },
    'menu-weekly': { title: 'Weekly Menu Schedule', subtitle: '7-day institutional dining schedule', handler: () => Menu.loadWeekly() },
    'attendance': { title: 'Meal Attendance', subtitle: 'Personal attendance records & statistics', handler: () => Attendance.loadStudent() },
    'feedback': { title: 'Mess Feedback & Quality Ratings', subtitle: 'Rate daily food, hygiene & service', handler: () => Feedback.load() },
    'complaints': { title: 'Complaint Management & Tickets', subtitle: 'Raise and track mess grievances', handler: () => Complaints.load() },
    'bills': { title: 'Mess Bills & Fees', subtitle: 'Monthly invoices, dues & breakdown', handler: () => Billing.loadBills() },
    'payments': { title: 'Payment History & Receipts', subtitle: 'Recorded transactions & digital receipts', handler: () => Billing.loadPayments() },
    'announcements': { title: 'Institute Announcements', subtitle: 'Official mess circulars & notifications', handler: () => Announcements.load() },
    
    // Admin Routes
    'admin-students': { title: 'Student Management', subtitle: 'Registered students, room records & status', handler: () => Admin.loadStudents() },
    'admin-menu': { title: 'Manage Mess Menu', subtitle: 'Create, update & duplicate daily meal menus', handler: () => Menu.loadAdmin() },
    'admin-attendance': { title: 'Attendance Management', subtitle: 'Mark and review daily meal rosters', handler: () => Attendance.loadAdmin() },
    'admin-billing': { title: 'Billing & Fee Administration', subtitle: 'Generate monthly bills, apply rebates & record payments', handler: () => Billing.loadAdmin() },
    'admin-complaints': { title: 'Complaint Resolution Desk', subtitle: 'Review, assign & resolve student grievance tickets', handler: () => Complaints.loadAdmin() },
    'admin-expenses': { title: 'Mess Expense Tracking', subtitle: 'Procurement bills, groceries, dairy & staff costs', handler: () => Expenses.load() },
    'admin-analytics': { title: 'Reports & Analytics', subtitle: 'Financial trends, meal ratios & feedback metrics', handler: () => Admin.loadAnalytics() },
    'admin-settings': { title: 'System Settings', subtitle: 'Mess timings, base rates & institution config', handler: () => Admin.loadSettings() },

    // Staff Routes
    'staff-schedule': { title: 'Mess Operations Desk', subtitle: 'Daily kitchen schedule & expected counts', handler: () => Staff.load() },
    'staff-attendance': { title: 'Live Meal Attendance', subtitle: 'Mark student attendance at dining counters', handler: () => Attendance.loadAdmin() }
  },

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    
    // Mobile sidebar toggle
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebar = document.getElementById('appSidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (toggleBtn && sidebar && overlay) {
      toggleBtn.onclick = () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
      };

      overlay.onclick = () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      };
    }

    // Set today's date badge
    const dateBadge = document.getElementById('topbarDateBadge');
    if (dateBadge) {
      const now = new Date();
      dateBadge.innerHTML = `<span>📅</span><span>${now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>`;
    }

    // Navigate to initial hash or default to #dashboard
    if (!window.location.hash) {
      window.location.hash = '#dashboard';
    } else {
      this.handleRoute();
    }
  },

  handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    const route = this.routes[hash] || this.routes['dashboard'];

    // Update Topbar Title
    const titleEl = document.getElementById('pageTitle');
    const subtitleEl = document.getElementById('pageSubtitle');
    if (titleEl) titleEl.textContent = route.title;
    if (subtitleEl) subtitleEl.textContent = route.subtitle;

    // Update Active Link in Sidebar
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      const href = item.getAttribute('href');
      if (href === `#${hash}`) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Close mobile sidebar if open
    const sidebar = document.getElementById('appSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');

    // Run Handler
    if (typeof route.handler === 'function') {
      route.handler();
    }
  },

  navigate(hash) {
    window.location.hash = hash.startsWith('#') ? hash : `#${hash}`;
  }
};

window.Nav = Nav;
