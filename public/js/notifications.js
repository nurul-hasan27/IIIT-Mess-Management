/**
 * IIIT Bhubaneswar Mess Management System
 * In-App Notifications Module
 */

const Notifications = {
  notifications: [],
  unreadCount: 0,

  async fetch() {
    try {
      const data = await API.get('/api/notifications');
      this.notifications = data.notifications || [];
      this.unreadCount = data.unreadCount || 0;
      this.updateBadge();
    } catch (err) {
      console.warn('Could not fetch notifications:', err);
    }
  },

  updateBadge() {
    const badge = document.getElementById('notifBadge');
    if (badge) {
      if (this.unreadCount > 0) {
        badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  },

  toggleDropdown() {
    const dropdown = document.getElementById('notifDropdown');
    if (!dropdown) return;

    const isActive = dropdown.classList.contains('active');
    if (isActive) {
      dropdown.classList.remove('active');
    } else {
      this.renderDropdown();
      dropdown.classList.add('active');
    }
  },

  renderDropdown() {
    const dropdown = document.getElementById('notifDropdown');
    if (!dropdown) return;

    const listHtml = this.notifications.length === 0
      ? '<div style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px;">No notifications yet.</div>'
      : this.notifications.map(n => `
        <div style="padding: 10px 14px; border-bottom: 1px solid var(--border-subtle); display: flex; gap: 10px; cursor: pointer; background: ${n.is_read ? 'transparent' : 'var(--primary-light)'};" onclick="Notifications.handleClick(${n.id}, '${n.type}')">
          <div style="font-size: 16px; display: flex; align-items: center;">
            ${n.type === 'bill' ? '<img src="assets/icons/bills.png" style="width: 18px; height: 18px; object-fit: contain;" alt="Bill">' : (n.type === 'complaint' ? '<img src="assets/icons/complaints.png" style="width: 18px; height: 18px; object-fit: contain;" alt="Complaint">' : (n.type === 'payment' ? '<img src="assets/icons/payments.png" style="width: 18px; height: 18px; object-fit: contain;" alt="Payment">' : '<img src="assets/icons/announcements.png" style="width: 18px; height: 18px; object-fit: contain;" alt="Announcement">'))}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; font-size: 12.5px; color: var(--text-primary); margin-bottom: 2px;">${n.title}</div>
            <div style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4;">${n.message}</div>
            <div style="font-size: 10.5px; color: var(--text-tertiary); margin-top: 4px;">${UI.formatTime(n.created_at)}</div>
          </div>
        </div>
      `).join('');

    dropdown.innerHTML = `
      <div style="padding: 12px 14px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 700; font-size: 13.5px;">Notifications (${this.unreadCount})</span>
        ${this.unreadCount > 0 ? '<button class="btn btn-sm btn-outline" style="font-size: 11px;" onclick="Notifications.markAllRead()">Mark all read</button>' : ''}
      </div>
      <div style="max-height: 340px; overflow-y: auto;">
        ${listHtml}
      </div>
    `;
  },

  async handleClick(id, type) {
    try {
      await API.put(`/api/notifications/${id}/read`);
      this.fetch();
      const dropdown = document.getElementById('notifDropdown');
      if (dropdown) dropdown.classList.remove('active');

      if (type === 'bill') Nav.navigate('#bills');
      else if (type === 'complaint') Nav.navigate(Auth.user?.role === 'student' ? '#complaints' : '#admin-complaints');
      else if (type === 'payment') Nav.navigate('#payments');
      else if (type === 'announcement') Nav.navigate('#announcements');
    } catch (err) {
      console.error(err);
    }
  },

  async markAllRead() {
    try {
      await API.put('/api/notifications/read-all');
      this.fetch();
      this.renderDropdown();
      UI.toast({ title: 'Updated', message: 'All notifications marked as read.', type: 'info' });
    } catch (err) {
      console.error(err);
    }
  }
};

window.Notifications = Notifications;
