/**
 * IIIT Bhubaneswar Mess Management System
 * UI Utility Module (Toasts, Modals, Themes, Icons, Helpers)
 */

const UI = {
  // Theme Management
  initTheme() {
    const savedTheme = localStorage.getItem('mess_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeImg = document.getElementById('themeIconImg');
    if (themeImg) {
      themeImg.src = savedTheme === 'dark' ? 'assets/icons/sun.png' : 'assets/icons/moon.png';
    }
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('mess_theme', next);
    const themeImg = document.getElementById('themeIconImg');
    if (themeImg) {
      themeImg.src = next === 'dark' ? 'assets/icons/sun.png' : 'assets/icons/moon.png';
    }
    this.toast({
      title: 'Theme Updated',
      message: `Switched to ${next} mode.`,
      type: 'info'
    });
  },

  // Render Lucide Icons
  renderIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  },

  // Toast Notifications
  toast({ title, message, type = 'info', duration = 4000 }) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;

    const iconMap = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toastEl.innerHTML = `
      <div style="font-weight: 700; color: var(--${type === 'info' ? 'primary' : type}); font-size: 14px;">${iconMap[type] || 'ℹ'}</div>
      <div class="toast-content">
        <div class="toast-title">${title || ''}</div>
        <div class="toast-message">${message || ''}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toastEl);

    setTimeout(() => {
      if (toastEl.parentElement) {
        toastEl.style.opacity = '0';
        toastEl.style.transform = 'translateY(8px)';
        toastEl.style.transition = 'all 200ms ease';
        setTimeout(() => toastEl.remove(), 200);
      }
    }, duration);
  },

  // Modal Dialog
  modal({ title, bodyHtml, confirmText = 'Confirm', cancelText = 'Cancel', isDestructive = false, onConfirm = null }) {
    let backdrop = document.getElementById('globalModalBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'globalModalBackdrop';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }

    backdrop.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close-btn" id="modalCloseBtn">✕</button>
        </div>
        <div class="modal-body" id="modalBodyContent">
          ${bodyHtml}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="modalCancelBtn">${cancelText}</button>
          <button class="btn ${isDestructive ? 'btn-danger' : 'btn-primary'}" id="modalConfirmBtn">${confirmText}</button>
        </div>
      </div>
    `;

    backdrop.classList.add('active');
    this.renderIcons();

    const closeModal = () => {
      backdrop.classList.remove('active');
    };

    document.getElementById('modalCloseBtn').onclick = closeModal;
    document.getElementById('modalCancelBtn').onclick = closeModal;
    backdrop.onclick = (e) => {
      if (e.target === backdrop) closeModal();
    };

    const confirmBtn = document.getElementById('modalConfirmBtn');
    if (onConfirm) {
      confirmBtn.onclick = async () => {
        confirmBtn.disabled = true;
        const prevText = confirmBtn.textContent;
        confirmBtn.textContent = 'Processing...';
        try {
          const res = await onConfirm();
          if (res !== false) {
            closeModal();
          }
        } catch (err) {
          UI.toast({ title: 'Error', message: err.message, type: 'error' });
        } finally {
          confirmBtn.disabled = false;
          confirmBtn.textContent = prevText;
        }
      };
    } else {
      confirmBtn.onclick = closeModal;
    }
  },

  closeModal() {
    const backdrop = document.getElementById('globalModalBackdrop');
    if (backdrop) backdrop.classList.remove('active');
  },

  // Confirmation Alert Dialog
  confirm({ title = 'Are you sure?', message, confirmText = 'Confirm', isDestructive = false, onConfirm }) {
    this.modal({
      title,
      bodyHtml: `<p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.5;">${message}</p>`,
      confirmText,
      isDestructive,
      onConfirm
    });
  },

  // Format INR Currency
  formatCurrency(num) {
    const val = parseFloat(num) || 0;
    return '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  // Format Date String
  formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  },

  // Format Time String
  formatTime(dateTimeStr) {
    if (!dateTimeStr) return '—';
    try {
      const d = new Date(dateTimeStr);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return dateTimeStr;
    }
  }
};

window.UI = UI;
