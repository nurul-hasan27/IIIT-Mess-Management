/**
 * IIIT Bhubaneswar Mess Management System
 * Dashboard Module (Student, Admin, and Staff Dashboards)
 * Styled with Notion Design Reference & Thiings 3D Icons
 */

const Dashboard = {
  charts: {},

  async load() {
    const container = document.getElementById('viewContainer');
    container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Loading dashboard...</div></div>';

    const role = Auth.user?.role || 'student';

    try {
      if (role === 'admin') {
        await this.loadAdminDashboard(container);
      } else if (role === 'staff') {
        await this.loadStaffDashboard(container);
      } else {
        await this.loadStudentDashboard(container);
      }
    } catch (err) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"><img src="assets/icons/complaints.png" style="width: 48px; height: 48px;" alt="Error"></div>
          <div class="empty-state-title">Failed to load dashboard</div>
          <div class="empty-state-desc">${err.message}</div>
          <button class="btn btn-primary" onclick="Dashboard.load()">Try Again</button>
        </div>
      `;
    }
  },

  // --------------------------------------------------------------------------
  // STUDENT DASHBOARD
  // --------------------------------------------------------------------------
  async loadStudentDashboard(container) {
    const data = await API.get('/api/dashboard/student');
    const { stats, todayMenus, announcements, recentActivity } = data;
    const user = Auth.user;

    const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    let mealsHtml = '';
    if (todayMenus.length === 0) {
      mealsHtml = '<div class="empty-state" style="grid-column: 1 / -1;"><div class="empty-state-title">No meals scheduled for today yet.</div></div>';
    } else {
      mealsHtml = todayMenus.map(m => {
        const isAttended = m.attendance && m.attendance.status === 'present';
        const hasFeedback = !!m.user_feedback;

        const itemsList = m.items.map(item => `
          <li class="meal-item">
            <span class="diet-dot ${item.is_veg ? 'veg' : 'non-veg'}"></span>
            <span>${item.item_name}</span>
          </li>
        `).join('');

        return `
          <div class="meal-card">
            <div class="meal-card-header">
              <span class="meal-type-title">
                <img src="assets/icons/brand-bowl.png" class="meal-3d-thumb" alt="${m.meal_type}">
                ${m.meal_type.toUpperCase()}
                ${m.is_special ? '<span class="badge badge-warning" style="font-size: 10px;">Special Feast</span>' : ''}
              </span>
              <span class="meal-serving-time">🕒 ${m.serving_time}</span>
            </div>
            <div class="meal-card-body">
              <div class="meal-dish-name">${m.title}</div>
              <ul class="meal-items-list">
                ${itemsList}
              </ul>
            </div>
            <div class="meal-card-footer">
              <div>
                ${isAttended ? '<span class="badge badge-success">Attended</span>' : '<span class="badge badge-secondary">Not Marked</span>'}
              </div>
              <div>
                ${hasFeedback 
                  ? `<button class="btn btn-sm btn-outline" onclick="Feedback.openFeedbackModal('${m.meal_type}', '${m.date}', ${JSON.stringify(m.user_feedback).replace(/"/g, '&quot;')})">⭐ Rated (${m.user_feedback.overall_rating}/5)</button>`
                  : `<button class="btn btn-sm btn-primary" onclick="Feedback.openFeedbackModal('${m.meal_type}', '${m.date}')">Rate Meal</button>`
                }
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    const announcementsHtml = announcements.length === 0
      ? '<div style="font-size: 13px; color: var(--color-graphite); padding: 12px 0;">No active announcements at this time.</div>'
      : announcements.map(a => `
        <div class="announcement-card ${a.priority === 'High' ? 'high-priority' : ''}">
          <div class="announcement-header">
            <span class="announcement-title">${a.title}</span>
            <span class="badge ${a.priority === 'High' ? 'badge-danger' : (a.priority === 'Medium' ? 'badge-warning' : 'badge-info')}">${a.priority}</span>
          </div>
          <div class="announcement-desc">${a.description}</div>
          <div class="announcement-meta">
            <span>📅 Published: ${UI.formatDate(a.publish_date)}</span>
            <span>✍️ By: ${a.author_name || 'Mess Office'}</span>
          </div>
        </div>
      `).join('');

    const recentPaymentsHtml = recentActivity.payments.length === 0
      ? '<div style="font-size: 12.5px; color: var(--color-graphite);">No recent payments recorded.</div>'
      : recentActivity.payments.map(p => `
        <div class="activity-item">
          <div class="activity-badge">
            <img src="assets/icons/payments.png" style="width: 20px; height: 20px; object-fit: contain;" alt="Payment">
          </div>
          <div class="activity-details">
            <div class="activity-title">${UI.formatCurrency(p.amount)} paid via ${p.payment_method}</div>
            <div class="activity-time">Receipt: ${p.receipt_number} • ${UI.formatDate(p.payment_date)}</div>
          </div>
        </div>
      `).join('');

    const recentComplaintsHtml = recentActivity.complaints.length === 0
      ? '<div style="font-size: 12.5px; color: var(--color-graphite);">No active grievances filed.</div>'
      : recentActivity.complaints.map(c => `
        <div class="activity-item">
          <div class="activity-badge">
            <img src="assets/icons/complaints.png" style="width: 20px; height: 20px; object-fit: contain;" alt="Complaint">
          </div>
          <div class="activity-details">
            <div class="activity-title">${c.subject}</div>
            <div class="activity-time">${c.ticket_number} • Status: <span class="badge badge-warning" style="font-size: 10px;">${c.status}</span></div>
          </div>
        </div>
      `).join('');

    container.innerHTML = `
      <!-- Welcome Section -->
      <div class="welcome-banner">
        <div class="highlight-pill">
          <img src="assets/icons/brand-bowl.png" style="width: 14px; height: 14px; object-fit: contain;" alt="Bowl">
          Student Dining Portal
        </div>
        <div class="welcome-greeting">Hello, ${user.full_name}! 👋</div>
        <div class="welcome-subtext">
          Today is ${todayStr}. Welcome to your centralized dining dashboard.
          ${user.hostel_room ? `Room: <strong>${user.hostel_room}</strong> • ` : ''} Roll: <strong>${user.student_id}</strong>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions-bar">
        <button class="btn btn-secondary" onclick="Nav.navigate('#menu-today')">
          <img src="assets/icons/menu-today.png" style="width: 16px; height: 16px; margin-right: 6px; vertical-align: middle;">
          Today's Menu
        </button>
        <button class="btn btn-secondary" onclick="Nav.navigate('#menu-weekly')">
          <img src="assets/icons/menu-weekly.png" style="width: 16px; height: 16px; margin-right: 6px; vertical-align: middle;">
          Weekly Menu
        </button>
        <button class="btn btn-secondary" onclick="Nav.navigate('#feedback')">
          <img src="assets/icons/feedback.png" style="width: 16px; height: 16px; margin-right: 6px; vertical-align: middle;">
          Rate Mess Food
        </button>
        <button class="btn btn-secondary" onclick="Complaints.openCreateModal()">
          <img src="assets/icons/complaints.png" style="width: 16px; height: 16px; margin-right: 6px; vertical-align: middle;">
          Raise a Grievance
        </button>
        <button class="btn btn-primary" onclick="Billing.openPaymentModal()">
          <img src="assets/icons/wallet.png" style="width: 16px; height: 16px; margin-right: 6px; vertical-align: middle; filter: brightness(0) invert(1);">
          Pay Mess Dues
        </button>
      </div>

      <!-- Statistics Cards (Real DB) -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon-wrapper sky">
            <img src="assets/icons/bills.png" class="stat-3d-icon" alt="Bills">
          </div>
          <div class="stat-info">
            <div class="stat-label">Current Month Bill</div>
            <div class="stat-value">${UI.formatCurrency(stats.currentMonthBill)}</div>
            <div class="stat-subtext">Status: <strong>${stats.currentBillStatus}</strong></div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper ${stats.outstandingDues > 0 ? 'rose' : 'green'}">
            <img src="assets/icons/wallet.png" class="stat-3d-icon" alt="Outstanding Dues">
          </div>
          <div class="stat-info">
            <div class="stat-label">Outstanding Dues</div>
            <div class="stat-value" style="color: ${stats.outstandingDues > 0 ? 'var(--danger)' : 'var(--success)'};">
              ${UI.formatCurrency(stats.outstandingDues)}
            </div>
            <div class="stat-subtext">${stats.outstandingDues > 0 ? 'Payment required' : 'All clear!'}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper green">
            <img src="assets/icons/attendance.png" class="stat-3d-icon" alt="Attendance">
          </div>
          <div class="stat-info">
            <div class="stat-label">Meals Attended</div>
            <div class="stat-value">${stats.mealsAttendedMonth}</div>
            <div class="stat-subtext">Current billing cycle</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper amber">
            <img src="assets/icons/complaints.png" class="stat-3d-icon" alt="Complaints">
          </div>
          <div class="stat-info">
            <div class="stat-label">Pending Complaints</div>
            <div class="stat-value">${stats.pendingComplaints}</div>
            <div class="stat-subtext">In-progress tickets</div>
          </div>
        </div>
      </div>

      <!-- Today's Menu Section -->
      <div style="margin-bottom: 28px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 17px; font-weight: 700; color: var(--color-ink-black); letter-spacing: -0.015em; display: flex; align-items: center; gap: 8px;">
              <img src="assets/icons/menu-today.png" style="width: 20px; height: 20px;" alt="Menu">
              Today's Dining Menu
            </h3>
            <p style="font-size: 12.5px; color: var(--color-graphite); margin-top: 2px;">Breakfast, lunch, and dinner options prepared fresh in IIIT Mess</p>
          </div>
          <button class="btn btn-sm btn-outline" onclick="Nav.navigate('#menu-weekly')">View 7-Day Menu →</button>
        </div>

        <div class="meals-grid">
          ${mealsHtml}
        </div>
      </div>

      <!-- Bottom Split: Announcements & Activity -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px;">
        <div class="card">
          <div class="card-header">
            <div class="card-title" style="display: flex; align-items: center; gap: 8px;">
              <img src="assets/icons/announcements.png" style="width: 18px; height: 18px;" alt="Announcements">
              Latest Announcements
            </div>
            <button class="btn btn-sm btn-outline" onclick="Nav.navigate('#announcements')">All Circulars</button>
          </div>
          <div class="card-body">
            ${announcementsHtml}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title" style="display: flex; align-items: center; gap: 8px;">
              <img src="assets/icons/dashboard.png" style="width: 18px; height: 18px;" alt="Activity">
              Recent Activity
            </div>
          </div>
          <div class="card-body">
            <h4 style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-stone); margin-bottom: 12px;">Recent Payments</h4>
            <div class="activity-timeline" style="margin-bottom: 20px;">
              ${recentPaymentsHtml}
            </div>

            <h4 style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-stone); margin-bottom: 12px;">Recent Tickets</h4>
            <div class="activity-timeline">
              ${recentComplaintsHtml}
            </div>
          </div>
        </div>
      </div>
    `;

    UI.renderIcons();
  },

  // --------------------------------------------------------------------------
  // ADMIN DASHBOARD
  // --------------------------------------------------------------------------
  async loadAdminDashboard(container) {
    const data = await API.get('/api/dashboard/admin');
    const { stats, analytics, recentActivity } = data;

    container.innerHTML = `
      <!-- Welcome Header -->
      <div class="welcome-banner">
        <div class="highlight-pill">
          <img src="assets/icons/shield.png" style="width: 14px; height: 14px; object-fit: contain;" alt="Admin Shield">
          Administration Console
        </div>
        <div class="welcome-greeting">Administrator Control Center 🛡️</div>
        <div class="welcome-subtext">
          IIIT Bhubaneswar Central Mess Operations & Financial Management. All metrics computed live from SQLite database.
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions-bar">
        <button class="btn btn-secondary" onclick="Admin.openAddStudentModal()">
          <img src="assets/icons/students.png" style="width: 16px; height: 16px; margin-right: 6px; vertical-align: middle;">
          Add Student
        </button>
        <button class="btn btn-secondary" onclick="Menu.openCreateModal()">
          <img src="assets/icons/menu-today.png" style="width: 16px; height: 16px; margin-right: 6px; vertical-align: middle;">
          Add Daily Menu
        </button>
        <button class="btn btn-secondary" onclick="Billing.openGenerateModal()">
          <img src="assets/icons/bills.png" style="width: 16px; height: 16px; margin-right: 6px; vertical-align: middle;">
          Generate Bills
        </button>
        <button class="btn btn-secondary" onclick="Announcements.openCreateModal()">
          <img src="assets/icons/announcements.png" style="width: 16px; height: 16px; margin-right: 6px; vertical-align: middle;">
          Publish Announcement
        </button>
        <button class="btn btn-secondary" onclick="Expenses.openCreateModal()">
          <img src="assets/icons/expenses.png" style="width: 16px; height: 16px; margin-right: 6px; vertical-align: middle;">
          Record Expense
        </button>
        <button class="btn btn-primary" onclick="Billing.exportCSV()">
          <img src="assets/icons/analytics.png" style="width: 16px; height: 16px; margin-right: 6px; vertical-align: middle; filter: brightness(0) invert(1);">
          Export Billing CSV
        </button>
      </div>

      <!-- Overview Statistics Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon-wrapper blue">
            <img src="assets/icons/students.png" class="stat-3d-icon" alt="Students">
          </div>
          <div class="stat-info">
            <div class="stat-label">Registered Students</div>
            <div class="stat-value">${stats.totalStudents}</div>
            <div class="stat-subtext">Active mess residents</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper green">
            <img src="assets/icons/attendance.png" class="stat-3d-icon" alt="Meals Served">
          </div>
          <div class="stat-info">
            <div class="stat-label">Meals Served (Month)</div>
            <div class="stat-value">${stats.mealsServedThisMonth}</div>
            <div class="stat-subtext">Verified meal attendances</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper sky">
            <img src="assets/icons/payments.png" class="stat-3d-icon" alt="Revenue">
          </div>
          <div class="stat-info">
            <div class="stat-label">Monthly Revenue</div>
            <div class="stat-value">${UI.formatCurrency(stats.monthlyRevenue)}</div>
            <div class="stat-subtext">Fees collected this month</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper amber">
            <img src="assets/icons/expenses.png" class="stat-3d-icon" alt="Expenses">
          </div>
          <div class="stat-info">
            <div class="stat-label">Monthly Expenses</div>
            <div class="stat-value">${UI.formatCurrency(stats.monthlyExpenses)}</div>
            <div class="stat-subtext">Groceries & catering costs</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper rose">
            <img src="assets/icons/complaints.png" class="stat-3d-icon" alt="Complaints">
          </div>
          <div class="stat-info">
            <div class="stat-label">Pending Complaints</div>
            <div class="stat-value">${stats.pendingComplaints}</div>
            <div class="stat-subtext">Awaiting resolution</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper rose">
            <img src="assets/icons/wallet.png" class="stat-3d-icon" alt="Outstanding Dues">
          </div>
          <div class="stat-info">
            <div class="stat-label">Outstanding Dues</div>
            <div class="stat-value" style="color: var(--danger);">${UI.formatCurrency(stats.outstandingPayments)}</div>
            <div class="stat-subtext">Unpaid student dues</div>
          </div>
        </div>
      </div>

      <!-- Chart.js Analytics Grid -->
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title" style="display: flex; align-items: center; gap: 8px;">
              <img src="assets/icons/analytics.png" style="width: 18px; height: 18px;" alt="Chart">
              Revenue vs Expenses Trend (Last 6 Months)
            </div>
          </div>
          <div class="chart-container">
            <canvas id="revExpChart"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title" style="display: flex; align-items: center; gap: 8px;">
              <img src="assets/icons/expenses.png" style="width: 18px; height: 18px;" alt="Expenses">
              Current Month Expense Breakdown
            </div>
          </div>
          <div class="chart-container">
            <canvas id="expenseCategoryChart"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title" style="display: flex; align-items: center; gap: 8px;">
              <img src="assets/icons/attendance.png" style="width: 18px; height: 18px;" alt="Attendance">
              Meal Attendance by Session (Past 7 Days)
            </div>
          </div>
          <div class="chart-container">
            <canvas id="attendanceTrendChart"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title" style="display: flex; align-items: center; gap: 8px;">
              <img src="assets/icons/feedback.png" style="width: 18px; height: 18px;" alt="Feedback">
              Student Food & Hygiene Quality Ratings
            </div>
          </div>
          <div class="chart-container">
            <canvas id="feedbackChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Recent System Activity -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
        <div class="card">
          <div class="card-header">
            <div class="card-title" style="display: flex; align-items: center; gap: 8px;">
              <img src="assets/icons/payments.png" style="width: 18px; height: 18px;" alt="Payments">
              Recent Payments
            </div>
            <button class="btn btn-sm btn-outline" onclick="Nav.navigate('#admin-billing')">All Bills</button>
          </div>
          <div class="card-body">
            <div class="activity-timeline">
              ${recentActivity.payments.map(p => `
                <div class="activity-item">
                  <div class="activity-badge">
                    <img src="assets/icons/payments.png" style="width: 18px; height: 18px; object-fit: contain;" alt="Payment">
                  </div>
                  <div class="activity-details">
                    <div class="activity-title">${UI.formatCurrency(p.amount)} from ${p.student_name} (${p.student_roll})</div>
                    <div class="activity-time">${p.receipt_number} • ${UI.formatDate(p.payment_date)} • ${p.payment_method}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title" style="display: flex; align-items: center; gap: 8px;">
              <img src="assets/icons/complaints.png" style="width: 18px; height: 18px;" alt="Complaints">
              Recent Complaints
            </div>
            <button class="btn btn-sm btn-outline" onclick="Nav.navigate('#admin-complaints')">Manage</button>
          </div>
          <div class="card-body">
            <div class="activity-timeline">
              ${recentActivity.complaints.map(c => `
                <div class="activity-item">
                  <div class="activity-badge">
                    <img src="assets/icons/complaints.png" style="width: 18px; height: 18px; object-fit: contain;" alt="Complaint">
                  </div>
                  <div class="activity-details">
                    <div class="activity-title">${c.subject}</div>
                    <div class="activity-time">By: ${c.student_name} • <span class="badge ${c.status === 'Resolved' ? 'badge-success' : 'badge-warning'}">${c.status}</span></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // Render Chart.js charts
    this.renderAdminCharts(analytics);
    UI.renderIcons();
  },

  renderAdminCharts(analytics) {
    if (!window.Chart) return;

    // Destroy prior chart instances to prevent canvas reuse memory leaks
    Object.keys(this.charts).forEach(key => {
      if (this.charts[key]) this.charts[key].destroy();
    });

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94A3B8' : '#615d59';
    const gridColor = isDark ? '#232D3F' : 'rgba(0,0,0,0.06)';

    // 1. Revenue vs Expenses Chart
    const revExpCtx = document.getElementById('revExpChart')?.getContext('2d');
    if (revExpCtx) {
      this.charts.revExp = new Chart(revExpCtx, {
        type: 'bar',
        data: {
          labels: analytics.revenueVsExpenses.map(r => r.month),
          datasets: [
            {
              label: 'Mess Revenue (₹)',
              data: analytics.revenueVsExpenses.map(r => r.revenue),
              backgroundColor: '#0075de',
              borderRadius: 4
            },
            {
              label: 'Mess Expenses (₹)',
              data: analytics.revenueVsExpenses.map(r => r.expense),
              backgroundColor: '#ffb110',
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: textColor } }
          },
          scales: {
            x: { ticks: { color: textColor }, grid: { display: false } },
            y: { ticks: { color: textColor }, grid: { color: gridColor } }
          }
        }
      });
    }

    // 2. Expense Category Breakdown (Doughnut)
    const expCatCtx = document.getElementById('expenseCategoryChart')?.getContext('2d');
    if (expCatCtx && analytics.expenseByCategory.length > 0) {
      this.charts.expCat = new Chart(expCatCtx, {
        type: 'doughnut',
        data: {
          labels: analytics.expenseByCategory.map(c => c.category),
          datasets: [{
            data: analytics.expenseByCategory.map(c => c.total),
            backgroundColor: [
              '#0075de', '#16a34a', '#ffb110', '#f64932', '#b18164', '#02093a', '#615d59'
            ],
            borderWidth: 2,
            borderColor: isDark ? '#141B26' : '#FFFFFF'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: textColor } }
          }
        }
      });
    }

    // 3. Attendance Trend (Line)
    const attCtx = document.getElementById('attendanceTrendChart')?.getContext('2d');
    if (attCtx) {
      this.charts.attTrend = new Chart(attCtx, {
        type: 'line',
        data: {
          labels: analytics.attendanceTrend.map(a => a.date.slice(5)),
          datasets: [
            {
              label: 'Breakfast',
              data: analytics.attendanceTrend.map(a => a.breakfast),
              borderColor: '#16a34a',
              backgroundColor: 'rgba(22, 163, 74, 0.08)',
              tension: 0.25,
              fill: true
            },
            {
              label: 'Lunch',
              data: analytics.attendanceTrend.map(a => a.lunch),
              borderColor: '#0075de',
              backgroundColor: 'rgba(0, 117, 222, 0.08)',
              tension: 0.25,
              fill: true
            },
            {
              label: 'Dinner',
              data: analytics.attendanceTrend.map(a => a.dinner),
              borderColor: '#b18164',
              backgroundColor: 'rgba(177, 129, 100, 0.08)',
              tension: 0.25,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: textColor } }
          },
          scales: {
            x: { ticks: { color: textColor }, grid: { display: false } },
            y: { ticks: { color: textColor }, grid: { color: gridColor } }
          }
        }
      });
    }

    // 4. Feedback Quality Ratings (Bar)
    const fbCtx = document.getElementById('feedbackChart')?.getContext('2d');
    if (fbCtx && analytics.feedbackAverages) {
      const fb = analytics.feedbackAverages;
      this.charts.feedback = new Chart(fbCtx, {
        type: 'bar',
        data: {
          labels: ['Food Quality', 'Taste', 'Hygiene', 'Quantity', 'Overall'],
          datasets: [{
            label: 'Average Score (out of 5.0)',
            data: [fb.food_quality || 0, fb.taste || 0, fb.hygiene || 0, fb.quantity || 0, fb.overall || 0],
            backgroundColor: ['#0075de', '#16a34a', '#ffb110', '#62aef0', '#f64932'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { ticks: { color: textColor }, grid: { display: false } },
            y: { min: 0, max: 5, ticks: { color: textColor }, grid: { color: gridColor } }
          }
        }
      });
    }
  },

  // --------------------------------------------------------------------------
  // STAFF DASHBOARD
  // --------------------------------------------------------------------------
  async loadStaffDashboard(container) {
    const data = await API.get('/api/dashboard/staff');
    const { today, totalStudents, todayMenus, assignedComplaints } = data;

    const mealsHtml = todayMenus.map(m => `
      <div class="meal-card">
        <div class="meal-card-header">
          <span class="meal-type-title">
            <img src="assets/icons/brand-bowl.png" class="meal-3d-thumb" alt="${m.meal_type}">
            ${m.meal_type.toUpperCase()}
          </span>
          <span class="meal-serving-time">🕒 ${m.serving_time}</span>
        </div>
        <div class="meal-card-body">
          <div class="meal-dish-name">${m.title}</div>
          <div style="font-size: 13px; color: var(--color-graphite); margin-bottom: 12px;">
            <strong>Items:</strong> ${m.items.map(it => it.item_name).join(', ')}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--color-paper-warmth); border-radius: 8px;">
            <span style="font-size: 12px; font-weight: 600;">Attendance Count:</span>
            <span class="badge badge-success" style="font-size: 13px;">${m.presentCount} / ${totalStudents} Present</span>
          </div>
        </div>
        <div class="meal-card-footer">
          <button class="btn btn-sm btn-primary btn-block" onclick="Attendance.loadAdmin('${today}', '${m.meal_type}')">
            Mark / Update Counter Attendance
          </button>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="welcome-banner">
        <div class="highlight-pill">
          <img src="assets/icons/staff.png" style="width: 14px; height: 14px; object-fit: contain;" alt="Staff">
          Catering & Kitchen Operations
        </div>
        <div class="welcome-greeting">Mess Catering Operations 👨‍🍳</div>
        <div class="welcome-subtext">
          Daily serving schedules, meal attendance rosters & dining hall grievance maintenance.
        </div>
      </div>

      <div class="quick-actions-bar">
        <button class="btn btn-primary" onclick="Attendance.loadAdmin()">
          <img src="assets/icons/attendance.png" style="width: 16px; height: 16px; margin-right: 6px; vertical-align: middle; filter: brightness(0) invert(1);">
          Live Meal Attendance
        </button>
        <button class="btn btn-secondary" onclick="Nav.navigate('#menu-today')">
          <img src="assets/icons/menu-today.png" style="width: 16px; height: 16px; margin-right: 6px; vertical-align: middle;">
          Today's Kitchen Menu
        </button>
      </div>

      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 17px; font-weight: 700; color: var(--color-ink-black); margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
          <img src="assets/icons/menu-today.png" style="width: 20px; height: 20px;" alt="Menu">
          Today's Meal Schedules (${UI.formatDate(today)})
        </h3>
        <div class="meals-grid">
          ${mealsHtml}
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title" style="display: flex; align-items: center; gap: 8px;">
            <img src="assets/icons/complaints.png" style="width: 18px; height: 18px;" alt="Complaints">
            Assigned Grievance Tickets
          </div>
        </div>
        <div class="card-body">
          ${assignedComplaints.length === 0 
            ? '<div class="empty-state"><div class="empty-state-title">No pending complaints assigned.</div></div>'
            : `<div class="table-container">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Ticket #</th>
                      <th>Category</th>
                      <th>Student</th>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${assignedComplaints.map(c => `
                      <tr>
                        <td><strong>${c.ticket_number}</strong></td>
                        <td>${c.category}</td>
                        <td>${c.student_name} (${c.hostel_room || 'Hostel'})</td>
                        <td>${c.subject}</td>
                        <td><span class="badge badge-warning">${c.status}</span></td>
                        <td>
                          <button class="btn btn-sm btn-outline" onclick="Complaints.openResolutionModal(${c.id})">Update Status</button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>`
          }
        </div>
      </div>
    `;

    UI.renderIcons();
  }
};

window.Dashboard = Dashboard;
