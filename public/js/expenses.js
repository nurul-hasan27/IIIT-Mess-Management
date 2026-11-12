/**
 * IIIT Bhubaneswar Mess Management System
 * Expense & Procurement Tracking Module (Admin Only)
 */

const Expenses = {
  async load(month = '', category = '', search = '') {
    const container = document.getElementById('viewContainer');
    container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Loading mess expenses...</div></div>';

    const currMonth = month || new Date().toISOString().slice(0, 7);

    try {
      const data = await API.get('/api/expenses', { month: currMonth, category, search });
      const expenses = data.expenses || [];
      const summary = data.summary || {};
      const catBreakdown = data.categoryBreakdown || [];

      const rowsHtml = expenses.length === 0
        ? '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 28px;">No expenses logged for this month.</td></tr>'
        : expenses.map(e => `
          <tr>
            <td><strong>${UI.formatDate(e.expense_date)}</strong></td>
            <td>
              <div style="font-weight: 600;">${e.title}</div>
              <div style="font-size: 11px; color: var(--text-secondary);">${e.description || ''}</div>
            </td>
            <td><span class="badge badge-secondary">${e.category}</span></td>
            <td><strong>${UI.formatCurrency(e.amount)}</strong></td>
            <td>${e.vendor_name || '—'} <br><span style="font-size: 10.5px; color: var(--text-tertiary);">${e.invoice_number || ''}</span></td>
            <td><span style="font-size: 12px; color: var(--text-secondary);">${e.recorded_by_name || 'Admin'}</span></td>
            <td>
              <div style="display: flex; gap: 6px;">
                <button class="btn btn-sm btn-outline" onclick="Expenses.openEditModal(${e.id}, '${e.title.replace(/'/g, "\\'")}', '${e.category}', ${e.amount}, '${e.expense_date}', '${(e.vendor_name || '').replace(/'/g, "\\'")}', '${(e.invoice_number || '').replace(/'/g, "\\'")}', '${(e.description || '').replace(/'/g, "\\'")}')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="Expenses.deleteExpense(${e.id})">Delete</button>
              </div>
            </td>
          </tr>
        `).join('');

      const catBadgesHtml = catBreakdown.map(c => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: var(--bg-surface); border-radius: var(--radius-sm); border: 1px solid var(--border-light); font-size: 12.5px;">
          <span><strong>${c.category}:</strong> ${UI.formatCurrency(c.category_total)}</span>
          <span style="font-size: 11px; color: var(--text-secondary);">${c.count} bills</span>
        </div>
      `).join('');

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              <img src="assets/icons/expenses.png" style="width: 22px; height: 22px;" alt="Expenses">
              Mess Expense & Procurement Log
            </h2>
            <p style="font-size: 13px; color: var(--color-graphite);">Track daily provisioning, grocery procurement & facility maintenance</p>
          </div>
          <div>
            <button class="btn btn-primary" onclick="Expenses.openCreateModal()">💸 Record Expense</button>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-body" style="padding: 16px 20px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
            <div>
              <label class="form-label" style="margin-bottom: 4px; font-size: 12px;">Month:</label>
              <input type="month" id="expMonthInput" class="form-input" style="width: auto;" value="${currMonth}">
            </div>

            <div>
              <label class="form-label" style="margin-bottom: 4px; font-size: 12px;">Category:</label>
              <select id="expCatInput" class="form-select" style="width: auto;">
                <option value="">All Categories</option>
                <option value="Groceries" ${category === 'Groceries' ? 'selected' : ''}>Groceries</option>
                <option value="Vegetables" ${category === 'Vegetables' ? 'selected' : ''}>Vegetables</option>
                <option value="Dairy" ${category === 'Dairy' ? 'selected' : ''}>Dairy</option>
                <option value="Cooking Supplies" ${category === 'Cooking Supplies' ? 'selected' : ''}>Cooking Supplies</option>
                <option value="Staff" ${category === 'Staff' ? 'selected' : ''}>Staff Honorarium</option>
                <option value="Maintenance" ${category === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                <option value="Miscellaneous" ${category === 'Miscellaneous' ? 'selected' : ''}>Miscellaneous</option>
              </select>
            </div>

            <div style="flex: 1; min-width: 180px;">
              <label class="form-label" style="margin-bottom: 4px; font-size: 12px;">Search Title / Vendor:</label>
              <input type="text" id="expSearchInput" class="form-input" placeholder="Search bill title, vendor..." value="${search}">
            </div>

            <button class="btn btn-primary" style="margin-top: 18px;" onclick="Expenses.load(document.getElementById('expMonthInput').value, document.getElementById('expCatInput').value, document.getElementById('expSearchInput').value)">
              Apply Filter
            </button>
          </div>
        </div>

        <!-- Expense Total & Breakdown -->
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 16px; margin-bottom: 24px;">
          <div class="stat-card" style="margin-bottom: 0;">
            <div class="stat-icon-wrapper amber">
              <img src="assets/icons/expenses.png" class="stat-3d-icon" alt="Expenses">
            </div>
            <div class="stat-info">
              <div class="stat-label">Total Monthly Expenses</div>
              <div class="stat-value">${UI.formatCurrency(summary.total_expenses)}</div>
              <div class="stat-subtext">${summary.count || 0} procurement vouchers</div>
            </div>
          </div>

          <div class="card" style="margin-bottom: 0;">
            <div class="card-body" style="padding: 14px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px;">
              ${catBadgesHtml}
            </div>
          </div>
        </div>

        <!-- Expenses Table -->
        <div class="card" style="margin-top: 20px;">
          <div class="card-header">
            <div class="card-title">Procurement Vouchers List</div>
          </div>
          <div class="card-body" style="padding: 0;">
            <div class="table-container" style="border: none;">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Voucher Description</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Vendor & Invoice</th>
                    <th>Recorded By</th>
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
    const today = new Date().toISOString().slice(0, 10);

    const html = `
      <div class="form-group">
        <label class="form-label">Expense Title / Description <span class="required">*</span></label>
        <input type="text" id="expFormTitle" class="form-input" placeholder="e.g. Aashirvaad Whole Wheat Atta 10 Bags" required>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label class="form-label">Category <span class="required">*</span></label>
          <select id="expFormCat" class="form-select" required>
            <option value="Groceries">Groceries</option>
            <option value="Vegetables">Vegetables</option>
            <option value="Dairy">Dairy</option>
            <option value="Cooking Supplies">Cooking Supplies / Gas</option>
            <option value="Staff">Staff Wages & Support</option>
            <option value="Maintenance">Kitchen Equipment Maintenance</option>
            <option value="Miscellaneous">Miscellaneous</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Amount (INR ₹) <span class="required">*</span></label>
          <input type="number" id="expFormAmount" class="form-input" placeholder="e.g. 14500" min="1" step="0.01" required>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label class="form-label">Expense Date <span class="required">*</span></label>
          <input type="date" id="expFormDate" class="form-input" value="${today}" required>
        </div>

        <div class="form-group">
          <label class="form-label">Vendor / Supplier Name</label>
          <input type="text" id="expFormVendor" class="form-input" placeholder="e.g. Unit-1 Mandi Traders">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Invoice / Receipt Number</label>
        <input type="text" id="expFormInvoice" class="form-input" placeholder="e.g. INV-2024-8891">
      </div>

      <div class="form-group">
        <label class="form-label">Additional Procurement Notes</label>
        <textarea id="expFormDesc" class="form-textarea" placeholder="Quantity details, delivery acknowledgement, etc."></textarea>
      </div>
    `;

    UI.modal({
      title: 'Log Mess Procurement Expense',
      bodyHtml: html,
      confirmText: 'Save Expense',
      onConfirm: async () => {
        const title = document.getElementById('expFormTitle').value.trim();
        const category = document.getElementById('expFormCat').value;
        const amount = document.getElementById('expFormAmount').value;
        const expense_date = document.getElementById('expFormDate').value;
        const vendor_name = document.getElementById('expFormVendor').value.trim();
        const invoice_number = document.getElementById('expFormInvoice').value.trim();
        const description = document.getElementById('expFormDesc').value.trim();

        if (!title || !category || !amount || !expense_date) {
          throw new Error('Please fill all required expense fields.');
        }

        await API.post('/api/expenses', {
          title,
          category,
          amount,
          expense_date,
          vendor_name,
          invoice_number,
          description
        });

        UI.toast({ title: 'Saved', message: 'Expense logged successfully.', type: 'success' });
        Expenses.load(expense_date.slice(0, 7));
        return true;
      }
    });
  },

  openEditModal(id, title, category, amount, date, vendor, invoice, desc) {
    const html = `
      <div class="form-group">
        <label class="form-label">Expense Title <span class="required">*</span></label>
        <input type="text" id="editExpTitle" class="form-input" value="${title}" required>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label class="form-label">Category</label>
          <select id="editExpCat" class="form-select">
            <option value="Groceries" ${category === 'Groceries' ? 'selected' : ''}>Groceries</option>
            <option value="Vegetables" ${category === 'Vegetables' ? 'selected' : ''}>Vegetables</option>
            <option value="Dairy" ${category === 'Dairy' ? 'selected' : ''}>Dairy</option>
            <option value="Cooking Supplies" ${category === 'Cooking Supplies' ? 'selected' : ''}>Cooking Supplies</option>
            <option value="Staff" ${category === 'Staff' ? 'selected' : ''}>Staff</option>
            <option value="Maintenance" ${category === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
            <option value="Miscellaneous" ${category === 'Miscellaneous' ? 'selected' : ''}>Miscellaneous</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Amount (INR ₹) <span class="required">*</span></label>
          <input type="number" id="editExpAmount" class="form-input" value="${amount}" required>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label class="form-label">Expense Date</label>
          <input type="date" id="editExpDate" class="form-input" value="${date}">
        </div>

        <div class="form-group">
          <label class="form-label">Vendor Name</label>
          <input type="text" id="editExpVendor" class="form-input" value="${vendor}">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Invoice Number</label>
        <input type="text" id="editExpInvoice" class="form-input" value="${invoice}">
      </div>

      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea id="editExpDesc" class="form-textarea">${desc}</textarea>
      </div>
    `;

    UI.modal({
      title: 'Edit Expense Voucher',
      bodyHtml: html,
      confirmText: 'Update Expense',
      onConfirm: async () => {
        const title = document.getElementById('editExpTitle').value.trim();
        const category = document.getElementById('editExpCat').value;
        const amount = document.getElementById('editExpAmount').value;
        const expense_date = document.getElementById('editExpDate').value;
        const vendor_name = document.getElementById('editExpVendor').value.trim();
        const invoice_number = document.getElementById('editExpInvoice').value.trim();
        const description = document.getElementById('editExpDesc').value.trim();

        await API.put(`/api/expenses/${id}`, {
          title,
          category,
          amount,
          expense_date,
          vendor_name,
          invoice_number,
          description
        });

        UI.toast({ title: 'Updated', message: 'Expense details updated.', type: 'success' });
        const currMonth = document.getElementById('expMonthInput')?.value;
        Expenses.load(currMonth);
        return true;
      }
    });
  },

  deleteExpense(id) {
    UI.confirm({
      title: 'Delete Expense Voucher?',
      message: 'This procurement entry will be permanently removed from SQLite database.',
      isDestructive: true,
      onConfirm: async () => {
        await API.delete(`/api/expenses/${id}`);
        UI.toast({ title: 'Deleted', message: 'Expense voucher removed.', type: 'info' });
        const currMonth = document.getElementById('expMonthInput')?.value;
        Expenses.load(currMonth);
        return true;
      }
    });
  }
};

window.Expenses = Expenses;
