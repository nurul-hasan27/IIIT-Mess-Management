/**
 * IIIT Bhubaneswar Mess Management System
 * Mess Staff Module
 */

const Staff = {
  async load() {
    // Delegates to Dashboard.loadStaffDashboard
    const container = document.getElementById('viewContainer');
    container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Loading mess operations desk...</div></div>';
    await Dashboard.loadStaffDashboard(container);
  }
};

window.Staff = Staff;
