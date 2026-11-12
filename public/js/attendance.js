/**
 * IIIT Bhubaneswar Mess Management System
 * Meal Attendance Module (Student View & Staff/Admin Rosters)
 */

const Attendance = {
  // --------------------------------------------------------------------------
  // STUDENT ATTENDANCE HISTORY
  // --------------------------------------------------------------------------
  async loadStudent(month = '') {
    const container = document.getElementById('viewContainer');
    container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Loading your attendance records...</div></div>';

    const currMonth = month || new Date().toISOString().slice(0, 7);

    try {
      const data = await API.get('/api/attendance', { month: currMonth });
      const { records, summary } = data;

      const totalMeals = summary?.total_meals || 0;
      const presentCount = summary?.present_count || 0;
      const attRate = totalMeals > 0 ? Math.round((presentCount / totalMeals) * 100) : 0;

      const tableRowsHtml = records.length === 0
        ? '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 24px;">No meal records for this month.</td></tr>'
        : records.map(r => `
          <tr>
            <td><strong>${UI.formatDate(r.date)}</strong></td>
            <td style="text-transform: capitalize;">${r.meal_type}</td>
            <td>
              <span class="badge ${r.status === 'present' ? 'badge-success' : 'badge-danger'}">
                ${r.status === 'present' ? '✓ Present' : '✕ Absent'}
              </span>
            </td>
            <td>${UI.formatTime(r.marked_at)}</td>
            <td style="font-size: 12px; color: var(--text-secondary);">${r.marker_name || 'Mess Desk'}</td>
          </tr>
        `).join('');

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 700;">Personal Meal Attendance</h2>
            <p style="font-size: 13px; color: var(--text-secondary);">Verified dining hall entry logs & attendance percentages</p>
          </div>
          <div>
            <input type="month" class="form-input" style="width: auto;" value="${currMonth}" onchange="Attendance.loadStudent(this.value)">
          </div>
        </div>

        <!-- Attendance Metrics -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon-wrapper blue">
              <img src="assets/icons/attendance.png" class="stat-3d-icon" alt="Meals Logged">
            </div>
            <div class="stat-info">
              <div class="stat-label">Meals Logged</div>
              <div class="stat-value">${totalMeals}</div>
              <div class="stat-subtext">Total recorded sessions</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper green">
              <img src="assets/icons/brand-bowl.png" class="stat-3d-icon" alt="Present Count">
            </div>
            <div class="stat-info">
              <div class="stat-label">Present Count</div>
              <div class="stat-value">${presentCount}</div>
              <div class="stat-subtext">Meals attended</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper sky">
              <img src="assets/icons/analytics.png" class="stat-3d-icon" alt="Attendance Rate">
            </div>
            <div class="stat-info">
              <div class="stat-label">Attendance Rate</div>
              <div class="stat-value">${attRate}%</div>
              <div class="stat-subtext">Session participation</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper amber">
              <img src="assets/icons/menu-today.png" class="stat-3d-icon" alt="Session Split">
            </div>
            <div class="stat-info">
              <div class="stat-label">Session Split</div>
              <div style="font-size: 12px; color: var(--color-ink-black); margin-top: 4px;">
                B: <strong>${summary?.breakfast_present || 0}</strong> • 
                L: <strong>${summary?.lunch_present || 0}</strong> • 
                D: <strong>${summary?.dinner_present || 0}</strong>
              </div>
              <div class="stat-subtext">Meals attended</div>
            </div>
          </div>
        </div>

        <!-- Attendance Records Table -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Daily Attendance Logs</div>
          </div>
          <div class="card-body" style="padding: 0;">
            <div class="table-container" style="border: none;">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Meal Session</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                    <th>Verified By</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRowsHtml}
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

  // --------------------------------------------------------------------------
  // ADMIN & STAFF ATTENDANCE ROSTER
  // --------------------------------------------------------------------------
  async loadAdmin(selectedDate = '', selectedMeal = 'breakfast') {
    const container = document.getElementById('viewContainer');
    container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Loading dining attendance roster...</div></div>';

    const targetDate = selectedDate || new Date().toISOString().slice(0, 10);
    const targetMeal = selectedMeal;

    try {
      const data = await API.get('/api/attendance', { date: targetDate, meal_type: targetMeal });
      const { date, meal_type, stats, roster } = data;

      const attPercent = stats.total_students > 0 ? Math.round((stats.present_count / stats.total_students) * 100) : 0;

      const rowsHtml = roster.map(r => {
        const isPres = r.status === 'present';
        return `
          <tr id="roster-row-${r.student_id}">
            <td><strong>${r.roll_number}</strong></td>
            <td>${r.full_name}</td>
            <td>${r.department || '—'}</td>
            <td>${r.hostel_room || '—'}</td>
            <td>
              <span id="badge-status-${r.student_id}" class="badge ${isPres ? 'badge-success' : 'badge-danger'}">
                ${isPres ? '✓ Present' : '✕ Absent'}
              </span>
            </td>
            <td>
              <button 
                id="btn-toggle-${r.student_id}"
                class="btn btn-sm ${isPres ? 'btn-outline' : 'btn-primary'}" 
                onclick="Attendance.toggleStudentStatus(${r.student_id}, '${date}', '${meal_type}', '${isPres ? 'absent' : 'present'}')">
                ${isPres ? 'Mark Absent' : 'Mark Present'}
              </button>
            </td>
          </tr>
        `;
      }).join('');

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 700;">Meal Attendance Management</h2>
            <p style="font-size: 13px; color: var(--text-secondary);">Dining counter check-in & student attendance registers</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" onclick="Attendance.markAll('${date}', '${meal_type}', 'present')">Mark All Present</button>
            <button class="btn btn-outline" onclick="Attendance.markAll('${date}', '${meal_type}', 'absent')">Reset All</button>
          </div>
        </div>

        <!-- Filter / Session Selection Bar -->
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-body" style="padding: 16px 20px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
            <div>
              <label class="form-label" style="margin-bottom: 4px; font-size: 12px;">Date:</label>
              <input type="date" id="rosterDateInput" class="form-input" style="width: auto;" value="${date}">
            </div>
            <div>
              <label class="form-label" style="margin-bottom: 4px; font-size: 12px;">Meal Session:</label>
              <select id="rosterMealInput" class="form-select" style="width: auto;">
                <option value="breakfast" ${meal_type === 'breakfast' ? 'selected' : ''}>Breakfast</option>
                <option value="lunch" ${meal_type === 'lunch' ? 'selected' : ''}>Lunch</option>
                <option value="dinner" ${meal_type === 'dinner' ? 'selected' : ''}>Dinner</option>
              </select>
            </div>
            <button class="btn btn-primary" style="margin-top: 20px;" onclick="Attendance.loadAdmin(document.getElementById('rosterDateInput').value, document.getElementById('rosterMealInput').value)">
              Load Roster
            </button>
          </div>
        </div>

        <!-- Roster Summary Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon-wrapper blue">
              <img src="assets/icons/students.png" class="stat-3d-icon" alt="Students">
            </div>
            <div class="stat-info">
              <div class="stat-label">Enrolled Students</div>
              <div class="stat-value">${stats.total_students}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper green">
              <img src="assets/icons/attendance.png" class="stat-3d-icon" alt="Present">
            </div>
            <div class="stat-info">
              <div class="stat-label">Present</div>
              <div class="stat-value">${stats.present_count}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper rose">
              <img src="assets/icons/complaints.png" class="stat-3d-icon" alt="Absent">
            </div>
            <div class="stat-info">
              <div class="stat-label">Absent</div>
              <div class="stat-value">${stats.absent_count}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper sky">
              <img src="assets/icons/analytics.png" class="stat-3d-icon" alt="Turnout">
            </div>
            <div class="stat-info">
              <div class="stat-label">Turnout Rate</div>
              <div class="stat-value">${attPercent}%</div>
            </div>
          </div>
        </div>

        <!-- Roster Table -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Student Attendance Roster (${meal_type.toUpperCase()} - ${UI.formatDate(date)})</div>
          </div>
          <div class="card-body" style="padding: 0;">
            <div class="table-container" style="border: none;">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Full Name</th>
                    <th>Branch</th>
                    <th>Room</th>
                    <th>Status</th>
                    <th>Action</th>
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

  async toggleStudentStatus(studentId, date, meal_type, newStatus) {
    try {
      await API.post('/api/attendance', {
        student_id: studentId,
        date,
        meal_type,
        status: newStatus
      });

      // Update UI row dynamically without reloading page
      const badge = document.getElementById(`badge-status-${studentId}`);
      const btn = document.getElementById(`btn-toggle-${studentId}`);

      if (badge && btn) {
        const isPres = newStatus === 'present';
        badge.className = `badge ${isPres ? 'badge-success' : 'badge-danger'}`;
        badge.textContent = isPres ? '✓ Present' : '✕ Absent';

        btn.className = `btn btn-sm ${isPres ? 'btn-outline' : 'btn-primary'}`;
        btn.textContent = isPres ? 'Mark Absent' : 'Mark Present';
        btn.setAttribute('onclick', `Attendance.toggleStudentStatus(${studentId}, '${date}', '${meal_type}', '${isPres ? 'absent' : 'present'}')`);
      }

      UI.toast({ title: 'Saved', message: `Attendance marked ${newStatus}.`, type: 'info', duration: 1500 });
    } catch (err) {
      UI.toast({ title: 'Error', message: err.message, type: 'error' });
    }
  },

  async markAll(date, meal_type, targetStatus) {
    try {
      // Find all student rows
      const rows = document.querySelectorAll('[id^="roster-row-"]');
      const attendance_list = Array.from(rows).map(row => {
        const student_id = parseInt(row.id.replace('roster-row-', ''), 10);
        return { student_id, status: targetStatus };
      });

      await API.post('/api/attendance', {
        date,
        meal_type,
        attendance_list
      });

      UI.toast({ title: 'Batch Updated', message: `Marked all students ${targetStatus}.`, type: 'success' });
      Attendance.loadAdmin(date, meal_type);
    } catch (err) {
      UI.toast({ title: 'Error', message: err.message, type: 'error' });
    }
  }
};

window.Attendance = Attendance;
