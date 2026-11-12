/**
 * IIIT Bhubaneswar Mess Management System
 * Authentication & User Session Module
 */

const Auth = {
  user: null,

  async checkAuth() {
    try {
      const data = await API.get('/api/auth/me');
      if (!data || !data.authenticated || !data.user) {
        window.location.href = 'login.html';
        return null;
      }
      this.user = data.user;
      this.renderUserUI();
      return this.user;
    } catch (err) {
      window.location.href = 'login.html';
      return null;
    }
  },

  renderUserUI() {
    if (!this.user) return;

    // Sidebar user snippet
    const nameEl = document.getElementById('sidebarUserName');
    const roleEl = document.getElementById('sidebarUserRole');
    const avatarEl = document.getElementById('sidebarUserAvatar');

    if (nameEl) nameEl.textContent = this.user.full_name;
    if (roleEl) roleEl.textContent = `${this.user.role.toUpperCase()} ${this.user.student_id ? '• ' + this.user.student_id : ''}`;
    
    const dropName = document.getElementById('dropdownUserName');
    const dropRole = document.getElementById('dropdownUserRole');
    if (dropName) dropName.textContent = this.user.full_name;
    if (dropRole) dropRole.textContent = `${this.user.role.toUpperCase()} • ${this.user.student_id || this.user.email}`;

    if (avatarEl) {
      const initials = this.user.full_name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      avatarEl.textContent = initials;
    }

    // Role-specific navigation adjustments
    const adminNavs = document.querySelectorAll('.nav-admin-only');
    adminNavs.forEach(el => {
      el.style.display = this.user.role === 'admin' ? 'block' : 'none';
    });

    const staffNavs = document.querySelectorAll('.nav-staff-only');
    staffNavs.forEach(el => {
      el.style.display = (this.user.role === 'staff' || this.user.role === 'admin') ? 'block' : 'none';
    });

    const studentNavs = document.querySelectorAll('.nav-student-only');
    studentNavs.forEach(el => {
      el.style.display = this.user.role === 'student' ? 'block' : 'none';
    });
  },

  async logout() {
    try {
      await API.post('/api/auth/logout');
      UI.toast({ title: 'Logged out', message: 'You have been safely signed out.', type: 'info' });
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 300);
    } catch (err) {
      window.location.href = 'login.html';
    }
  },

  openProfileModal() {
    if (!this.user) return;

    const html = `
      <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px; padding: 12px; background: var(--bg-subtle); border-radius: var(--radius-md);">
        <div class="user-avatar" style="width: 44px; height: 44px; font-size: 16px;">
          ${this.user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div>
          <div style="font-weight: 700; font-size: 14px;">${this.user.full_name}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">${this.user.email} • Role: ${this.user.role.toUpperCase()}</div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input type="text" id="profFullName" class="form-input" value="${this.user.full_name || ''}">
      </div>

      <div class="form-group">
        <label class="form-label">Hostel & Room Details</label>
        <input type="text" id="profRoom" class="form-input" value="${this.user.hostel_room || ''}">
      </div>

      <div class="form-group">
        <label class="form-label">Contact Mobile Number</label>
        <input type="tel" id="profPhone" class="form-input" value="${this.user.phone || ''}">
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label class="form-label">Department / Branch</label>
          <input type="text" id="profDept" class="form-input" value="${this.user.department || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Year of Study</label>
          <input type="number" id="profYear" class="form-input" value="${this.user.year_of_study || ''}" min="1" max="5">
        </div>
      </div>
    `;

    UI.modal({
      title: 'Personal Profile Settings',
      bodyHtml: html,
      confirmText: 'Save Profile Changes',
      onConfirm: async () => {
        const payload = {
          full_name: document.getElementById('profFullName').value.trim(),
          hostel_room: document.getElementById('profRoom').value.trim(),
          phone: document.getElementById('profPhone').value.trim(),
          department: document.getElementById('profDept').value.trim(),
          year_of_study: document.getElementById('profYear').value
        };

        const res = await API.put('/api/auth/profile', payload);
        this.user = res.user;
        this.renderUserUI();
        UI.toast({ title: 'Success', message: 'Profile details saved.', type: 'success' });
        return true;
      }
    });
  },

  openPasswordModal() {
    const html = `
      <div class="form-group">
        <label class="form-label">Current Password <span class="required">*</span></label>
        <input type="password" id="currPassInput" class="form-input" required>
      </div>
      <div class="form-group">
        <label class="form-label">New Password (min 6 chars) <span class="required">*</span></label>
        <input type="password" id="newPassInput" class="form-input" minlength="6" required>
      </div>
      <div class="form-group">
        <label class="form-label">Confirm New Password <span class="required">*</span></label>
        <input type="password" id="confirmNewPassInput" class="form-input" minlength="6" required>
      </div>
    `;

    UI.modal({
      title: 'Change Account Password',
      bodyHtml: html,
      confirmText: 'Update Password',
      onConfirm: async () => {
        const current_password = document.getElementById('currPassInput').value;
        const new_password = document.getElementById('newPassInput').value;
        const confirm_password = document.getElementById('confirmNewPassInput').value;

        if (!current_password || !new_password) {
          throw new Error('Please fill all required password fields.');
        }
        if (new_password !== confirm_password) {
          throw new Error('New passwords do not match.');
        }

        await API.put('/api/auth/change-password', { current_password, new_password, confirm_password });
        UI.toast({ title: 'Password Updated', message: 'Your password has been changed successfully.', type: 'success' });
        return true;
      }
    });
  }
};

window.Auth = Auth;
