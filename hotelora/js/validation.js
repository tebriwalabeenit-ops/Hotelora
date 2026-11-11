/**
 * HOTELORA - Validation and Security Utility
 * Provides sanitization, field validation, and UI toast/modal helpers.
 */

const Validation = {
  // Prevent XSS injection by escaping HTML special characters
  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // Validate email address format
  isValidEmail(email) {
    if (!email) return false;
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).trim());
  },

  // Validate phone number (basic international or local format)
  isValidPhone(phone) {
    if (!phone) return false;
    const cleaned = String(phone).replace(/[\s\-\(\)\+]/g, '');
    return cleaned.length >= 7 && cleaned.length <= 15 && /^\d+$/.test(cleaned);
  },

  // Validate date strings (YYYY-MM-DD)
  isValidDate(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d instanceof Date && !isNaN(d.getTime());
  },

  // Validate check-in and check-out logic
  validateDateRange(checkInStr, checkOutStr) {
    if (!this.isValidDate(checkInStr) || !this.isValidDate(checkOutStr)) {
      return { valid: false, message: 'Please provide valid check-in and check-out dates.' };
    }

    const checkIn = new Date(checkInStr);
    checkIn.setHours(0, 0, 0, 0);

    const checkOut = new Date(checkOutStr);
    checkOut.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      return { valid: false, message: 'Check-in date cannot be earlier than today.' };
    }

    if (checkOut <= checkIn) {
      return { valid: false, message: 'Check-out date must be strictly after the check-in date.' };
    }

    const diffDays = Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    if (diffDays > 60) {
      return { valid: false, message: 'Reservations are limited to a maximum of 60 nights.' };
    }

    return { valid: true, nights: diffDays };
  },

  // Format currency consistently
  formatCurrency(amount, symbol = '$') {
    const num = Number(amount) || 0;
    return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },

  // Format dates for display (e.g. Oct 24, 2026)
  formatDisplayDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  },

  // Toast notification UI
  showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('hotelora-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'hotelora-toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    
    // Choose icon
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    }

    toast.innerHTML = `
      <span class="toast-icon">${iconSvg}</span>
      <span class="toast-message">${this.escapeHtml(message)}</span>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    });

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  }
};

