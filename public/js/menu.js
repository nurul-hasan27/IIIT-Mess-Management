/**
 * IIIT Bhubaneswar Mess Management System
 * Mess Menu Module (Today, Weekly & Admin CRUD)
 */

const Menu = {
  // --------------------------------------------------------------------------
  // TODAY'S MENU VIEW
  // --------------------------------------------------------------------------
  async loadToday() {
    const container = document.getElementById('viewContainer');
    container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Loading today\'s dining menu...</div></div>';

    try {
      const data = await API.get('/api/menus/today');
      const { date, menus } = data;

      const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      let mealsHtml = '';
      if (!menus || menus.length === 0) {
        mealsHtml = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <div class="empty-state-icon">🍽️</div>
            <div class="empty-state-title">No menu published for today</div>
            <div class="empty-state-desc">The mess committee has not yet finalized the meal schedule for ${formattedDate}.</div>
          </div>
        `;
      } else {
        mealsHtml = menus.map(m => {
          const itemsList = m.items.map(it => `
            <li class="meal-item">
              <span class="diet-dot ${it.is_veg ? 'veg' : 'non-veg'}"></span>
              <span style="font-weight: 500;">${it.item_name}</span>
              <span class="badge badge-secondary" style="margin-left: auto; font-size: 10px;">${it.category || 'Item'}</span>
            </li>
          `).join('');

          return `
            <div class="meal-card">
              <div class="meal-card-header">
                <span class="meal-type-title">
                  <img src="assets/icons/brand-bowl.png" class="meal-3d-thumb" alt="${m.meal_type}">
                  ${m.meal_type.toUpperCase()}
                  ${m.is_special ? '<span class="badge badge-warning">Special Feast</span>' : ''}
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
                  <span style="font-size: 11px; color: var(--color-stone);">Managed by IIIT Mess Committee</span>
                </div>
                <div>
                  <button class="btn btn-sm btn-primary" onclick="Feedback.openFeedbackModal('${m.meal_type}', '${m.date}', ${JSON.stringify(m.user_feedback || null).replace(/"/g, '&quot;')})">
                    ⭐ ${m.user_feedback ? 'Update Rating' : 'Rate Food'}
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 700;">Today's Dining Schedule</h2>
            <p style="font-size: 13px; color: var(--text-secondary);">${formattedDate}</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" onclick="Nav.navigate('#menu-weekly')">
              <img src="assets/icons/menu-weekly.png" style="width: 16px; height: 16px; margin-right: 6px; vertical-align: middle;">
              Weekly Menu
            </button>
            <button class="btn btn-secondary" onclick="Nav.navigate('#feedback')">
              <img src="assets/icons/feedback.png" style="width: 16px; height: 16px; margin-right: 6px; vertical-align: middle;">
              View Feedback
            </button>
          </div>
        </div>

        <div class="meals-grid">
          ${mealsHtml}
        </div>
      `;

      UI.renderIcons();
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-title">Error: ${err.message}</div></div>`;
    }
  },

  // --------------------------------------------------------------------------
  // WEEKLY MENU VIEW
  // --------------------------------------------------------------------------
  async loadWeekly(startDate = '') {
    const container = document.getElementById('viewContainer');
    container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Loading weekly schedule...</div></div>';

    try {
      const data = await API.get('/api/menus/weekly', { start_date: startDate });
      const { dates, today, weeklyMenus } = data;

      let daysHtml = dates.map(dateStr => {
        const d = new Date(dateStr + 'T00:00:00');
        const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
        const monthDay = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        const isToday = dateStr === today;
        const dayMenus = weeklyMenus[dateStr] || {};

        const meals = ['breakfast', 'lunch', 'dinner'].map(mType => {
          const m = dayMenus[mType];
          if (!m) {
            return `
              <div style="padding: 10px; background: var(--bg-surface); border-radius: var(--radius-sm); border: 1px dashed var(--border-light); font-size: 11.5px; color: var(--text-tertiary);">
                <strong style="text-transform: capitalize; color: var(--text-secondary);">${mType}:</strong> Not set
              </div>
            `;
          }

          const itemsSummary = m.items.map(it => it.item_name).join(', ');
          return `
            <div style="padding: 10px; background: var(--bg-surface); border-radius: var(--radius-sm); border: 1px solid var(--border-light); font-size: 12px; margin-bottom: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <strong style="text-transform: capitalize; color: var(--primary);">${mType}</strong>
                <span style="font-size: 10.5px; color: var(--text-secondary);">${m.serving_time}</span>
              </div>
              <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">${m.title}</div>
              <div style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4;">${itemsSummary}</div>
            </div>
          `;
        }).join('');

        return `
          <div class="card" style="margin-bottom: 0; ${isToday ? 'border: 2px solid var(--primary);' : ''}">
            <div class="card-header" style="${isToday ? 'background: var(--primary-light);' : ''}">
              <div>
                <span style="font-weight: 700; font-size: 14px;">${dayName}</span>
                <span style="font-size: 12px; color: var(--text-secondary); margin-left: 6px;">${monthDay}</span>
              </div>
              ${isToday ? '<span class="badge badge-primary">Today</span>' : ''}
            </div>
            <div class="card-body" style="padding: 14px; display: flex; flex-direction: column; gap: 8px;">
              ${meals}
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 700;">7-Day Dining Schedule</h2>
            <p style="font-size: 13px; color: var(--text-secondary);">Browse regular and special feast menus planned for the week</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" onclick="Menu.loadToday()">🍽️ Today's Menu</button>
            ${Auth.user?.role === 'admin' ? '<button class="btn btn-primary" onclick="Nav.navigate(\'#admin-menu\')">⚙️ Manage Menus</button>' : ''}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          ${daysHtml}
        </div>
      `;

      UI.renderIcons();
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-title">Error: ${err.message}</div></div>`;
    }
  },

  // --------------------------------------------------------------------------
  // ADMIN MENU MANAGEMENT
  // --------------------------------------------------------------------------
  async loadAdmin(selectedDate = '') {
    const container = document.getElementById('viewContainer');
    container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Loading menu management...</div></div>';

    const targetDate = selectedDate || new Date().toISOString().slice(0, 10);

    try {
      const data = await API.get('/api/menus', { date: targetDate });
      const { date, menus } = data;

      const mealsListHtml = menus.length === 0
        ? '<div class="empty-state"><div class="empty-state-title">No meals configured for this date yet.</div></div>'
        : menus.map(m => `
          <div class="card" style="margin-bottom: 16px;">
            <div class="card-header">
              <div style="display: flex; align-items: center; gap: 8px;">
                <img src="assets/icons/brand-bowl.png" class="meal-3d-thumb" alt="${m.meal_type}">
                <span class="meal-type-title" style="text-transform: capitalize;">
                  ${m.meal_type}
                  ${m.is_special ? '<span class="badge badge-warning" style="margin-left: 6px;">Special</span>' : ''}
                </span>
                <span style="font-size: 12px; color: var(--color-stone); margin-left: 10px;">🕒 ${m.serving_time}</span>
              </div>
              <div style="display: flex; gap: 8px;">
                <button class="btn btn-sm btn-outline" onclick="Menu.openEditModal(${m.id}, '${m.meal_type}', '${m.title.replace(/'/g, "\\'")}', '${m.serving_time}', ${m.is_special}, ${JSON.stringify(m.items).replace(/"/g, '&quot;')})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="Menu.deleteMeal(${m.id})">Delete</button>
              </div>
            </div>
            <div class="card-body">
              <div style="font-weight: 700; font-size: 14.5px; margin-bottom: 10px;">${m.title}</div>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${m.items.map(it => `
                  <span class="badge ${it.is_veg ? 'badge-success' : 'badge-danger'}">
                    ${it.item_name} (${it.category || 'Main'})
                  </span>
                `).join('')}
              </div>
            </div>
          </div>
        `).join('');

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              <img src="assets/icons/menu-today.png" style="width: 22px; height: 22px;" alt="Menu">
              Manage Mess Menus
            </h2>
            <p style="font-size: 13px; color: var(--color-graphite);">Configure daily recipes, serving windows & duplicate schedules</p>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-secondary" onclick="Menu.openDuplicateModal('${date}')">📋 Duplicate Day Menu</button>
            <button class="btn btn-primary" onclick="Menu.openCreateModal('${date}')">➕ Add Meal Entry</button>
          </div>
        </div>

        <!-- Date Selector -->
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-body" style="padding: 16px 20px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
            <label class="form-label" style="margin-bottom: 0; font-size: 13.5px;">Select Menu Date:</label>
            <input type="date" id="adminMenuDate" class="form-input" style="width: auto;" value="${date}" onchange="Menu.loadAdmin(this.value)">
            <span style="font-size: 12.5px; color: var(--text-secondary);">Showing 3-session schedule for ${UI.formatDate(date)}</span>
          </div>
        </div>

        <div>
          ${mealsListHtml}
        </div>
      `;

      UI.renderIcons();
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-title">Error: ${err.message}</div></div>`;
    }
  },

  openCreateModal(defaultDate = '') {
    const today = defaultDate || new Date().toISOString().slice(0, 10);

    const html = `
      <div class="form-group">
        <label class="form-label">Menu Date <span class="required">*</span></label>
        <input type="date" id="menuFormDate" class="form-input" value="${today}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Meal Type <span class="required">*</span></label>
        <select id="menuFormMealType" class="form-select" required>
          <option value="breakfast">Breakfast</option>
          <option value="lunch" selected>Lunch</option>
          <option value="dinner">Dinner</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Meal Title / Theme <span class="required">*</span></label>
        <input type="text" id="menuFormTitle" class="form-input" placeholder="e.g. Punjabi Rajma Masala & Basmati Rice" required>
      </div>
      <div class="form-group">
        <label class="form-label">Serving Timings <span class="required">*</span></label>
        <input type="text" id="menuFormTimings" class="form-input" value="12:15 PM - 02:30 PM" required>
      </div>
      <div class="form-group">
        <label class="form-label">Food Items (comma separated) <span class="required">*</span></label>
        <textarea id="menuFormItems" class="form-textarea" placeholder="e.g. Steamed Basmati Rice, Rajma Curry, Bhindi Fry, Tawa Roti, Boondi Raita" required></textarea>
        <div class="form-hint">Type dish names separated by commas.</div>
      </div>
      <div class="form-group" style="display: flex; align-items: center; gap: 8px;">
        <input type="checkbox" id="menuFormSpecial">
        <label for="menuFormSpecial" class="form-label" style="margin-bottom: 0;">Special Feast / Festival Meal</label>
      </div>
    `;

    UI.modal({
      title: 'Create Meal Schedule',
      bodyHtml: html,
      confirmText: 'Save Menu',
      onConfirm: async () => {
        const date = document.getElementById('menuFormDate').value;
        const meal_type = document.getElementById('menuFormMealType').value;
        const title = document.getElementById('menuFormTitle').value.trim();
        const serving_time = document.getElementById('menuFormTimings').value.trim();
        const itemsStr = document.getElementById('menuFormItems').value.trim();
        const is_special = document.getElementById('menuFormSpecial').checked;

        if (!date || !meal_type || !title || !itemsStr) {
          throw new Error('Please fill all required menu fields.');
        }

        const items = itemsStr.split(',').map(s => s.trim()).filter(Boolean).map(item_name => ({
          item_name,
          category: 'Main Course',
          is_veg: !item_name.toLowerCase().includes('egg') && !item_name.toLowerCase().includes('chicken')
        }));

        await API.post('/api/menus', {
          date,
          meal_type,
          title,
          serving_time,
          is_special,
          items
        });

        UI.toast({ title: 'Success', message: 'Menu saved successfully.', type: 'success' });
        Menu.loadAdmin(date);
        return true;
      }
    });
  },

  openEditModal(menuId, meal_type, title, serving_time, is_special, items) {
    const itemsStr = items.map(it => it.item_name).join(', ');

    const html = `
      <div class="form-group">
        <label class="form-label">Meal Type</label>
        <input type="text" class="form-input" value="${meal_type.toUpperCase()}" disabled>
      </div>
      <div class="form-group">
        <label class="form-label">Meal Title <span class="required">*</span></label>
        <input type="text" id="editMenuTitle" class="form-input" value="${title}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Serving Hours <span class="required">*</span></label>
        <input type="text" id="editMenuTimings" class="form-input" value="${serving_time}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Dishes (comma separated) <span class="required">*</span></label>
        <textarea id="editMenuItems" class="form-textarea" required>${itemsStr}</textarea>
      </div>
      <div class="form-group" style="display: flex; align-items: center; gap: 8px;">
        <input type="checkbox" id="editMenuSpecial" ${is_special ? 'checked' : ''}>
        <label for="editMenuSpecial" class="form-label" style="margin-bottom: 0;">Special Feast / Festival Meal</label>
      </div>
    `;

    UI.modal({
      title: 'Edit Meal Entry',
      bodyHtml: html,
      confirmText: 'Update Menu',
      onConfirm: async () => {
        const updatedTitle = document.getElementById('editMenuTitle').value.trim();
        const updatedTimings = document.getElementById('editMenuTimings').value.trim();
        const updatedItemsStr = document.getElementById('editMenuItems').value.trim();
        const updatedSpecial = document.getElementById('editMenuSpecial').checked;

        const items = updatedItemsStr.split(',').map(s => s.trim()).filter(Boolean).map(item_name => ({
          item_name,
          category: 'Main Course',
          is_veg: !item_name.toLowerCase().includes('egg')
        }));

        await API.put(`/api/menus/${menuId}`, {
          title: updatedTitle,
          serving_time: updatedTimings,
          is_special: updatedSpecial,
          items
        });

        UI.toast({ title: 'Updated', message: 'Meal details updated.', type: 'success' });
        const currentDate = document.getElementById('adminMenuDate')?.value;
        Menu.loadAdmin(currentDate);
        return true;
      }
    });
  },

  deleteMeal(menuId) {
    UI.confirm({
      title: 'Delete Meal Entry?',
      message: 'Are you sure you want to delete this menu entry and its items from SQLite database?',
      isDestructive: true,
      onConfirm: async () => {
        await API.delete(`/api/menus/${menuId}`);
        UI.toast({ title: 'Deleted', message: 'Meal entry removed.', type: 'info' });
        const currentDate = document.getElementById('adminMenuDate')?.value;
        Menu.loadAdmin(currentDate);
        return true;
      }
    });
  },

  openDuplicateModal(sourceDate) {
    const html = `
      <div class="form-group">
        <label class="form-label">Source Date (Copy From)</label>
        <input type="date" id="dupSourceDate" class="form-input" value="${sourceDate}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Target Date (Copy To) <span class="required">*</span></label>
        <input type="date" id="dupTargetDate" class="form-input" required>
        <div class="form-hint">Copies breakfast, lunch, and dinner with all menu items to the target day.</div>
      </div>
    `;

    UI.modal({
      title: 'Duplicate Day Schedule',
      bodyHtml: html,
      confirmText: 'Duplicate Menu',
      onConfirm: async () => {
        const source_date = document.getElementById('dupSourceDate').value;
        const target_date = document.getElementById('dupTargetDate').value;
        if (!source_date || !target_date) {
          throw new Error('Please choose both source and target dates.');
        }

        const res = await API.post('/api/menus/duplicate', { source_date, target_date });
        UI.toast({ title: 'Duplicated', message: res.message, type: 'success' });
        Menu.loadAdmin(target_date);
        return true;
      }
    });
  }
};

window.Menu = Menu;
