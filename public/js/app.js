/**
 * IIIT Bhubaneswar Mess Management System
 * Application Bootstrap & Shell Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize Theme
  UI.initTheme();

  // 2. Authenticate User Session
  const user = await Auth.checkAuth();
  if (!user) return; // Will be redirected to login.html

  // 3. Initialize Router & Nav
  Nav.init();

  // 4. Initial Notification Check & Periodic Polling (every 60s)
  Notifications.fetch();
  setInterval(() => Notifications.fetch(), 60000);

  // 5. Wire Up Topbar Actions
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.onclick = () => UI.toggleTheme();
  }

  const notifBtn = document.getElementById('notifToggleBtn');
  if (notifBtn) {
    notifBtn.onclick = (e) => {
      e.stopPropagation();
      // Close profile dropdown if open
      document.getElementById('userProfileDropdown')?.classList.remove('active');
      Notifications.toggleDropdown();
    };
  }

  const userProfileBtn = document.getElementById('userProfileBtn');
  const userProfileDropdown = document.getElementById('userProfileDropdown');
  if (userProfileBtn && userProfileDropdown) {
    userProfileBtn.onclick = (e) => {
      e.stopPropagation();
      // Close notif dropdown if open
      document.getElementById('notifDropdown')?.classList.remove('active');
      userProfileDropdown.classList.toggle('active');
    };
  }

  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    const notifDropdown = document.getElementById('notifDropdown');
    const userProfileDropdown = document.getElementById('userProfileDropdown');

    if (notifDropdown && !notifDropdown.contains(e.target)) {
      notifDropdown.classList.remove('active');
    }
    if (userProfileDropdown && !userProfileDropdown.contains(e.target)) {
      userProfileDropdown.classList.remove('active');
    }
  });

  // 6. Render Lucide Icons
  UI.renderIcons();
});
