/**
 * IIIT Bhubaneswar Mess Management System
 * Admin Management Module (Students, System Settings & Analytics)
 */

const Admin = {
  // --------------------------------------------------------------------------
  // STUDENT MANAGEMENT
  // --------------------------------------------------------------------------
  async loadStudents(search = '', department = '', year = '', status = '') {
    const container = document.getElementById('viewContainer');
    container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Loading student records...</div></div>';

    try {
      const data = await API.get('/api/students', { search, department, year, status });
      const students = data.students || [];

      const rowsHtml = students.length === 0
        ? '<tr><td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 28px;">No students match the criteria.</td></tr>'
        : students.map(s => `
          <tr>
            <td><strong>${s.student_id}</strong></td>
            <td>
              <div style="font-weight: 600;">${s.full_name}</div>
              <div style="font-size: 11px; color: var(--text-secondary);">${s.email}</div>
            </td>
            <td>${s.department || '—'} <span style="font-size: 11px; color: var(--text-secondary);">(Yr ${s.year_of_study || '1'})</span></td>
            <td>${s.hostel_room || '—'}</td>
            <td style="color: ${s.total_dues > 0 ? 'var(--danger)' : 'var(--success)'}; font-weight: 700;">
              ${UI.formatCurrency(s.total_dues)}
            </td>
            <td>
              <span class="badge ${s.is_active ? 'badge-success' : 'badge-danger'}">
                ${s.is_active ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td>
              <div style="display: flex; gap: 6px;">
                <button class="btn btn-sm btn-outline" onclick="Admin.openEditStudentModal(${s.id}, '${s.student_id}', '${s.full_name.replace(/'/g, "\\'")}', '${s.email}', '${s.department || ''}', ${s.year_of_study || 1}, '${(s.hostel_room || '').replace(/'/g, "\\'")}', '${s.phone || ''}', ${s.is_active})">Edit</button>
                <button class="btn btn-sm ${s.is_active ? 'btn-danger' : 'btn-secondary'}" onclick="Admin.toggleStudentActive(${s.id}, ${s.is_active ? 0 : 1})">
                  ${s.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </td>
          </tr>
        `).join('');

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              <img src="assets/icons/students.png" style="width: 22px; height: 22px;" alt="Students">
              Student Roster & Room Records
            </h2>
            <p style="font-size: 13px; color: var(--color-graphite);">Manage enrolled dining residents, room allocations & account states</p>
          </div>
          <div>
            <button class="btn btn-primary" onclick="Admin.openAddStudentModal()">➕ Add New Student</button>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-body" style="padding: 16px 20px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
            <input type="text" id="adminStudentSearch" class="form-input" style="flex: 1; min-width: 220px;" placeholder="Search roll no, full name, or email..." value="${search}">

            <select id="adminStudentDept" class="form-select" style="width: auto;">
              <option value="">All Branches</option>
              <option value="CSE" ${department === 'CSE' ? 'selected' : ''}>CSE</option>
              <option value="ECE" ${department === 'ECE' ? 'selected' : ''}>ECE</option>
              <option value="EEE" ${department === 'EEE' ? 'selected' : ''}>EEE</option>
              <option value="IT" ${department === 'IT' ? 'selected' : ''}>IT</option>
              <option value="CE" ${department === 'CE' ? 'selected' : ''}>CE</option>
            </select>

            <select id="adminStudentYear" class="form-select" style="width: auto;">
              <option value="">All Years</option>
              <option value="1" ${year === '1' ? 'selected' : ''}>1st Year</option>
              <option value="2" ${year === '2' ? 'selected' : ''}>2nd Year</option>
              <option value="3" ${year === '3' ? 'selected' : ''}>3rd Year</option>
              <option value="4" ${year === '4' ? 'selected' : ''}>4th Year</option>
            </select>

            <select id="adminStudentStatus" class="form-select" style="width: auto;">
              <option value="">All Statuses</option>
              <option value="1" ${status === '1' ? 'selected' : ''}>Active</option>
              <option value="0" ${status === '0' ? 'selected' : ''}>Inactive</option>
            </select>

            <button class="btn btn-primary" onclick="Admin.loadStudents(document.getElementById('adminStudentSearch').value, document.getElementById('adminStudentDept').value, document.getElementById('adminStudentYear').value, document.getElementById('adminStudentStatus').value)">
              Search Students
            </button>
          </div>
        </div>

        <!-- Student Table -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Enrolled Students (${students.length})</div>
          </div>
          <div class="card-body" style="padding: 0;">
            <div class="table-container" style="border: none;">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Full Name & Email</th>
                    <th>Branch / Year</th>
                    <th>Hostel Room</th>
                    <th>Total Dues</th>
                    <th>Account Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      UI.renderIcons();
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-title">Error: ${err.message}</div></div>`;
    }
  },

  openAddStudentModal() {
    const html = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label class="form-label">Student ID / Roll No <span class="required">*</span></label>
          <input type="text" id="addRoll" class="form-input" placeholder="e.g. B121025" required>
        </div>
        <div class="form-group">
          <label class="form-label">Full Name <span class="required">*</span></label>
          <input type="text" id="addName" class="form-input" placeholder="e.g. Rahul Verma" required>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Institute Email <span class="required">*</span></label>
        <input type="email" id="addEmail" class="form-input" placeholder="e.g. b121025@iiit-bh.ac.in" required>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label class="form-label">Department</label>
          <select id="addDept" class="form-select">
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="IT">IT</option>
            <option value="CE">CE</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Year of Study</label>
          <select id="addYear" class="form-select">
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3" selected>3rd Year</option>
            <option value="4">4th Year</option>
          </select>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label class="form-label">Hostel & Room No</label>
          <input type="text" id="addRoom" class="form-input" placeholder="e.g. Hostel-1, Room 204">
        </div>
        <div class="form-group">
          <label class="form-label">Mobile Number</label>
          <input type="tel" id="addPhone" class="form-input" placeholder="+91 98765 43210">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Initial Password</label>
        <input type="text" id="addPass" class="form-input" value="Student@123">
        <div class="form-hint">Default password is Student@123 (student can change after login).</div>
      </div>
    `;

    UI.modal({
      title: 'Enroll New Student Account',
      bodyHtml: html,
      confirmText: 'Create Student Account',
      onConfirm: async () => {
        const student_id = document.getElementById('addRoll').value.trim();
        const full_name = document.getElementById('addName').value.trim();
        const email = document.getElementById('addEmail').value.trim();
        const department = document.getElementById('addDept').value;
        const year_of_study = document.getElementById('addYear').value;
        const hostel_room = document.getElementById('addRoom').value.trim();
        const phone = document.getElementById('addPhone').value.trim();
        const password = document.getElementById('addPass').value;

        if (!student_id || !full_name || !email) {
          throw new Error('Please fill student ID, full name and email.');
        }

        await API.post('/api/students', {
          student_id,
          full_name,
          email,
          department,
          year_of_study,
          hostel_room,
          phone,
          password
        });

        UI.toast({ title: 'Student Enrolled', message: `${full_name} added successfully.`, type: 'success' });
        Admin.loadStudents();
        return true;
      }
    });
  },

  openEditStudentModal(id, student_id, full_name, email, department, year, room, phone, isActive) {
    const html = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label class="form-label">Student ID (Read-only)</label>
          <input type="text" class="form-input" value="${student_id}" disabled>
        </div>
        <div class="form-group">
          <label class="form-label">Full Name <span class="required">*</span></label>
          <input type="text" id="editName" class="form-input" value="${full_name}" required>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Institute Email <span class="required">*</span></label>
        <input type="email" id="editEmail" class="form-input" value="${email}" required>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label class="form-label">Department</label>
          <select id="editDept" class="form-select">
            <option value="CSE" ${department === 'CSE' ? 'selected' : ''}>CSE</option>
            <option value="ECE" ${department === 'ECE' ? 'selected' : ''}>ECE</option>
            <option value="EEE" ${department === 'EEE' ? 'selected' : ''}>EEE</option>
            <option value="IT" ${department === 'IT' ? 'selected' : ''}>IT</option>
            <option value="CE" ${department === 'CE' ? 'selected' : ''}>CE</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Year</label>
          <select id="editYear" class="form-select">
            <option value="1" ${year === 1 ? 'selected' : ''}>1st Year</option>
            <option value="2" ${year === 2 ? 'selected' : ''}>2nd Year</option>
            <option value="3" ${year === 3 ? 'selected' : ''}>3rd Year</option>
            <option value="4" ${year === 4 ? 'selected' : ''}>4th Year</option>
          </select>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label class="form-label">Hostel & Room</label>
          <input type="text" id="editRoom" class="form-input" value="${room}">
        </div>
        <div class="form-group">
          <label class="form-label">Phone</label>
          <input type="tel" id="editPhone" class="form-input" value="${phone}">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Reset Password (leave empty to keep unchanged)</label>
        <input type="password" id="editPass" class="form-input" placeholder="New password if resetting">
      </div>
    `;

    UI.modal({
      title: `Edit Student: ${student_id}`,
      bodyHtml: html,
      confirmText: 'Save Changes',
      onConfirm: async () => {
        const payload = {
          full_name: document.getElementById('editName').value.trim(),
          email: document.getElementById('editEmail').value.trim(),
          department: document.getElementById('editDept').value,
          year_of_study: document.getElementById('editYear').value,
          hostel_room: document.getElementById('editRoom').value.trim(),
          phone: document.getElementById('editPhone').value.trim(),
          password: document.getElementById('editPass').value.trim() || undefined
        };

        await API.put(`/api/students/${id}`, payload);
        UI.toast({ title: 'Saved', message: 'Student information updated.', type: 'success' });
        Admin.loadStudents();
        return true;
      }
    });
  },

  async toggleStudentActive(id, newStatus) {
    try {
      await API.put(`/api/students/${id}`, { is_active: newStatus });
      UI.toast({
        title: 'Status Updated',
        message: `Student account marked as ${newStatus ? 'active' : 'inactive'}.`,
        type: 'info'
      });
      Admin.loadStudents();
    } catch (err) {
      UI.toast({ title: 'Error', message: err.message, type: 'error' });
    }
  },

  // --------------------------------------------------------------------------
  // REPORTS & ANALYTICS VIEW
  // --------------------------------------------------------------------------
  async loadAnalytics() {
    const container = document.getElementById('viewContainer');
    container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Loading analytics reports...</div></div>';

    try {
      const data = await API.get('/api/dashboard/admin');
      const { stats, analytics } = data;

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              <img src="assets/icons/analytics.png" style="width: 22px; height: 22px;" alt="Analytics">
              Reports & Operational Analytics
            </h2>
            <p style="font-size: 13px; color: var(--color-graphite);">Comprehensive institutional performance charts, revenue audits & dining attendance</p>
          </div>
          <div>
            <button class="btn btn-primary" onclick="Billing.exportCSV()">📥 Export Comprehensive CSV</button>
          </div>
        </div>

        <div class="charts-grid">
          <div class="chart-card">
            <div class="chart-header">
              <div class="chart-title">Revenue vs Operating Expenses (Last 6 Months)</div>
            </div>
            <div class="chart-container">
              <canvas id="analyticsRevExpChart"></canvas>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <div class="chart-title">Procurement Categories Distribution</div>
            </div>
            <div class="chart-container">
              <canvas id="analyticsCatChart"></canvas>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <div class="chart-title">Weekly Meal Session Turnout Trends</div>
            </div>
            <div class="chart-container">
              <canvas id="analyticsAttChart"></canvas>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <div class="chart-title">Complaint Ticket Status Breakdown</div>
            </div>
            <div class="chart-container">
              <canvas id="analyticsComplaintChart"></canvas>
            </div>
          </div>
        </div>
      `;

      // Render Charts
      if (window.Chart) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#94A3B8' : '#615d59';

        // 1. Bar Chart
        new Chart(document.getElementById('analyticsRevExpChart'), {
          type: 'bar',
          data: {
            labels: analytics.revenueVsExpenses.map(r => r.month),
            datasets: [
              { label: 'Revenue (₹)', data: analytics.revenueVsExpenses.map(r => r.revenue), backgroundColor: '#0075de', borderRadius: 4 },
              { label: 'Expenses (₹)', data: analytics.revenueVsExpenses.map(r => r.expense), backgroundColor: '#ffb110', borderRadius: 4 }
            ]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: textColor } } } }
        });

        // 2. Pie Chart
        new Chart(document.getElementById('analyticsCatChart'), {
          type: 'pie',
          data: {
            labels: analytics.expenseByCategory.map(c => c.category),
            datasets: [{
              data: analytics.expenseByCategory.map(c => c.total),
              backgroundColor: ['#0075de', '#16a34a', '#ffb110', '#f64932', '#b18164', '#02093a', '#615d59']
            }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: textColor } } } }
        });

        // 3. Line Chart
        new Chart(document.getElementById('analyticsAttChart'), {
          type: 'line',
          data: {
            labels: analytics.attendanceTrend.map(a => a.date.slice(5)),
            datasets: [
              { label: 'Breakfast', data: analytics.attendanceTrend.map(a => a.breakfast), borderColor: '#16a34a', tension: 0.25 },
              { label: 'Lunch', data: analytics.attendanceTrend.map(a => a.lunch), borderColor: '#0075de', tension: 0.25 },
              { label: 'Dinner', data: analytics.attendanceTrend.map(a => a.dinner), borderColor: '#b18164', tension: 0.25 }
            ]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: textColor } } } }
        });

        // 4. Doughnut for Complaints
        new Chart(document.getElementById('analyticsComplaintChart'), {
          type: 'doughnut',
          data: {
            labels: analytics.complaintStatusDist.map(c => c.status),
            datasets: [{
              data: analytics.complaintStatusDist.map(c => c.count),
              backgroundColor: ['#0075de', '#ffb110', '#62aef0', '#16a34a', '#f64932']
            }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: textColor } } } }
        });
      }

      UI.renderIcons();
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-title">Error: ${err.message}</div></div>`;
    }
  },

  // --------------------------------------------------------------------------
  // SYSTEM SETTINGS VIEW
  // --------------------------------------------------------------------------
  async loadSettings() {
    const container = document.getElementById('viewContainer');
    container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Loading system settings...</div></div>';

    try {
      const data = await API.get('/api/settings');
      const s = data.settings || {};

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              <img src="assets/icons/settings.png" style="width: 22px; height: 22px;" alt="Settings">
              Mess Administration Settings
            </h2>
            <p style="font-size: 13px; color: var(--color-graphite);">Configure institution fees, daily serving hours, and contact helplines</p>
          </div>
        </div>

        <div class="card" style="max-width: 680px;">
          <div class="card-header">
            <div class="card-title">Institutional Parameters</div>
          </div>
          <div class="card-body">
            <form id="settingsForm">
              <div class="form-group">
                <label class="form-label">Facility / Mess Name</label>
                <input type="text" id="setMessName" class="form-input" value="${s.mess_name || 'IIIT Bhubaneswar Central Mess'}">
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div class="form-group">
                  <label class="form-label">Monthly Base Mess Fee (₹)</label>
                  <input type="number" id="setBaseRate" class="form-input" value="${s.monthly_base_charge || '3800'}" required>
                </div>

                <div class="form-group">
                  <label class="form-label">Approved Leave Rebate Rate / Day (₹)</label>
                  <input type="number" id="setRebateRate" class="form-input" value="${s.rebate_per_day || '90'}" required>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                <div class="form-group">
                  <label class="form-label">Breakfast Timings</label>
                  <input type="text" id="setBfTime" class="form-input" value="${s.breakfast_timing || '07:30 AM - 09:30 AM'}">
                </div>
                <div class="form-group">
                  <label class="form-label">Lunch Timings</label>
                  <input type="text" id="setLunchTime" class="form-input" value="${s.lunch_timing || '12:15 PM - 02:30 PM'}">
                </div>
                <div class="form-group">
                  <label class="form-label">Dinner Timings</label>
                  <input type="text" id="setDinnerTime" class="form-input" value="${s.dinner_timing || '07:45 PM - 09:45 PM'}">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div class="form-group">
                  <label class="form-label">Helpline Phone Number</label>
                  <input type="tel" id="setPhone" class="form-input" value="${s.contact_phone || '+91 674 2306600'}">
                </div>
                <div class="form-group">
                  <label class="form-label">Committee Support Email</label>
                  <input type="email" id="setEmail" class="form-input" value="${s.contact_email || 'mess-committee@iiit-bh.ac.in'}">
                </div>
              </div>

              <button type="submit" class="btn btn-primary btn-lg" style="margin-top: 10px;">
                Save System Settings
              </button>
            </form>
          </div>
        </div>
      `;

      document.getElementById('settingsForm').onsubmit = async (e) => {
        e.preventDefault();
        const settings = {
          mess_name: document.getElementById('setMessName').value.trim(),
          monthly_base_charge: document.getElementById('setBaseRate').value,
          rebate_per_day: document.getElementById('setRebateRate').value,
          breakfast_timing: document.getElementById('setBfTime').value.trim(),
          lunch_timing: document.getElementById('setLunchTime').value.trim(),
          dinner_timing: document.getElementById('setDinnerTime').value.trim(),
          contact_phone: document.getElementById('setPhone').value.trim(),
          contact_email: document.getElementById('setEmail').value.trim()
        };

        try {
          await API.put('/api/settings', { settings });
          UI.toast({ title: 'Saved', message: 'System configuration updated successfully.', type: 'success' });
        } catch (err) {
          UI.toast({ title: 'Error', message: err.message, type: 'error' });
        }
      };

      UI.renderIcons();
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-title">Error: ${err.message}</div></div>`;
    }
  }
};

window.Admin = Admin;
