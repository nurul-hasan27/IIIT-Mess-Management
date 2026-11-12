/**
 * IIIT Bhubaneswar Mess Management System
 * Billing, Payments & Invoicing Module
 */

const Billing = {
  // --------------------------------------------------------------------------
  // STUDENT BILLS VIEW
  // --------------------------------------------------------------------------
  async loadBills() {
    const container = document.getElementById('viewContainer');
    container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Loading mess invoices...</div></div>';

    try {
      const data = await API.get('/api/bills');
      const bills = data.bills || [];

      // Calculate dues
      const totalDue = bills.reduce((acc, b) => acc + (b.due_amount || 0), 0);
      const totalPaid = bills.reduce((acc, b) => acc + (b.paid_amount || 0), 0);

      const rowsHtml = bills.length === 0
        ? '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 24px;">No billing records found.</td></tr>'
        : bills.map(b => `
          <tr>
            <td><strong>${b.bill_number}</strong></td>
            <td><strong>${b.billing_month}</strong></td>
            <td>${UI.formatCurrency(b.total_amount)}</td>
            <td style="color: var(--success); font-weight: 600;">${UI.formatCurrency(b.paid_amount)}</td>
            <td style="color: ${b.due_amount > 0 ? 'var(--danger)' : 'var(--text-secondary)'}; font-weight: 700;">
              ${UI.formatCurrency(b.due_amount)}
            </td>
            <td>
              <span class="badge ${
                b.status === 'Paid' ? 'badge-success' : 
                (b.status === 'Partially Paid' ? 'badge-warning' : 'badge-danger')
              }">
                ${b.status}
              </span>
            </td>
            <td>
              <div style="display: flex; gap: 6px;">
                <button class="btn btn-sm btn-outline" onclick="Billing.viewBillDetails(${b.id})">Invoice</button>
                ${b.due_amount > 0 ? `<button class="btn btn-sm btn-primary" onclick="Billing.openPaymentModal(${b.id}, ${b.due_amount})">Pay</button>` : ''}
              </div>
            </td>
          </tr>
        `).join('');

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              <img src="assets/icons/bills.png" style="width: 22px; height: 22px;" alt="Bills">
              My Mess Invoices & Bills
            </h2>
            <p style="font-size: 13px; color: var(--color-graphite);">Monthly subscription invoices, approved leave rebates & payment history</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" onclick="Nav.navigate('#payments')">🧾 Payment Receipts</button>
            ${totalDue > 0 ? `<button class="btn btn-primary" onclick="Billing.openPaymentModal(null, ${totalDue})">💳 Clear Outstanding Dues</button>` : ''}
          </div>
        </div>

        <!-- Dues Overview Cards (3 Equal Columns) -->
        <div class="stats-grid-3">
          <div class="stat-card">
            <div class="stat-icon-wrapper ${totalDue > 0 ? 'rose' : 'green'}">
              <img src="assets/icons/wallet.png" class="stat-3d-icon" alt="Dues">
            </div>
            <div class="stat-info">
              <div class="stat-label">Total Outstanding Dues</div>
              <div class="stat-value" style="color: ${totalDue > 0 ? 'var(--danger)' : 'var(--success)'};">
                ${UI.formatCurrency(totalDue)}
              </div>
              <div class="stat-subtext">${totalDue > 0 ? 'Immediate clearance requested' : 'No dues pending'}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper green">
              <img src="assets/icons/payments.png" class="stat-3d-icon" alt="Paid">
            </div>
            <div class="stat-info">
              <div class="stat-label">Total Mess Fees Paid</div>
              <div class="stat-value">${UI.formatCurrency(totalPaid)}</div>
              <div class="stat-subtext">Cumulative payments</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper blue">
              <img src="assets/icons/bills.png" class="stat-3d-icon" alt="Invoices">
            </div>
            <div class="stat-info">
              <div class="stat-label">Generated Invoices</div>
              <div class="stat-value">${bills.length}</div>
              <div class="stat-subtext">Academic billing cycles</div>
            </div>
          </div>
        </div>

        <!-- Invoices Table -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Billing History</div>
          </div>
          <div class="card-body" style="padding: 0;">
            <div class="table-container" style="border: none;">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Month</th>
                    <th>Billed Amount</th>
                    <th>Paid Amount</th>
                    <th>Due Amount</th>
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
  // STUDENT / SHARED PAYMENT RECEIPTS VIEW
  // --------------------------------------------------------------------------
  async loadPayments() {
    const container = document.getElementById('viewContainer');
    container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Loading payment receipts...</div></div>';

    try {
      const data = await API.get('/api/payments');
      const payments = data.payments || [];

      const rowsHtml = payments.length === 0
        ? '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 24px;">No payment receipts recorded yet.</td></tr>'
        : payments.map(p => `
          <tr>
            <td><strong>${p.receipt_number}</strong></td>
            ${Auth.user?.role !== 'student' ? `<td>${p.student_name} (${p.student_roll})</td>` : ''}
            <td><strong>${UI.formatCurrency(p.amount)}</strong></td>
            <td>${UI.formatDate(p.payment_date)}</td>
            <td><span class="badge badge-secondary">${p.payment_method}</span></td>
            <td><code style="font-size: 11.5px; color: var(--text-secondary);">${p.transaction_reference}</code></td>
            <td><span class="badge badge-success">✓ ${p.status}</span></td>
          </tr>
        `).join('');

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              <img src="assets/icons/payments.png" style="width: 22px; height: 22px;" alt="Payments">
              Payment Receipts & Transactions
            </h2>
            <p style="font-size: 13px; color: var(--color-graphite);">Digital payment acknowledgements & reconciliation logs</p>
          </div>
          <div>
            <button class="btn btn-primary" onclick="Billing.openPaymentModal()">💳 Record New Payment</button>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">Verified Payment Transactions</div>
          </div>
          <div class="card-body" style="padding: 0;">
            <div class="table-container" style="border: none;">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    ${Auth.user?.role !== 'student' ? '<th>Student</th>' : ''}
                    <th>Amount Paid</th>
                    <th>Payment Date</th>
                    <th>Method</th>
                    <th>Reference ID</th>
                    <th>Status</th>
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
  // ADMIN BILLING MANAGEMENT DESK
  // --------------------------------------------------------------------------
  async loadAdmin(month = '', status = '', search = '') {
    const container = document.getElementById('viewContainer');
    container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Loading institutional billing desk...</div></div>';

    const currMonth = month || new Date().toISOString().slice(0, 7);

    try {
      const data = await API.get('/api/bills', { month: currMonth, status, search });
      const bills = data.bills || [];
      const summary = data.summary || {};

      const rowsHtml = bills.length === 0
        ? '<tr><td colspan="9" style="text-align: center; color: var(--text-secondary); padding: 28px;">No student bills found for the selected criteria.</td></tr>'
        : bills.map(b => `
          <tr>
            <td><strong>${b.bill_number}</strong></td>
            <td>${b.student_name} <br><span style="font-size: 11px; color: var(--text-secondary);">${b.student_roll} • ${b.hostel_room || ''}</span></td>
            <td>${b.billing_month}</td>
            <td>${UI.formatCurrency(b.total_amount)}</td>
            <td style="color: var(--success); font-weight: 600;">${UI.formatCurrency(b.paid_amount)}</td>
            <td style="color: ${b.due_amount > 0 ? 'var(--danger)' : 'var(--text-secondary)'}; font-weight: 700;">${UI.formatCurrency(b.due_amount)}</td>
            <td>
              <span class="badge ${
                b.status === 'Paid' ? 'badge-success' : 
                (b.status === 'Partially Paid' ? 'badge-warning' : 'badge-danger')
              }">
                ${b.status}
              </span>
            </td>
            <td>
              <div style="display: flex; gap: 6px;">
                <button class="btn btn-sm btn-outline" onclick="Billing.openAdjustModal(${b.id}, ${b.rebate_amount}, ${b.fine_amount}, '${b.student_name.replace(/'/g, "\\'")}', '${b.billing_month}')">Adjust</button>
                <button class="btn btn-sm btn-secondary" onclick="Billing.openRecordAdminPaymentModal(${b.id}, ${b.student_id}, ${b.due_amount}, '${b.student_name.replace(/'/g, "\\'")}')">Add Pay</button>
              </div>
            </td>
          </tr>
        `).join('');

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              <img src="assets/icons/bills.png" style="width: 22px; height: 22px;" alt="Billing">
              Billing & Fee Administration
            </h2>
            <p style="font-size: 13px; color: var(--color-graphite);">Batch invoice generation, leave rebate credits & financial reporting</p>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-secondary" onclick="Billing.exportCSV('${currMonth}')">📥 Export CSV Report</button>
            <button class="btn btn-primary" onclick="Billing.openGenerateModal('${currMonth}')">📄 Batch Generate Monthly Invoices</button>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-body" style="padding: 16px 20px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
            <div>
              <label class="form-label" style="margin-bottom: 4px; font-size: 12px;">Billing Month:</label>
              <input type="month" id="adminBillMonthInput" class="form-input" style="width: auto;" value="${currMonth}">
            </div>

            <div>
              <label class="form-label" style="margin-bottom: 4px; font-size: 12px;">Payment Status:</label>
              <select id="adminBillStatusInput" class="form-select" style="width: auto;">
                <option value="">All Statuses</option>
                <option value="Paid" ${status === 'Paid' ? 'selected' : ''}>Paid</option>
                <option value="Partially Paid" ${status === 'Partially Paid' ? 'selected' : ''}>Partially Paid</option>
                <option value="Unpaid" ${status === 'Unpaid' ? 'selected' : ''}>Unpaid</option>
                <option value="Overdue" ${status === 'Overdue' ? 'selected' : ''}>Overdue</option>
              </select>
            </div>

            <div style="flex: 1; min-width: 180px;">
              <label class="form-label" style="margin-bottom: 4px; font-size: 12px;">Search Student / Bill:</label>
              <input type="text" id="adminBillSearchInput" class="form-input" placeholder="Search roll no, student name..." value="${search}">
            </div>

            <button class="btn btn-primary" style="margin-top: 18px;" onclick="Billing.loadAdmin(document.getElementById('adminBillMonthInput').value, document.getElementById('adminBillStatusInput').value, document.getElementById('adminBillSearchInput').value)">
              Filter Bills
            </button>
          </div>
        </div>

        <!-- Overview Metric Cards (3 Equal Columns) -->
        <div class="stats-grid-3">
          <div class="stat-card">
            <div class="stat-icon-wrapper blue">
              <img src="assets/icons/bills.png" class="stat-3d-icon" alt="Invoiced">
            </div>
            <div class="stat-info">
              <div class="stat-label">Total Invoiced</div>
              <div class="stat-value">${UI.formatCurrency(summary.total_billed)}</div>
              <div class="stat-subtext">For ${currMonth}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper green">
              <img src="assets/icons/payments.png" class="stat-3d-icon" alt="Collected">
            </div>
            <div class="stat-info">
              <div class="stat-label">Total Collected</div>
              <div class="stat-value">${UI.formatCurrency(summary.total_collected)}</div>
              <div class="stat-subtext">Received into mess account</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper rose">
              <img src="assets/icons/wallet.png" class="stat-3d-icon" alt="Pending Dues">
            </div>
            <div class="stat-info">
              <div class="stat-label">Pending Dues</div>
              <div class="stat-value" style="color: var(--danger);">${UI.formatCurrency(summary.total_pending)}</div>
              <div class="stat-subtext">Awaiting payment</div>
            </div>
          </div>
        </div>

        <!-- Bills Table -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Student Invoices Roster (${currMonth})</div>
          </div>
          <div class="card-body" style="padding: 0;">
            <div class="table-container" style="border: none;">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Bill Number</th>
                    <th>Student Details</th>
                    <th>Month</th>
                    <th>Total Fee</th>
                    <th>Collected</th>
                    <th>Balance Due</th>
                    <th>Status</th>
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

  // View Detailed Invoice Modal
  async viewBillDetails(billId) {
    try {
      const data = await API.get(`/api/bills/${billId}`);
      const { bill, items, payments } = data;

      const itemsHtml = items.map(it => `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed var(--border-subtle); font-size: 13px;">
          <span>${it.description}</span>
          <span style="font-weight: 600;">${UI.formatCurrency(it.amount)}</span>
        </div>
      `).join('');

      const html = `
        <div style="background: var(--bg-subtle); padding: 14px; border-radius: var(--radius-md); margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 700; font-size: 16px;">${bill.bill_number}</div>
              <div style="font-size: 12px; color: var(--text-secondary);">Billing Cycle: <strong>${bill.billing_month}</strong> • Due: ${bill.due_date}</div>
            </div>
            <span class="badge ${bill.status === 'Paid' ? 'badge-success' : 'badge-danger'}" style="font-size: 12px;">${bill.status}</span>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <label class="form-label" style="font-size: 12px; color: var(--text-tertiary);">LINE ITEMS</label>
          ${itemsHtml}
        </div>

        <div style="background: var(--bg-surface-hover); padding: 14px; border-radius: var(--radius-md); font-size: 13px; display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Base Mess Charge:</span>
            <span>${UI.formatCurrency(bill.base_amount)}</span>
          </div>
          ${bill.rebate_amount > 0 ? `
            <div style="display: flex; justify-content: space-between; color: var(--success);">
              <span>Approved Leave Rebate:</span>
              <span>- ${UI.formatCurrency(bill.rebate_amount)}</span>
            </div>
          ` : ''}
          ${bill.fine_amount > 0 ? `
            <div style="display: flex; justify-content: space-between; color: var(--danger);">
              <span>Late Surcharge:</span>
              <span>+ ${UI.formatCurrency(bill.fine_amount)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 14.5px; border-top: 1px solid var(--border-light); padding-top: 6px;">
            <span>Total Payable:</span>
            <span>${UI.formatCurrency(bill.total_amount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; color: var(--success); font-weight: 600;">
            <span>Amount Paid:</span>
            <span>${UI.formatCurrency(bill.paid_amount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; color: var(--danger); font-weight: 700; font-size: 14px;">
            <span>Outstanding Balance:</span>
            <span>${UI.formatCurrency(bill.due_amount)}</span>
          </div>
        </div>
      `;

      UI.modal({
        title: 'Mess Invoice Breakdown',
        bodyHtml: html,
        confirmText: 'Done',
        onConfirm: () => true
      });
    } catch (err) {
      UI.toast({ title: 'Error', message: err.message, type: 'error' });
    }
  },

  // Internal Payment Modal (Student Simulation / Internal Academic Gateway)
  openPaymentModal(billId = null, dueAmount = 0) {
    const html = `
      <div style="background: var(--primary-light); border: 1px solid var(--primary-border); padding: 12px 14px; border-radius: var(--radius-md); margin-bottom: 16px;">
        <div style="font-weight: 600; color: var(--primary); font-size: 13px;">Academic Fee Settlement Portal</div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
          This is an internal academic payment simulation for IIIT Mess accounts. Instant verification and ledger credit.
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Payment Amount (INR ₹) <span class="required">*</span></label>
        <input type="number" id="payAmountInput" class="form-input" value="${dueAmount || 3800}" min="1" step="0.01" required>
      </div>

      <div class="form-group">
        <label class="form-label">Payment Channel <span class="required">*</span></label>
        <select id="payMethodInput" class="form-select" required>
          <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
          <option value="Net Banking">Institute Net Banking (SBI / Canara)</option>
          <option value="Debit Card">Debit / RuPay Card</option>
          <option value="Demand Draft">Demand Draft / Institute Chalan</option>
          <option value="Cash">Cash (Mess Counter Payment)</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Transaction Reference Number</label>
        <input type="text" id="payRefInput" class="form-input" placeholder="e.g. UPI/20241112/9901823" value="UPI/${Date.now().toString().slice(-8)}">
        <div class="form-hint">Reference ID for bank reconciliation.</div>
      </div>

      <div class="form-group">
        <label class="form-label">Remarks / Note</label>
        <input type="text" id="payNotesInput" class="form-input" placeholder="e.g. November mess fees clearance">
      </div>
    `;

    UI.modal({
      title: 'Make Mess Payment',
      bodyHtml: html,
      confirmText: 'Pay & Confirm Receipt',
      onConfirm: async () => {
        const amount = document.getElementById('payAmountInput').value;
        const payment_method = document.getElementById('payMethodInput').value;
        const transaction_reference = document.getElementById('payRefInput').value.trim();
        const notes = document.getElementById('payNotesInput').value.trim();

        if (!amount || parseFloat(amount) <= 0) {
          throw new Error('Please enter a valid payment amount.');
        }

        const res = await API.post('/api/bills/payments', {
          bill_id: billId,
          amount,
          payment_method,
          transaction_reference,
          notes
        });

        UI.toast({
          title: 'Payment Successful',
          message: `Payment registered under Receipt ${res.receiptNumber}.`,
          type: 'success'
        });

        if (window.location.hash.includes('bills')) {
          Billing.loadBills();
        } else if (window.location.hash.includes('payments')) {
          Billing.loadPayments();
        } else {
          Dashboard.load();
        }
        return true;
      }
    });
  },

  // Admin records payment on behalf of student
  openRecordAdminPaymentModal(billId, studentId, dueAmount, studentName) {
    const html = `
      <div style="background: var(--bg-subtle); padding: 12px; border-radius: var(--radius-md); margin-bottom: 16px;">
        <div style="font-weight: 700; font-size: 13.5px;">Student: ${studentName}</div>
        <div style="font-size: 12px; color: var(--text-secondary);">Current outstanding due: <strong>${UI.formatCurrency(dueAmount)}</strong></div>
      </div>

      <div class="form-group">
        <label class="form-label">Received Amount (INR ₹) <span class="required">*</span></label>
        <input type="number" id="adminPayAmount" class="form-input" value="${dueAmount || 3800}" min="1" step="0.01" required>
      </div>

      <div class="form-group">
        <label class="form-label">Payment Channel <span class="required">*</span></label>
        <select id="adminPayMethod" class="form-select" required>
          <option value="Cash">Cash (Counter Deposit)</option>
          <option value="UPI">UPI Transfer</option>
          <option value="Net Banking">Bank NEFT / RTGS</option>
          <option value="Demand Draft">Demand Draft</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Reference ID</label>
        <input type="text" id="adminPayRef" class="form-input" value="RCPT/${Date.now().toString().slice(-8)}">
      </div>
    `;

    UI.modal({
      title: 'Record Student Payment',
      bodyHtml: html,
      confirmText: 'Record & Credit Account',
      onConfirm: async () => {
        const amount = document.getElementById('adminPayAmount').value;
        const payment_method = document.getElementById('adminPayMethod').value;
        const transaction_reference = document.getElementById('adminPayRef').value.trim();

        await API.post('/api/bills/payments', {
          bill_id: billId,
          student_id: studentId,
          amount,
          payment_method,
          transaction_reference,
          notes: 'Manually logged by Mess Office'
        });

        UI.toast({ title: 'Success', message: 'Payment recorded and credited.', type: 'success' });
        const currMonth = document.getElementById('adminBillMonthInput')?.value;
        Billing.loadAdmin(currMonth);
        return true;
      }
    });
  },

  // Admin batch generates monthly bills
  openGenerateModal(defaultMonth = '') {
    const month = defaultMonth || new Date().toISOString().slice(0, 7);

    const html = `
      <div class="form-group">
        <label class="form-label">Billing Month (YYYY-MM) <span class="required">*</span></label>
        <input type="month" id="genMonthInput" class="form-input" value="${month}" required>
      </div>

      <div class="form-group">
        <label class="form-label">Base Monthly Charge (INR ₹) <span class="required">*</span></label>
        <input type="number" id="genRateInput" class="form-input" value="3800" required>
        <div class="form-hint">Standard monthly mess fee across all active students.</div>
      </div>

      <div class="form-group">
        <label class="form-label">Payment Due Date <span class="required">*</span></label>
        <input type="date" id="genDueDateInput" class="form-input" value="${month}-20" required>
      </div>
    `;

    UI.modal({
      title: 'Batch Generate Monthly Invoices',
      bodyHtml: html,
      confirmText: 'Generate for All Students',
      onConfirm: async () => {
        const billing_month = document.getElementById('genMonthInput').value;
        const base_rate = document.getElementById('genRateInput').value;
        const due_date = document.getElementById('genDueDateInput').value;

        if (!billing_month || !due_date) {
          throw new Error('Please choose month and due date.');
        }

        const res = await API.post('/api/bills/generate', {
          billing_month,
          base_rate,
          due_date
        });

        UI.toast({
          title: 'Batch Billing Finished',
          message: res.message,
          type: 'success'
        });

        Billing.loadAdmin(billing_month);
        return true;
      }
    });
  },

  // Admin adjusts rebate / fines
  openAdjustModal(billId, currentRebate, currentFine, studentName, month) {
    const html = `
      <div style="background: var(--bg-subtle); padding: 12px; border-radius: var(--radius-md); margin-bottom: 16px;">
        <div style="font-weight: 700;">Student: ${studentName}</div>
        <div style="font-size: 12px; color: var(--text-secondary);">Invoice for: ${month}</div>
      </div>

      <div class="form-group">
        <label class="form-label">Rebate Amount (INR ₹)</label>
        <input type="number" id="adjRebate" class="form-input" value="${currentRebate || 0}" min="0" step="10">
        <div class="form-hint">Deducted for approved vacation / leave days.</div>
      </div>

      <div class="form-group">
        <label class="form-label">Fine / Surcharge (INR ₹)</label>
        <input type="number" id="adjFine" class="form-input" value="${currentFine || 0}" min="0" step="10">
        <div class="form-hint">Late fee or administrative surcharge.</div>
      </div>

      <div class="form-group">
        <label class="form-label">Adjustment Remarks</label>
        <input type="text" id="adjNotes" class="form-input" placeholder="e.g. Leave approved by Warden Office">
      </div>
    `;

    UI.modal({
      title: 'Adjust Rebate / Surcharge',
      bodyHtml: html,
      confirmText: 'Apply Adjustments',
      onConfirm: async () => {
        const rebate_amount = document.getElementById('adjRebate').value;
        const fine_amount = document.getElementById('adjFine').value;
        const notes = document.getElementById('adjNotes').value.trim();

        await API.put(`/api/bills/${billId}`, {
          rebate_amount,
          fine_amount,
          notes
        });

        UI.toast({ title: 'Adjusted', message: 'Invoice recalculated and updated.', type: 'success' });
        const currMonth = document.getElementById('adminBillMonthInput')?.value;
        Billing.loadAdmin(currMonth);
        return true;
      }
    });
  },

  // Export CSV Report
  async exportCSV(month = '') {
    try {
      const blob = await API.get('/api/bills/export-csv', { month });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `iiit-mess-bills-${month || 'all'}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      UI.toast({ title: 'Exported', message: 'Billing CSV report downloaded.', type: 'success' });
    } catch (err) {
      UI.toast({ title: 'Error', message: err.message, type: 'error' });
    }
  }
};

window.Billing = Billing;
