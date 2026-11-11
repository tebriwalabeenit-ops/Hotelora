/**
 * HOTELORA - Hotel Administration Dashboard Controller
 * Powers Overview stats, Room CRUD, Bookings table, Live Pricing Editor, Guest Directory, and Reports.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Demonstration Authentication Handler
  const loginModal = document.getElementById('admin-login-modal');
  const loginForm = document.getElementById('admin-login-form');
  const quickLoginBtn = document.getElementById('btn-quick-demo-login');
  const logoutBtn = document.getElementById('btn-admin-logout');
  const loginErrorMsg = document.getElementById('login-error-msg');

  function checkAuth() {
    if (!StorageController.isAdminLoggedIn()) {
      if (loginModal) loginModal.classList.add('active');
    } else {
      if (loginModal) loginModal.classList.remove('active');
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pass = document.getElementById('admin-login-pass').value;
      if (pass === 'admin123' || pass === 'admin') {
        StorageController.setAdminLoggedIn(true);
        if (loginErrorMsg) loginErrorMsg.style.display = 'none';
        if (loginModal) loginModal.classList.remove('active');
        Validation.showToast('Welcome to HOTELORA Administration Dashboard', 'success');
        renderOverview();
      } else {
        if (loginErrorMsg) loginErrorMsg.style.display = 'block';
      }
    });
  }

  if (quickLoginBtn) {
    quickLoginBtn.addEventListener('click', () => {
      StorageController.setAdminLoggedIn(true);
      if (loginModal) loginModal.classList.remove('active');
      Validation.showToast('Welcome to HOTELORA Administration Dashboard (Demo Access)', 'success');
      renderOverview();
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      StorageController.setAdminLoggedIn(false);
      checkAuth();
      Validation.showToast('Logged out of Admin Portal.', 'info');
    });
  }

  checkAuth();

  // Mobile sidebar toggle
  const mobileToggle = document.getElementById('mobile-admin-toggle');
  const adminSidebar = document.getElementById('admin-sidebar');
  if (mobileToggle && adminSidebar) {
    mobileToggle.addEventListener('click', () => {
      adminSidebar.classList.toggle('open');
    });
  }

  // Navigation tab switcher
  const navItems = document.querySelectorAll('.admin-nav-item');
  const sections = document.querySelectorAll('.admin-section');
  const pageTitle = document.getElementById('admin-section-heading');
  const pageSub = document.getElementById('admin-section-sub');

  const sectionTitles = {
    overview: { title: 'Dashboard Overview', sub: 'Real-time property metrics, daily occupancy, and financial status.' },
    rooms: { title: 'Room Category Management', sub: 'Configure room types, inventories, descriptions, and imagery.' },
    calendar: { title: 'Availability Calendar', sub: 'Comprehensive property occupancy status and calendar view.' },
    bookings: { title: 'Reservation Management', sub: 'Track, approve, update, or cancel guest bookings.' },
    pricing: { title: 'Dynamic Pricing Management', sub: 'Set base rates, weekend multipliers, discounts, and tax rates.' },
    guests: { title: 'Guest Profiles & Directory', sub: 'Guest communication history, booking frequency, and spend.' },
    reports: { title: 'Analytics & Performance Reports', sub: 'Occupancy analysis, category popularity, and revenue metrics.' },
    settings: { title: 'System & Property Settings', sub: 'Hotel contact information and demo dataset reset.' }
  };

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetSec = item.getAttribute('data-section');
      if (!targetSec) return;

      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      sections.forEach(s => s.classList.remove('active'));
      const activeSecEl = document.getElementById(`sec-${targetSec}`);
      if (activeSecEl) activeSecEl.classList.add('active');

      if (sectionTitles[targetSec]) {
        pageTitle.textContent = sectionTitles[targetSec].title;
        pageSub.textContent = sectionTitles[targetSec].sub;
      }

      // Close mobile sidebar if open
      if (adminSidebar) adminSidebar.classList.remove('open');

      // Refresh section data
      refreshSection(targetSec);
    });
  });

  function refreshSection(secName) {
    switch (secName) {
      case 'overview': renderOverview(); break;
      case 'rooms': renderRoomsTable(); break;
      case 'calendar': renderAdminCalendar(); break;
      case 'bookings': renderBookingsTable(); break;
      case 'pricing': renderPricingTable(); break;
      case 'guests': renderGuestsTable(); break;
      case 'reports': renderReports('all'); break;
      case 'settings': renderSettings(); break;
    }
  }

  // ==========================================
  // 1. OVERVIEW SECTION
  // ==========================================
  function renderOverview() {
    const rooms = StorageController.getRooms();
    const bookings = StorageController.getBookings();

    const totalRooms = rooms.reduce((acc, r) => acc + (parseInt(r.inventory, 10) || 1), 0);
    const todayStr = new Date().toISOString().split('T')[0];

    // Compute occupied rooms today
    let occupiedToday = 0;
    rooms.forEach(r => {
      occupiedToday += AvailabilityEngine.getBookedRoomsCountOnDate(r.id, todayStr);
    });
    const availableToday = Math.max(0, totalRooms - occupiedToday);

    const totalBookingsCount = bookings.length;
    const pendingBookings = bookings.filter(b => b.status === 'Pending').length;
    const confirmedBookings = bookings.filter(b => b.status === 'Confirmed').length;
    const cancelledBookings = bookings.filter(b => b.status === 'Cancelled').length;

    // Revenue from confirmed + completed
    const revenue = bookings
      .filter(b => b.status === 'Confirmed' || b.status === 'Completed')
      .reduce((sum, b) => sum + (parseFloat(b.total) || 0), 0);

    // Update stats widgets
    document.getElementById('stat-total-rooms').textContent = totalRooms;
    document.getElementById('stat-avail-today').textContent = availableToday;
    document.getElementById('stat-occupied-today').textContent = occupiedToday;
    document.getElementById('stat-total-bookings').textContent = totalBookingsCount;
    document.getElementById('stat-pending-bookings').textContent = pendingBookings;
    document.getElementById('stat-cancelled-bookings').textContent = cancelledBookings;
    document.getElementById('stat-revenue').textContent = Validation.formatCurrency(revenue);

    // Render recent bookings table in overview
    const recentTableMount = document.getElementById('overview-recent-bookings-mount');
    const recentList = bookings.slice(0, 5);

    if (recentList.length === 0) {
      recentTableMount.innerHTML = `<tr><td colspan="6" class="text-muted" style="text-align: center;">No reservations recorded yet.</td></tr>`;
    } else {
      recentTableMount.innerHTML = recentList.map(b => {
        let badgeClass = 'badge-confirmed';
        if (b.status === 'Pending') badgeClass = 'badge-pending';
        else if (b.status === 'Cancelled') badgeClass = 'badge-cancelled';
        else if (b.status === 'Completed') badgeClass = 'badge-completed';

        return `
          <tr>
            <td><strong>${b.bookingId}</strong></td>
            <td>${Validation.escapeHtml(b.guestName)}</td>
            <td>${Validation.escapeHtml(b.roomName)}</td>
            <td>${Validation.formatDisplayDate(b.checkIn)}</td>
            <td><strong>${Validation.formatCurrency(b.total)}</strong></td>
            <td><span class="badge ${badgeClass}">${b.status}</span></td>
          </tr>
        `;
      }).join('');
    }

    // Occupancy bar breakdown in overview
    const occMount = document.getElementById('overview-occupancy-bars-mount');
    occMount.innerHTML = rooms.map(r => {
      const booked = AvailabilityEngine.getBookedRoomsCountOnDate(r.id, todayStr);
      const total = parseInt(r.inventory, 10) || 1;
      const pct = Math.min(100, Math.round((booked / total) * 100));

      return `
        <div class="bar-chart-row">
          <div class="bar-chart-label" title="${Validation.escapeHtml(r.name)}">${Validation.escapeHtml(r.name)}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${pct}%;"></div>
          </div>
          <div class="bar-val">${booked} / ${total} (${pct}%)</div>
        </div>
      `;
    }).join('');
  }

  // ==========================================
  // 2. ROOM MANAGEMENT SECTION
  // ==========================================
  const roomModal = document.getElementById('admin-room-modal');
  const roomForm = document.getElementById('admin-room-form');
  const roomModalTitle = document.getElementById('admin-room-modal-title');
  const btnAddNewRoom = document.getElementById('btn-add-room');

  function renderRoomsTable() {
    const rooms = StorageController.getRooms();
    const mount = document.getElementById('admin-rooms-table-mount');

    mount.innerHTML = rooms.map(r => {
      return `
        <tr>
          <td>
            <img src="${Validation.escapeHtml(r.image)}" alt="${Validation.escapeHtml(r.name)}" style="width: 60px; height: 42px; object-fit: cover; border-radius: 4px;" />
          </td>
          <td>
            <strong>${Validation.escapeHtml(r.name)}</strong><br/>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${Validation.escapeHtml(r.category)}</span>
          </td>
          <td>${r.inventory} Units</td>
          <td>$${r.price} (Weekend: $${r.weekendPrice})</td>
          <td>Max ${r.occupancy.maxGuests} (${r.occupancy.adults}A, ${r.occupancy.children}C)</td>
          <td>${Validation.escapeHtml(r.bedType)}</td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn btn-outline btn-sm btn-edit-room" data-id="${r.id}">Edit</button>
              <button type="button" class="btn btn-sm btn-delete-room" data-id="${r.id}" style="color: var(--status-full); border: 1px solid rgba(239,68,68,0.3);">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach Edit and Delete listeners
    mount.querySelectorAll('.btn-edit-room').forEach(btn => {
      btn.addEventListener('click', () => {
        const rId = btn.getAttribute('data-id');
        openEditRoomModal(rId);
      });
    });

    mount.querySelectorAll('.btn-delete-room').forEach(btn => {
      btn.addEventListener('click', () => {
        const rId = btn.getAttribute('data-id');
        deleteRoomPrompt(rId);
      });
    });
  }

  if (btnAddNewRoom) {
    btnAddNewRoom.addEventListener('click', () => {
      openAddRoomModal();
    });
  }

  function openAddRoomModal() {
    roomForm.reset();
    document.getElementById('room-form-id').value = '';
    roomModalTitle.textContent = 'Add New Room Category';
    roomModal.classList.add('active');
  }

  function openEditRoomModal(id) {
    const room = StorageController.getRoomById(id);
    if (!room) return;

    document.getElementById('room-form-id').value = room.id;
    document.getElementById('room-form-name').value = room.name;
    document.getElementById('room-form-category').value = room.category;
    document.getElementById('room-form-price').value = room.price;
    document.getElementById('room-form-weekend').value = room.weekendPrice || Math.round(room.price * 1.2);
    document.getElementById('room-form-inventory').value = room.inventory;
    document.getElementById('room-form-adults').value = room.occupancy.adults;
    document.getElementById('room-form-children').value = room.occupancy.children;
    document.getElementById('room-form-bed').value = room.bedType;
    document.getElementById('room-form-size').value = room.size;
    document.getElementById('room-form-image').value = room.image;
    document.getElementById('room-form-desc').value = room.description;
    document.getElementById('room-form-amenities').value = (room.amenities || []).join(', ');
    document.getElementById('room-form-balcony').checked = !!room.balcony;
    document.getElementById('room-form-breakfast').checked = !!room.breakfastIncluded;

    roomModalTitle.textContent = `Edit: ${room.name}`;
    roomModal.classList.add('active');
  }

  function deleteRoomPrompt(id) {
    const room = StorageController.getRoomById(id);
    if (!room) return;

    // Check if room has active bookings
    const activeBookings = StorageController.getBookings().filter(b => 
      b.roomId === id && (b.status === 'Confirmed' || b.status === 'Pending')
    );

    if (activeBookings.length > 0) {
      Validation.showToast(`Cannot delete "${room.name}" because it has ${activeBookings.length} active reservation(s).`, 'error');
      return;
    }

    if (confirm(`Are you sure you want to delete room category "${room.name}"?`)) {
      StorageController.deleteRoom(id);
      Validation.showToast(`Room category "${room.name}" has been deleted.`, 'success');
      renderRoomsTable();
    }
  }

  // Room form submission
  if (roomForm) {
    roomForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const existingId = document.getElementById('room-form-id').value;
      const name = document.getElementById('room-form-name').value.trim();
      const category = document.getElementById('room-form-category').value.trim();
      const price = parseFloat(document.getElementById('room-form-price').value) || 120;
      const weekendPrice = parseFloat(document.getElementById('room-form-weekend').value) || price;
      const inventory = parseInt(document.getElementById('room-form-inventory').value, 10) || 5;
      const adults = parseInt(document.getElementById('room-form-adults').value, 10) || 2;
      const children = parseInt(document.getElementById('room-form-children').value, 10) || 1;
      const bedType = document.getElementById('room-form-bed').value.trim();
      const size = document.getElementById('room-form-size').value.trim();
      let image = document.getElementById('room-form-image').value.trim();
      const description = document.getElementById('room-form-desc').value.trim();
      const amenitiesStr = document.getElementById('room-form-amenities').value.trim();
      const balcony = document.getElementById('room-form-balcony').checked;
      const breakfastIncluded = document.getElementById('room-form-breakfast').checked;

      if (!image) {
        image = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80';
      }

      const amenities = amenitiesStr ? amenitiesStr.split(',').map(s => s.trim()).filter(Boolean) : ['Free Wi-Fi', 'Air Conditioning'];

      const roomData = {
        id: existingId || ('rm-' + Date.now().toString(36)),
        name,
        category,
        price,
        weekendPrice,
        seasonalPrice: Math.round(price * 1.1),
        discountPercentage: 0,
        inventory,
        occupancy: {
          adults,
          children,
          maxGuests: adults + children
        },
        bedType,
        size,
        image,
        description,
        amenities,
        balcony,
        breakfastIncluded,
        cancellationPolicy: 'Free cancellation up to 24 hours prior to check-in'
      };

      StorageController.saveRoom(roomData);
      roomModal.classList.remove('active');
      Validation.showToast(`Room category "${name}" saved successfully!`, 'success');
      renderRoomsTable();
    });
  }

  // ==========================================
  // 3. AVAILABILITY CALENDAR SECTION
  // ==========================================
  function renderAdminCalendar() {
    const mount = document.getElementById('admin-calendar-mount');
    if (mount) {
      AvailabilityEngine.renderCalendar(mount, {
        interactive: false
      });
    }
  }

  // ==========================================
  // 4. BOOKINGS MANAGEMENT SECTION
  // ==========================================
  let bookingFilterStatus = 'all';
  let bookingSearchTerm = '';
  const bookingFilterSelect = document.getElementById('admin-booking-filter');
  const bookingSearchInput = document.getElementById('admin-booking-search');

  function renderBookingsTable() {
    const allBookings = StorageController.getBookings();
    const mount = document.getElementById('admin-bookings-table-mount');

    const filtered = allBookings.filter(b => {
      if (bookingFilterStatus !== 'all' && b.status !== bookingFilterStatus) return false;
      if (bookingSearchTerm) {
        const q = bookingSearchTerm.toLowerCase();
        const idM = b.bookingId && b.bookingId.toLowerCase().includes(q);
        const nameM = b.guestName && b.guestName.toLowerCase().includes(q);
        const emailM = b.email && b.email.toLowerCase().includes(q);
        if (!idM && !nameM && !emailM) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      mount.innerHTML = `<tr><td colspan="7" class="text-muted" style="text-align: center; padding: 30px;">No matching reservations found.</td></tr>`;
      return;
    }

    mount.innerHTML = filtered.map(b => {
      let badgeClass = 'badge-confirmed';
      if (b.status === 'Pending') badgeClass = 'badge-pending';
      else if (b.status === 'Cancelled') badgeClass = 'badge-cancelled';
      else if (b.status === 'Completed') badgeClass = 'badge-completed';

      return `
        <tr>
          <td><strong>${b.bookingId}</strong></td>
          <td>
            <strong>${Validation.escapeHtml(b.guestName)}</strong><br/>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${Validation.escapeHtml(b.email)}</span>
          </td>
          <td>${Validation.escapeHtml(b.roomName)}</td>
          <td>${Validation.formatDisplayDate(b.checkIn)} &rarr; ${Validation.formatDisplayDate(b.checkOut)}</td>
          <td><strong>${Validation.formatCurrency(b.total)}</strong></td>
          <td>
            <select class="form-select status-change-select" data-id="${b.bookingId}" style="padding: 4px 8px; font-size: 0.82rem; width: auto;">
              <option value="Confirmed" ${b.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="Pending" ${b.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Completed" ${b.status === 'Completed' ? 'selected' : ''}>Completed</option>
              <option value="Cancelled" ${b.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td>
            <button type="button" class="btn btn-outline btn-sm btn-admin-view-booking" data-id="${b.bookingId}">Details</button>
          </td>
        </tr>
      `;
    }).join('');

    // Status change listener
    mount.querySelectorAll('.status-change-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        const newStatus = e.target.value;
        StorageController.updateBookingStatus(id, newStatus);
        Validation.showToast(`Booking ${id} status updated to ${newStatus}.`, 'info');
      });
    });

    // Details viewer
    mount.querySelectorAll('.btn-admin-view-booking').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openAdminBookingModal(id);
      });
    });
  }

  if (bookingFilterSelect) {
    bookingFilterSelect.addEventListener('change', (e) => {
      bookingFilterStatus = e.target.value;
      renderBookingsTable();
    });
  }

  if (bookingSearchInput) {
    bookingSearchInput.addEventListener('input', (e) => {
      bookingSearchTerm = e.target.value.trim();
      renderBookingsTable();
    });
  }

  function openAdminBookingModal(id) {
    const b = StorageController.getBookingById(id);
    const modal = document.getElementById('admin-booking-view-modal');
    const body = document.getElementById('admin-booking-view-body');
    if (!b || !modal) return;

    body.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 0.92rem; margin-bottom: 20px;">
        <div><span>Booking Reference:</span> <strong>${b.bookingId}</strong></div>
        <div><span>Status:</span> <strong>${b.status}</strong></div>
        <div><span>Guest Name:</span> <strong>${Validation.escapeHtml(b.guestName)}</strong></div>
        <div><span>Email Address:</span> <strong>${Validation.escapeHtml(b.email)}</strong></div>
        <div><span>Phone:</span> <strong>${Validation.escapeHtml(b.phone)}</strong></div>
        <div><span>Country:</span> <strong>${Validation.escapeHtml(b.country || 'N/A')}</strong></div>
        <div><span>Room:</span> <strong>${Validation.escapeHtml(b.roomName)}</strong></div>
        <div><span>Rooms Booked:</span> <strong>${b.numberOfRooms} Room(s)</strong></div>
        <div><span>Check-In:</span> <strong>${Validation.formatDisplayDate(b.checkIn)}</strong></div>
        <div><span>Check-Out:</span> <strong>${Validation.formatDisplayDate(b.checkOut)}</strong></div>
        <div><span>Guests:</span> <strong>${b.adults} Adults, ${b.children || 0} Children</strong></div>
        <div><span>Arrival Window:</span> <strong>${b.arrivalTime || '15:00'}</strong></div>
      </div>
      <div style="background: var(--bg-cream); padding: 14px; border-radius: 6px; font-size: 0.88rem; margin-bottom: 16px;">
        <strong>Special Requests:</strong> ${b.specialRequests && b.specialRequests.length ? b.specialRequests.join(', ') : 'None'}<br/>
        <strong>Special Instructions:</strong> <em>${Validation.escapeHtml(b.instructions || 'None provided')}</em><br/>
        ${b.cancellationReason ? `<strong style="color:var(--status-full);">Cancellation Reason:</strong> ${Validation.escapeHtml(b.cancellationReason)}` : ''}
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid var(--border-color);">
        <span style="font-size: 1.1rem; font-weight: 600;">Calculated Revenue:</span>
        <span style="font-size: 1.4rem; font-weight: 700; color: var(--primary-gold-dark);">${Validation.formatCurrency(b.total)}</span>
      </div>
    `;

    modal.classList.add('active');
  }

  // ==========================================
  // 5. PRICING MANAGEMENT SECTION
  // ==========================================
  function renderPricingTable() {
    const rooms = StorageController.getRooms();
    const config = StorageController.getPricingConfig();
    const mount = document.getElementById('admin-pricing-table-mount');

    // Global settings inputs
    document.getElementById('pricing-tax-rate').value = config.taxRate || 12;
    document.getElementById('pricing-extra-guest').value = config.extraGuestCharge || 35;
    document.getElementById('pricing-breakfast').value = config.breakfastCharge || 25;

    mount.innerHTML = rooms.map(r => {
      return `
        <tr data-room-id="${r.id}">
          <td><strong>${Validation.escapeHtml(r.name)}</strong></td>
          <td>
            <input type="number" class="pricing-table-input price-base" value="${r.price}" min="50" step="5" />
          </td>
          <td>
            <input type="number" class="pricing-table-input price-weekend" value="${r.weekendPrice || r.price}" min="50" step="5" />
          </td>
          <td>
            <input type="number" class="pricing-table-input price-seasonal" value="${r.seasonalPrice || r.price}" min="50" step="5" />
          </td>
          <td>
            <input type="number" class="pricing-table-input price-discount" value="${r.discountPercentage || 0}" min="0" max="80" step="1" /> %
          </td>
          <td>
            <input type="number" class="pricing-table-input price-inventory" value="${r.inventory}" min="1" max="100" step="1" />
          </td>
        </tr>
      `;
    }).join('');
  }

  // Save all pricing button
  const savePricingBtn = document.getElementById('btn-save-pricing');
  if (savePricingBtn) {
    savePricingBtn.addEventListener('click', () => {
      const config = StorageController.getPricingConfig();
      config.taxRate = parseFloat(document.getElementById('pricing-tax-rate').value) || 12;
      config.extraGuestCharge = parseFloat(document.getElementById('pricing-extra-guest').value) || 35;
      config.breakfastCharge = parseFloat(document.getElementById('pricing-breakfast').value) || 25;
      StorageController.savePricingConfig(config);

      // Save room rates
      const rows = document.querySelectorAll('#admin-pricing-table-mount tr');
      rows.forEach(tr => {
        const rId = tr.getAttribute('data-room-id');
        const room = StorageController.getRoomById(rId);
        if (room) {
          room.price = parseFloat(tr.querySelector('.price-base').value) || room.price;
          room.weekendPrice = parseFloat(tr.querySelector('.price-weekend').value) || room.weekendPrice;
          room.seasonalPrice = parseFloat(tr.querySelector('.price-seasonal').value) || room.seasonalPrice;
          room.discountPercentage = parseFloat(tr.querySelector('.price-discount').value) || 0;
          room.inventory = parseInt(tr.querySelector('.price-inventory').value, 10) || room.inventory;
          StorageController.saveRoom(room);
        }
      });

      Validation.showToast('All room prices, inventories, and surcharge parameters updated successfully! Customer interface reflects changes immediately.', 'success');
    });
  }

  // ==========================================
  // 6. GUEST MANAGEMENT SECTION
  // ==========================================
  function renderGuestsTable() {
    const bookings = StorageController.getBookings();
    const guestMap = new Map();

    bookings.forEach(b => {
      const email = (b.email || '').toLowerCase().trim();
      if (!email) return;

      if (!guestMap.has(email)) {
        guestMap.set(email, {
          name: b.guestName,
          email: b.email,
          phone: b.phone,
          country: b.country || 'N/A',
          totalBookings: 0,
          totalSpend: 0,
          lastBookingDate: b.createdAt || b.checkIn
        });
      }

      const rec = guestMap.get(email);
      rec.totalBookings++;
      if (b.status === 'Confirmed' || b.status === 'Completed') {
        rec.totalSpend += (parseFloat(b.total) || 0);
      }
    });

    const guestsList = Array.from(guestMap.values());
    const mount = document.getElementById('admin-guests-table-mount');

    if (guestsList.length === 0) {
      mount.innerHTML = `<tr><td colspan="6" class="text-muted" style="text-align: center;">No guest records yet.</td></tr>`;
      return;
    }

    mount.innerHTML = guestsList.map(g => {
      return `
        <tr>
          <td><strong>${Validation.escapeHtml(g.name)}</strong></td>
          <td>${Validation.escapeHtml(g.email)}</td>
          <td>${Validation.escapeHtml(g.phone)}</td>
          <td>${Validation.escapeHtml(g.country)}</td>
          <td><strong>${g.totalBookings}</strong> Stays</td>
          <td><strong style="color:var(--primary-gold-dark);">${Validation.formatCurrency(g.totalSpend)}</strong></td>
        </tr>
      `;
    }).join('');
  }

  // ==========================================
  // 7. REPORTS & ANALYTICS SECTION
  // ==========================================
  const reportFilterButtons = document.querySelectorAll('.report-date-btn');
  reportFilterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      reportFilterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderReports(btn.getAttribute('data-range'));
    });
  });

  function renderReports(timeframe = 'all') {
    const allBookings = StorageController.getBookings();
    const rooms = StorageController.getRooms();

    const now = new Date();
    const filteredBookings = allBookings.filter(b => {
      if (timeframe === 'all') return true;
      const bDate = new Date(b.createdAt || (b.checkIn + 'T00:00:00'));
      const diffDays = (now - bDate) / (1000 * 60 * 60 * 24);

      if (timeframe === 'today') return diffDays <= 1;
      if (timeframe === '7days') return diffDays <= 7;
      if (timeframe === '30days') return diffDays <= 30;
      return true;
    });

    const totalReservations = filteredBookings.length;
    const confirmedList = filteredBookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed');
    const cancelledCount = filteredBookings.filter(b => b.status === 'Cancelled').length;
    
    const totalRev = confirmedList.reduce((sum, b) => sum + (parseFloat(b.total) || 0), 0);
    const avgValue = confirmedList.length > 0 ? (totalRev / confirmedList.length) : 0;

    // Room popularity breakdown
    const roomBookingCounts = {};
    rooms.forEach(r => { roomBookingCounts[r.name] = 0; });
    filteredBookings.forEach(b => {
      const rName = b.roomName || 'Other';
      roomBookingCounts[rName] = (roomBookingCounts[rName] || 0) + 1;
    });

    let mostPopularName = 'N/A';
    let highestCount = -1;
    for (const [name, count] of Object.entries(roomBookingCounts)) {
      if (count > highestCount) {
        highestCount = count;
        mostPopularName = name;
      }
    }

    // Occupancy estimation (average)
    const totalInventoryRooms = rooms.reduce((acc, r) => acc + (parseInt(r.inventory, 10) || 1), 0);
    const totalRoomNightsBooked = confirmedList.reduce((sum, b) => sum + ((b.nights || 1) * (b.numberOfRooms || 1)), 0);
    const estimatedCapacityDays = totalInventoryRooms * (timeframe === '7days' ? 7 : (timeframe === '30days' ? 30 : 60));
    const occupancyRate = estimatedCapacityDays > 0 ? Math.min(100, Math.round((totalRoomNightsBooked / estimatedCapacityDays) * 100)) : 0;

    // Render KPI numbers
    document.getElementById('report-total-res').textContent = totalReservations;
    document.getElementById('report-total-rev').textContent = Validation.formatCurrency(totalRev);
    document.getElementById('report-avg-val').textContent = Validation.formatCurrency(avgValue);
    document.getElementById('report-popular-room').textContent = mostPopularName;
    document.getElementById('report-cancellations').textContent = cancelledCount;
    document.getElementById('report-occupancy').textContent = `${occupancyRate}%`;

    // Render Popularity Chart
    const chartMount = document.getElementById('report-popularity-chart-mount');
    const maxVal = Math.max(1, ...Object.values(roomBookingCounts));

    chartMount.innerHTML = Object.entries(roomBookingCounts).map(([name, count]) => {
      const pct = Math.round((count / maxVal) * 100);
      return `
        <div class="bar-chart-row">
          <div class="bar-chart-label" title="${Validation.escapeHtml(name)}">${Validation.escapeHtml(name)}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${pct}%;"></div>
          </div>
          <div class="bar-val">${count} stays</div>
        </div>
      `;
    }).join('');
  }

  // ==========================================
  // 8. SETTINGS & DEMO RESET
  // ==========================================
  function renderSettings() {
    const settings = StorageController.getSettings();
    document.getElementById('set-hotel-name').value = settings.hotelName || '';
    document.getElementById('set-hotel-email').value = settings.email || '';
    document.getElementById('set-hotel-phone').value = settings.phone || '';
    document.getElementById('set-hotel-address').value = settings.address || '';
  }

  const saveSettingsBtn = document.getElementById('btn-save-settings');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      const settings = {
        hotelName: document.getElementById('set-hotel-name').value.trim(),
        email: document.getElementById('set-hotel-email').value.trim(),
        phone: document.getElementById('set-hotel-phone').value.trim(),
        address: document.getElementById('set-hotel-address').value.trim(),
        checkInTime: '15:00',
        checkOutTime: '11:00'
      };
      StorageController.saveSettings(settings);
      Validation.showToast('Hotel settings updated successfully.', 'success');
    });
  }

  const btnResetDemo = document.getElementById('btn-reset-demo-data');
  if (btnResetDemo) {
    btnResetDemo.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all data back to the default demo state? All your custom bookings and edits will be re-initialized.')) {
        StorageController.resetDemoData();
        Validation.showToast('Demo data successfully re-initialized!', 'success');
        refreshSection('overview');
      }
    });
  }

  // Modal close handlers
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.querySelectorAll('.modal-close').forEach(b => {
      b.addEventListener('click', () => m.classList.remove('active'));
    });
    m.addEventListener('click', (e) => {
      if (e.target === m) m.classList.remove('active');
    });
  });

  // Initial load
  renderOverview();
});

