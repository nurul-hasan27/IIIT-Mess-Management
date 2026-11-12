/**
 * IIIT Bhubaneswar Mess Management System
 * Announcements & Circulars Module
 */

const Announcements = {
  async load() {
    const container = document.getElementById('viewContainer');
    container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Loading announcements...</div></div>';

    try {
      const data = await API.get('/api/announcements');
      const announcements = data.announcements || [];

      const listHtml = announcements.length === 0
        ? '<div class="empty-state"><div class="empty-state-title">No circulars published currently.</div></div>'
        : announcements.map(a => `
          <div class="card" style="margin-bottom: 16px; border-left: 4px solid ${a.priority === 'High' ? 'var(--danger)' : (a.priority === 'Medium' ? 'var(--warning)' : 'var(--primary)')};">
            <div class="card-header">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: 700; font-size: 15px;">${a.title}</span>
                <span class="badge ${a.priority === 'High' ? 'badge-danger' : (a.priority === 'Medium' ? 'badge-warning' : 'badge-info')}">
                  ${a.priority} Priority
                </span>
                ${!a.is_active ? '<span class="badge badge-secondary">Archived</span>' : ''}
              </div>
              ${Auth.user?.role === 'admin' ? `
                <div style="display: flex; gap: 6px;">
                  <button class="btn btn-sm btn-outline" onclick="Announcements.openEditModal(${a.id}, '${a.title.replace(/'/g, "\\'")}', '${a.description.replace(/'/g, "\\'")}', '${a.priority}', '${a.expiry_date || ''}', ${a.is_active})">Edit</button>
                  <button class="btn btn-sm btn-danger" onclick="Announcements.deleteAnnouncement(${a.id})">Delete</button>
                </div>
              ` : ''}
            </div>
            <div class="card-body">
              <div style="font-size: 13.5px; color: var(--text-primary); line-height: 1.6; margin-bottom: 12px;">
                ${a.description}
              </div>
              <div style="display: flex; gap: 16px; font-size: 12px; color: var(--text-secondary); flex-wrap: wrap;">
                <span>📅 Published: <strong>${UI.formatDate(a.publish_date)}</strong></span>
                ${a.expiry_date ? `<span>⏳ Valid until: <strong>${UI.formatDate(a.expiry_date)}</strong></span>` : ''}
                <span>✍️ Issued by: <strong>${a.author_name || 'Mess Office'}</strong></span>
              </div>
            </div>
          </div>
        `).join('');

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              <img src="assets/icons/announcements.png" style="width: 22px; height: 22px;" alt="Announcements">
              Institute Mess Circulars & Notices
            </h2>
            <p style="font-size: 13px; color: var(--color-graphite);">Official dining directives, festival feast notices & rebate schedules</p>
          </div>
          ${Auth.user?.role === 'admin' ? `
            <div>
              <button class="btn btn-primary" onclick="Announcements.openCreateModal()">📢 Publish New Circular</button>
            </div>
          ` : ''}
        </div>

        <div>
          ${listHtml}
        </div>
      `;

      UI.renderIcons();
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-title">Error: ${err.message}</div></div>`;
    }
  },

  openCreateModal() {
    const html = `
      <div class="form-group">
        <label class="form-label">Circular Headline <span class="required">*</span></label>
        <input type="text" id="annTitle" class="form-input" placeholder="e.g. Special Feast on Institute Foundation Day" required>
      </div>

      <div class="form-group">
        <label class="form-label">Priority Level <span class="required">*</span></label>
        <select id="annPriority" class="form-select">
          <option value="Low">Low (Informational)</option>
          <option value="Medium" selected>Medium (General Notice)</option>
          <option value="High">High (Urgent / Mandatory Action)</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Announcement Content <span class="required">*</span></label>
        <textarea id="annDesc" class="form-textarea" placeholder="Detail the schedule, venue, menus or instructions..." rows="4" required></textarea>
        <div class="form-hint">All active students will automatically receive an in-app notification.</div>
      </div>

      <div class="form-group">
        <label class="form-label">Notice Expiry Date (Optional)</label>
        <input type="date" id="annExpiry" class="form-input">
      </div>
    `;

    UI.modal({
      title: 'Publish Official Announcement',
      bodyHtml: html,
      confirmText: 'Broadcast Notice',
      onConfirm: async () => {
        const title = document.getElementById('annTitle').value.trim();
        const priority = document.getElementById('annPriority').value;
        const description = document.getElementById('annDesc').value.trim();
        const expiry_date = document.getElementById('annExpiry').value;

        if (!title || !description) {
          throw new Error('Please enter title and content.');
        }

        await API.post('/api/announcements', {
          title,
          priority,
          description,
          expiry_date
        });

        UI.toast({ title: 'Published', message: 'Circular broadcasted to all students.', type: 'success' });
        Announcements.load();
        return true;
      }
    });
  },

  openEditModal(id, title, desc, priority, expiry, isActive) {
    const html = `
      <div class="form-group">
        <label class="form-label">Circular Headline <span class="required">*</span></label>
        <input type="text" id="editAnnTitle" class="form-input" value="${title}" required>
      </div>

      <div class="form-group">
        <label class="form-label">Priority</label>
        <select id="editAnnPriority" class="form-select">
          <option value="Low" ${priority === 'Low' ? 'selected' : ''}>Low</option>
          <option value="Medium" ${priority === 'Medium' ? 'selected' : ''}>Medium</option>
          <option value="High" ${priority === 'High' ? 'selected' : ''}>High</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Content</label>
        <textarea id="editAnnDesc" class="form-textarea" rows="4">${desc}</textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Expiry Date</label>
        <input type="date" id="editAnnExpiry" class="form-input" value="${expiry}">
      </div>

      <div class="form-group" style="display: flex; align-items: center; gap: 8px;">
        <input type="checkbox" id="editAnnActive" ${isActive ? 'checked' : ''}>
        <label for="editAnnActive" class="form-label" style="margin-bottom: 0;">Active (Visible to Students)</label>
      </div>
    `;

    UI.modal({
      title: 'Edit Circular',
      bodyHtml: html,
      confirmText: 'Update Notice',
      onConfirm: async () => {
        const title = document.getElementById('editAnnTitle').value.trim();
        const priority = document.getElementById('editAnnPriority').value;
        const description = document.getElementById('editAnnDesc').value.trim();
        const expiry_date = document.getElementById('editAnnExpiry').value;
        const is_active = document.getElementById('editAnnActive').checked;

        await API.put(`/api/announcements/${id}`, {
          title,
          priority,
          description,
          expiry_date,
          is_active
        });

        UI.toast({ title: 'Updated', message: 'Circular updated.', type: 'success' });
        Announcements.load();
        return true;
      }
    });
  },

  deleteAnnouncement(id) {
    UI.confirm({
      title: 'Delete Circular?',
      message: 'This notice will be permanently deleted.',
      isDestructive: true,
      onConfirm: async () => {
        await API.delete(`/api/announcements/${id}`);
        UI.toast({ title: 'Deleted', message: 'Circular deleted.', type: 'info' });
        Announcements.load();
        return true;
      }
    });
  }
};

window.Announcements = Announcements;
