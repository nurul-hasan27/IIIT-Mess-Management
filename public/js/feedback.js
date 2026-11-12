/**
 * IIIT Bhubaneswar Mess Management System
 * Feedback & Quality Rating Module
 */

const Feedback = {
  async load() {
    const container = document.getElementById('viewContainer');
    container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Loading feedback history...</div></div>';

    try {
      const [listData, summaryData] = await Promise.all([
        API.get('/api/feedback'),
        API.get('/api/feedback/summary')
      ]);

      const feedback = listData.feedback || [];
      const summary = summaryData.summary || {};
      const mealAvgs = summaryData.mealAverages || [];

      const rowsHtml = feedback.length === 0
        ? '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 24px;">No feedback entries recorded.</td></tr>'
        : feedback.map(f => `
          <tr>
            <td><strong>${UI.formatDate(f.date)}</strong></td>
            <td style="text-transform: capitalize;">${f.meal_type}</td>
            ${Auth.user?.role !== 'student' ? `<td>${f.student_name} (${f.student_roll})</td>` : ''}
            <td>
              <span class="badge badge-warning" style="font-size: 12px; font-weight: 700;">
                ★ ${f.overall_rating}.0 / 5
              </span>
            </td>
            <td>
              <div style="font-size: 11px; color: var(--text-secondary);">
                Quality: ${f.food_quality_rating} • Taste: ${f.taste_rating} • Hygiene: ${f.hygiene_rating} • Qty: ${f.quantity_rating}
              </div>
            </td>
            <td style="max-width: 240px; font-size: 12px; color: var(--text-secondary);">
              ${f.comments ? `"${f.comments}"` : '—'}
            </td>
            <td>
              ${Auth.user?.role === 'student' ? `
                <button class="btn btn-sm btn-outline" onclick="Feedback.openFeedbackModal('${f.meal_type}', '${f.date}', ${JSON.stringify(f).replace(/"/g, '&quot;')})">Edit</button>
              ` : ''}
            </td>
          </tr>
        `).join('');

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              <img src="assets/icons/feedback.png" style="width: 22px; height: 22px;" alt="Feedback">
              Mess Feedback & Quality Ratings
            </h2>
            <p style="font-size: 13px; color: var(--color-graphite);">Food standards, hygiene satisfaction & dining ratings</p>
          </div>
          <div>
            <button class="btn btn-primary" onclick="Feedback.openFeedbackModal('lunch')">⭐ Submit Daily Feedback</button>
          </div>
        </div>

        <!-- Rating Summary Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon-wrapper amber">
              <img src="assets/icons/feedback.png" class="stat-3d-icon" alt="Overall">
            </div>
            <div class="stat-info">
              <div class="stat-label">Overall Rating</div>
              <div class="stat-value">${summary.avg_overall || '—'} / 5.0</div>
              <div class="stat-subtext">${summary.total_feedback_count || 0} reviews</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper blue">
              <img src="assets/icons/brand-bowl.png" class="stat-3d-icon" alt="Quality">
            </div>
            <div class="stat-info">
              <div class="stat-label">Food Quality</div>
              <div class="stat-value">${summary.avg_food_quality || '—'} / 5.0</div>
              <div class="stat-subtext">Texture & freshness</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper green">
              <img src="assets/icons/menu-today.png" class="stat-3d-icon" alt="Taste">
            </div>
            <div class="stat-info">
              <div class="stat-label">Taste & Flavor</div>
              <div class="stat-value">${summary.avg_taste || '—'} / 5.0</div>
              <div class="stat-subtext">Seasoning & flavor</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper sky">
              <img src="assets/icons/shield.png" class="stat-3d-icon" alt="Hygiene">
            </div>
            <div class="stat-info">
              <div class="stat-label">Hygiene & Cleanliness</div>
              <div class="stat-value">${summary.avg_hygiene || '—'} / 5.0</div>
              <div class="stat-subtext">Mess hall & utensils</div>
            </div>
          </div>
        </div>

        <!-- Feedback Records Table -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Feedback & Quality Submissions</div>
          </div>
          <div class="card-body" style="padding: 0;">
            <div class="table-container" style="border: none;">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Meal Session</th>
                    ${Auth.user?.role !== 'student' ? '<th>Student</th>' : ''}
                    <th>Rating</th>
                    <th>Sub-scores</th>
                    <th>Comments</th>
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

  openFeedbackModal(defaultMeal = 'lunch', defaultDate = '', existingFeedback = null) {
    const today = defaultDate || new Date().toISOString().slice(0, 10);
    const prev = existingFeedback || {};

    const html = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label class="form-label">Meal Date <span class="required">*</span></label>
          <input type="date" id="fbDate" class="form-input" value="${today}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Meal Session <span class="required">*</span></label>
          <select id="fbMealType" class="form-select" required>
            <option value="breakfast" ${defaultMeal === 'breakfast' ? 'selected' : ''}>Breakfast</option>
            <option value="lunch" ${defaultMeal === 'lunch' ? 'selected' : ''}>Lunch</option>
            <option value="dinner" ${defaultMeal === 'dinner' ? 'selected' : ''}>Dinner</option>
          </select>
        </div>
      </div>

      <div style="margin-bottom: 16px;">
        <label class="form-label">Rate Each Criterion (1 to 5 Stars):</label>
        
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-subtle);">
          <span style="font-size: 13px;">Food Quality:</span>
          <select id="fbQuality" class="form-select" style="width: 100px;">
            <option value="5" ${prev.food_quality_rating === 5 ? 'selected' : ''}>5 ★ (Excellent)</option>
            <option value="4" ${prev.food_quality_rating === 4 || !prev.food_quality_rating ? 'selected' : ''}>4 ★ (Good)</option>
            <option value="3" ${prev.food_quality_rating === 3 ? 'selected' : ''}>3 ★ (Average)</option>
            <option value="2" ${prev.food_quality_rating === 2 ? 'selected' : ''}>2 ★ (Poor)</option>
            <option value="1" ${prev.food_quality_rating === 1 ? 'selected' : ''}>1 ★ (Very Poor)</option>
          </select>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-subtle);">
          <span style="font-size: 13px;">Taste & Seasoning:</span>
          <select id="fbTaste" class="form-select" style="width: 100px;">
            <option value="5" ${prev.taste_rating === 5 ? 'selected' : ''}>5 ★ (Excellent)</option>
            <option value="4" ${prev.taste_rating === 4 || !prev.taste_rating ? 'selected' : ''}>4 ★ (Good)</option>
            <option value="3" ${prev.taste_rating === 3 ? 'selected' : ''}>3 ★ (Average)</option>
            <option value="2" ${prev.taste_rating === 2 ? 'selected' : ''}>2 ★ (Poor)</option>
            <option value="1" ${prev.taste_rating === 1 ? 'selected' : ''}>1 ★ (Very Poor)</option>
          </select>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-subtle);">
          <span style="font-size: 13px;">Mess & Kitchen Hygiene:</span>
          <select id="fbHygiene" class="form-select" style="width: 100px;">
            <option value="5" ${prev.hygiene_rating === 5 ? 'selected' : ''}>5 ★ (Excellent)</option>
            <option value="4" ${prev.hygiene_rating === 4 || !prev.hygiene_rating ? 'selected' : ''}>4 ★ (Good)</option>
            <option value="3" ${prev.hygiene_rating === 3 ? 'selected' : ''}>3 ★ (Average)</option>
            <option value="2" ${prev.hygiene_rating === 2 ? 'selected' : ''}>2 ★ (Poor)</option>
            <option value="1" ${prev.hygiene_rating === 1 ? 'selected' : ''}>1 ★ (Very Poor)</option>
          </select>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-subtle);">
          <span style="font-size: 13px;">Portion / Quantity:</span>
          <select id="fbQuantity" class="form-select" style="width: 100px;">
            <option value="5" ${prev.quantity_rating === 5 ? 'selected' : ''}>5 ★ (Excellent)</option>
            <option value="4" ${prev.quantity_rating === 4 || !prev.quantity_rating ? 'selected' : ''}>4 ★ (Good)</option>
            <option value="3" ${prev.quantity_rating === 3 ? 'selected' : ''}>3 ★ (Average)</option>
            <option value="2" ${prev.quantity_rating === 2 ? 'selected' : ''}>2 ★ (Poor)</option>
            <option value="1" ${prev.quantity_rating === 1 ? 'selected' : ''}>1 ★ (Very Poor)</option>
          </select>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
          <span style="font-size: 13px; font-weight: 600;">Overall Satisfaction:</span>
          <select id="fbOverall" class="form-select" style="width: 100px; font-weight: 700;">
            <option value="5" ${prev.overall_rating === 5 ? 'selected' : ''}>5 ★ (Excellent)</option>
            <option value="4" ${prev.overall_rating === 4 || !prev.overall_rating ? 'selected' : ''}>4 ★ (Good)</option>
            <option value="3" ${prev.overall_rating === 3 ? 'selected' : ''}>3 ★ (Average)</option>
            <option value="2" ${prev.overall_rating === 2 ? 'selected' : ''}>2 ★ (Poor)</option>
            <option value="1" ${prev.overall_rating === 1 ? 'selected' : ''}>1 ★ (Very Poor)</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Written Remarks / Feedback</label>
        <textarea id="fbComments" class="form-textarea" placeholder="Share your suggestions, what you liked or how food can be improved...">${prev.comments || ''}</textarea>
      </div>
    `;

    UI.modal({
      title: 'Submit Meal Feedback',
      bodyHtml: html,
      confirmText: 'Submit Rating',
      onConfirm: async () => {
        const payload = {
          date: document.getElementById('fbDate').value,
          meal_type: document.getElementById('fbMealType').value,
          food_quality_rating: document.getElementById('fbQuality').value,
          taste_rating: document.getElementById('fbTaste').value,
          hygiene_rating: document.getElementById('fbHygiene').value,
          quantity_rating: document.getElementById('fbQuantity').value,
          overall_rating: document.getElementById('fbOverall').value,
          comments: document.getElementById('fbComments').value.trim()
        };

        const res = await API.post('/api/feedback', payload);
        UI.toast({ title: 'Thank You', message: res.message, type: 'success' });
        if (window.location.hash.includes('feedback')) {
          Feedback.load();
        } else if (window.location.hash.includes('dashboard')) {
          Dashboard.load();
        }
        return true;
      }
    });
  }
};

window.Feedback = Feedback;
