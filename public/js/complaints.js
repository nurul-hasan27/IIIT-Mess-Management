/**
 * IIIT Bhubaneswar Mess Management System
 * Complaint & Grievance Ticketing Module
 */

const Complaints = {
  // --------------------------------------------------------------------------
  // STUDENT COMPLAINTS VIEW
  // --------------------------------------------------------------------------
  async load(search = '', status = '', category = '') {
    const container = document.getElementById('viewContainer');
    container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Loading grievance tickets...</div></div>';

    try {
      const data = await API.get('/api/complaints', { search, status, category });
      const complaints = data.complaints || [];

      const rowsHtml = complaints.length === 0
        ? '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 28px;">No complaints found. If you have any dining concerns, please raise a ticket.</td></tr>'
        : complaints.map(c => `
          <tr>
            <td><strong>${c.ticket_number}</strong></td>
            <td>
              <span class="badge badge-secondary">${c.category}</span>
            </td>
            <td>
              <div style="font-weight: 600; color: var(--text-primary);">${c.subject}</div>
              <div style="font-size: 11.5px; color: var(--text-secondary); max-width: 320px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                ${c.description}
              </div>
            </td>
            <td>
              <span class="badge ${
                c.priority === 'Urgent' ? 'badge-danger' : 
                (c.priority === 'High' ? 'badge-warning' : 'badge-info')
              }">
                ${c.priority}
              </span>
            </td>
            <td>
              <span class="badge ${
                c.status === 'Resolved' ? 'badge-success' : 
                (c.status === 'Rejected' ? 'badge-danger' : 
                (c.status === 'In Progress' ? 'badge-info' : 'badge-warning'))
              }">
                ${c.status}
              </span>
            </td>
            <td>
              <button class="btn btn-sm btn-outline" onclick="Complaints.viewTicket(${c.id})">Details</button>
            </td>
          </tr>
        `).join('');

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              <img src="assets/icons/complaints.png" style="width: 22px; height: 22px;" alt="Complaints">
              Grievance & Complaint Tracking
            </h2>
            <p style="font-size: 13px; color: var(--color-graphite);">Direct resolution desk for food quality, hygiene, and billing issues</p>
          </div>
          <div>
            <button class="btn btn-primary" onclick="Complaints.openCreateModal()">📢 Raise a New Complaint</button>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">My Registered Tickets</div>
          </div>
          <div class="card-body" style="padding: 0;">
            <div class="table-container" style="border: none;">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Category</th>
                    <th>Subject & Details</th>
                    <th>Priority</th>
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

  // --------------------------------------------------------------------------
  // ADMIN COMPLAINT MANAGEMENT DESK
  // --------------------------------------------------------------------------
  async loadAdmin(search = '', status = '', category = '') {
    const container = document.getElementById('viewContainer');
    container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Loading admin grievance desk...</div></div>';

    try {
      const data = await API.get('/api/complaints', { search, status, category });
      const complaints = data.complaints || [];

      const rowsHtml = complaints.length === 0
        ? '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 28px;">No complaints matching the selected filters.</td></tr>'
        : complaints.map(c => `
          <tr>
            <td><strong>${c.ticket_number}</strong></td>
            <td>${c.student_name} <br><span style="font-size: 11px; color: var(--text-secondary);">${c.student_roll} • ${c.hostel_room || ''}</span></td>
            <td><span class="badge badge-secondary">${c.category}</span></td>
            <td>
              <div style="font-weight: 600;">${c.subject}</div>
              <div style="font-size: 11px; color: var(--text-secondary);">${UI.formatDate(c.created_at)}</div>
            </td>
            <td>
              <span class="badge ${
                c.priority === 'Urgent' ? 'badge-danger' : 
                (c.priority === 'High' ? 'badge-warning' : 'badge-info')
              }">
                ${c.priority}
              </span>
            </td>
            <td>
              <span class="badge ${
                c.status === 'Resolved' ? 'badge-success' : 
                (c.status === 'Rejected' ? 'badge-danger' : 
                (c.status === 'In Progress' ? 'badge-info' : 'badge-warning'))
              }">
                ${c.status}
              </span>
            </td>
            <td>
              <button class="btn btn-sm btn-primary" onclick="Complaints.openResolutionModal(${c.id})">Review & Resolve</button>
            </td>
          </tr>
        `).join('');

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              <img src="assets/icons/complaints.png" style="width: 22px; height: 22px;" alt="Complaints">
              Complaint Resolution Desk
            </h2>
            <p style="font-size: 13px; color: var(--color-graphite);">Assign staff, update ticket lifecycles & communicate resolution notes</p>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-body" style="padding: 16px 20px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
            <input type="text" id="adminComplaintSearch" class="form-input" style="flex: 1; min-width: 200px;" placeholder="Search ticket, student name or subject..." value="${search}">
            
            <select id="adminComplaintStatus" class="form-select" style="width: auto;">
              <option value="">All Statuses</option>
              <option value="Submitted" ${status === 'Submitted' ? 'selected' : ''}>Submitted</option>
              <option value="Under Review" ${status === 'Under Review' ? 'selected' : ''}>Under Review</option>
              <option value="In Progress" ${status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Resolved" ${status === 'Resolved' ? 'selected' : ''}>Resolved</option>
              <option value="Rejected" ${status === 'Rejected' ? 'selected' : ''}>Rejected</option>
            </select>

            <select id="adminComplaintCat" class="form-select" style="width: auto;">
              <option value="">All Categories</option>
              <option value="Food Quality" ${category === 'Food Quality' ? 'selected' : ''}>Food Quality</option>
              <option value="Hygiene" ${category === 'Hygiene' ? 'selected' : ''}>Hygiene</option>
              <option value="Menu" ${category === 'Menu' ? 'selected' : ''}>Menu</option>
              <option value="Water" ${category === 'Water' ? 'selected' : ''}>Water</option>
              <option value="Staff Behaviour" ${category === 'Staff Behaviour' ? 'selected' : ''}>Staff Behaviour</option>
              <option value="Billing" ${category === 'Billing' ? 'selected' : ''}>Billing</option>
              <option value="Other" ${category === 'Other' ? 'selected' : ''}>Other</option>
            </select>

            <button class="btn btn-primary" onclick="Complaints.loadAdmin(document.getElementById('adminComplaintSearch').value, document.getElementById('adminComplaintStatus').value, document.getElementById('adminComplaintCat').value)">
              Apply Filters
            </button>
          </div>
        </div>

        <div class="card">
          <div class="card-body" style="padding: 0;">
            <div class="table-container" style="border: none;">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Student Details</th>
                    <th>Category</th>
                    <th>Grievance Subject</th>
                    <th>Priority</th>
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

  openCreateModal() {
    const html = `
      <div class="form-group">
        <label class="form-label">Grievance Category <span class="required">*</span></label>
        <select id="compCat" class="form-select" required>
          <option value="Food Quality">Food Quality & Freshness</option>
          <option value="Hygiene">Mess Hall & Utensil Hygiene</option>
          <option value="Menu">Menu Variation & Serving Hours</option>
          <option value="Water">Drinking Water & Coolers</option>
          <option value="Staff Behaviour">Staff Behaviour & Service</option>
          <option value="Billing">Billing & Rebate Discrepancies</option>
          <option value="Other">Other Issues</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Subject / Brief Summary <span class="required">*</span></label>
        <input type="text" id="compSubject" class="form-input" placeholder="e.g. Excessive spice in Wednesday dinner curry" required>
      </div>

      <div class="form-group">
        <label class="form-label">Detailed Description <span class="required">*</span></label>
        <textarea id="compDesc" class="form-textarea" placeholder="Describe what happened, counter number, approximate time, and how it can be resolved..." required></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Priority Level</label>
        <select id="compPriority" class="form-select">
          <option value="Low">Low (General suggestion)</option>
          <option value="Medium" selected>Medium (Standard concern)</option>
          <option value="High">High (Immediate attention needed)</option>
          <option value="Urgent">Urgent (Health / sanitation risk)</option>
        </select>
      </div>
    `;

    UI.modal({
      title: 'Submit Grievance Ticket',
      bodyHtml: html,
      confirmText: 'Submit Complaint',
      onConfirm: async () => {
        const category = document.getElementById('compCat').value;
        const subject = document.getElementById('compSubject').value.trim();
        const description = document.getElementById('compDesc').value.trim();
        const priority = document.getElementById('compPriority').value;

        if (!category || !subject || !description) {
          throw new Error('Please fill all required ticket fields.');
        }

        const res = await API.post('/api/complaints', {
          category,
          subject,
          description,
          priority
        });

        UI.toast({
          title: 'Ticket Created',
          message: `Your complaint has been logged under ${res.ticketNumber}.`,
          type: 'success'
        });

        if (window.location.hash.includes('complaint')) {
          Complaints.load();
        } else if (window.location.hash.includes('dashboard')) {
          Dashboard.load();
        }
        return true;
      }
    });
  },

  async viewTicket(complaintId) {
    try {
      const data = await API.get(`/api/complaints/${complaintId}`);
      const c = data.complaint;

      const html = `
        <div style="background: var(--bg-subtle); padding: 14px; border-radius: var(--radius-md); margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-weight: 700; font-size: 15px;">${c.ticket_number}</span>
            <span class="badge ${c.status === 'Resolved' ? 'badge-success' : 'badge-warning'}">${c.status}</span>
          </div>
          <div style="font-size: 12px; color: var(--text-secondary);">
            Category: <strong>${c.category}</strong> • Priority: <strong>${c.priority}</strong> • Filed: ${UI.formatDate(c.created_at)}
          </div>
        </div>

        <div style="margin-bottom: 14px;">
          <label class="form-label" style="font-size: 12px; color: var(--text-tertiary);">SUBJECT</label>
          <div style="font-weight: 600; font-size: 14px;">${c.subject}</div>
        </div>

        <div style="margin-bottom: 14px;">
          <label class="form-label" style="font-size: 12px; color: var(--text-tertiary);">DESCRIPTION</label>
          <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; background: var(--bg-surface-hover); padding: 12px; border-radius: var(--radius-sm);">
            ${c.description}
          </div>
        </div>

        <div style="margin-bottom: 14px;">
          <label class="form-label" style="font-size: 12px; color: var(--text-tertiary);">RESOLUTION NOTES</label>
          <div style="font-size: 13px; color: ${c.resolution_notes ? 'var(--text-primary)' : 'var(--text-tertiary)'}; font-style: ${c.resolution_notes ? 'normal' : 'italic'};">
            ${c.resolution_notes || 'Pending investigation by Mess Warden / Supervisor.'}
          </div>
        </div>
      `;

      UI.modal({
        title: 'Grievance Ticket Details',
        bodyHtml: html,
        confirmText: 'Close',
        onConfirm: () => true
      });
    } catch (err) {
      UI.toast({ title: 'Error', message: err.message, type: 'error' });
    }
  },

  async openResolutionModal(complaintId) {
    try {
      const data = await API.get(`/api/complaints/${complaintId}`);
      const c = data.complaint;

      const html = `
        <div style="background: var(--bg-subtle); padding: 12px; border-radius: var(--radius-md); margin-bottom: 16px;">
          <div style="font-weight: 700; font-size: 14px;">${c.ticket_number}: ${c.subject}</div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
            Student: <strong>${c.student_name} (${c.student_roll})</strong> • Room: ${c.hostel_room || 'Hostel'}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Student Grievance Description</label>
          <div style="font-size: 12.5px; color: var(--text-secondary); background: var(--bg-surface-hover); padding: 10px; border-radius: var(--radius-sm); max-height: 100px; overflow-y: auto;">
            ${c.description}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label">Update Status <span class="required">*</span></label>
            <select id="resStatus" class="form-select">
              <option value="Submitted" ${c.status === 'Submitted' ? 'selected' : ''}>Submitted</option>
              <option value="Under Review" ${c.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
              <option value="In Progress" ${c.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Resolved" ${c.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
              <option value="Rejected" ${c.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Priority</label>
            <select id="resPriority" class="form-select">
              <option value="Low" ${c.priority === 'Low' ? 'selected' : ''}>Low</option>
              <option value="Medium" ${c.priority === 'Medium' ? 'selected' : ''}>Medium</option>
              <option value="High" ${c.priority === 'High' ? 'selected' : ''}>High</option>
              <option value="Urgent" ${c.priority === 'Urgent' ? 'selected' : ''}>Urgent</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Resolution Notes / Official Response</label>
          <textarea id="resNotes" class="form-textarea" placeholder="Explain steps taken, staff reprimanded, repairs scheduled, or outcome...">${c.resolution_notes || ''}</textarea>
          <div class="form-hint">The student will immediately receive an in-app notification with these notes.</div>
        </div>
      `;

      UI.modal({
        title: 'Review & Resolve Grievance',
        bodyHtml: html,
        confirmText: 'Save Resolution',
        onConfirm: async () => {
          const status = document.getElementById('resStatus').value;
          const priority = document.getElementById('resPriority').value;
          const resolution_notes = document.getElementById('resNotes').value.trim();

          await API.put(`/api/complaints/${complaintId}`, {
            status,
            priority,
            resolution_notes
          });

          UI.toast({ title: 'Ticket Updated', message: `Ticket ${c.ticket_number} marked as ${status}.`, type: 'success' });
          if (Auth.user?.role === 'staff') {
            Dashboard.load();
          } else {
            Complaints.loadAdmin();
          }
          return true;
        }
      });
    } catch (err) {
      UI.toast({ title: 'Error', message: err.message, type: 'error' });
    }
  }
};

window.Complaints = Complaints;
