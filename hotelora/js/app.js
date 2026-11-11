/**
 * HOTELORA - Main Customer Application Script
 * Controls homepage interactions, search form logic, and featured room cards.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Navigation Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mainNav = document.getElementById('main-nav');
  if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener('click', () => {
      mainNav.classList.toggle('show');
    });
  }

  // 2. Setup Homepage Search Form Dates
  const checkInInput = document.getElementById('search-checkin');
  const checkOutInput = document.getElementById('search-checkout');
  const searchForm = document.getElementById('hero-search-form');

  if (checkInInput && checkOutInput) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 3);

    const formatDateVal = (d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const todayStr = formatDateVal(today);
    const tomorrowStr = formatDateVal(tomorrow);
    const dayAfterStr = formatDateVal(dayAfter);

    checkInInput.min = todayStr;
    checkInInput.value = tomorrowStr;

    checkOutInput.min = tomorrowStr;
    checkOutInput.value = dayAfterStr;

    checkInInput.addEventListener('change', () => {
      const selectedIn = new Date(checkInInput.value);
      if (!isNaN(selectedIn.getTime())) {
        const nextMin = new Date(selectedIn);
        nextMin.setDate(nextMin.getDate() + 1);
        const nextMinStr = formatDateVal(nextMin);
        checkOutInput.min = nextMinStr;
        if (checkOutInput.value <= checkInInput.value) {
          checkOutInput.value = nextMinStr;
        }
      }
    });
  }

  // 3. Handle Homepage Search Submission
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const checkIn = checkInInput.value;
      const checkOut = checkOutInput.value;
      const adults = document.getElementById('search-adults').value;
      const children = document.getElementById('search-children').value;
      const rooms = document.getElementById('search-rooms').value;

      const dateValidation = Validation.validateDateRange(checkIn, checkOut);
      if (!dateValidation.valid) {
        Validation.showToast(dateValidation.message, 'error');
        return;
      }

      if (parseInt(adults, 10) < 1) {
        Validation.showToast('Please specify at least 1 adult guest.', 'error');
        return;
      }

      // Save search context to sessionStorage
      const searchParams = {
        checkIn,
        checkOut,
        adults: parseInt(adults, 10),
        children: parseInt(children, 10),
        rooms: parseInt(rooms, 10)
      };
      sessionStorage.setItem('hotelora_active_search', JSON.stringify(searchParams));

      // Redirect to rooms page with query params
      const queryStr = `checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&adults=${adults}&children=${children}&rooms=${rooms}`;
      window.location.href = `rooms.html?${queryStr}`;
    });
  }

  // 4. Render Featured Rooms on Homepage
  const featuredContainer = document.getElementById('featured-rooms-container');
  if (featuredContainer) {
    renderFeaturedRooms(featuredContainer);
  }

  // 5. Initialize Quick Details Modal handler
  initRoomModal();
});

/**
 * Render featured rooms dynamically from StorageController
 */
function renderFeaturedRooms(container) {
  const rooms = StorageController.getRooms();
  if (!rooms || rooms.length === 0) {
    container.innerHTML = `<p class="text-muted">No rooms currently available.</p>`;
    return;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const html = rooms.slice(0, 3).map(room => {
    const avail = AvailabilityEngine.checkRangeAvailability(room.id, todayStr, tomorrowStr, 1);
    let badgeClass = 'badge-available';
    let badgeText = 'Available';

    if (!avail.available || avail.remainingRooms === 0) {
      badgeClass = 'badge-full';
      badgeText = 'Sold Out';
    } else if (avail.remainingRooms <= 3) {
      badgeClass = 'badge-limited';
      badgeText = `${avail.remainingRooms} Left`;
    }

    const discountTag = room.discountPercentage > 0 
      ? `<span class="room-discount-badge">${room.discountPercentage}% OFF</span>` 
      : '';

    return `
      <article class="room-card" data-room-id="${room.id}">
        <div class="room-card-image-wrap">
          <img src="${Validation.escapeHtml(room.image)}" alt="${Validation.escapeHtml(room.name)}" class="room-card-image" loading="lazy" />
          <div class="room-card-badges">
            <span class="badge ${badgeClass}">${badgeText}</span>
            ${discountTag}
          </div>
          <div class="room-price-tag">
            From <strong>$${room.price}</strong> / night
          </div>
        </div>
        <div class="room-card-body">
          <span class="room-card-category">${Validation.escapeHtml(room.category)}</span>
          <h3 class="room-card-title">${Validation.escapeHtml(room.name)}</h3>
          <p class="room-card-desc">${Validation.escapeHtml(room.description)}</p>
          <div class="room-card-specs">
            <span class="room-spec-item" title="Room Size">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
              ${Validation.escapeHtml(room.size)}
            </span>
            <span class="room-spec-item" title="Max Guests">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
              Up to ${room.occupancy.maxGuests} Guests
            </span>
            <span class="room-spec-item" title="Bed Type">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
              ${Validation.escapeHtml(room.bedType)}
            </span>
          </div>
          <div class="room-card-actions">
            <button type="button" class="btn btn-outline btn-view-details" data-room-id="${room.id}">View Details</button>
            <a href="booking.html?roomId=${encodeURIComponent(room.id)}" class="btn btn-primary">Book Now</a>
          </div>
        </div>
      </article>
    `;
  }).join('');

  container.innerHTML = html;

  // Add click listeners to View Details buttons
  container.querySelectorAll('.btn-view-details').forEach(btn => {
    btn.addEventListener('click', () => {
      const roomId = btn.getAttribute('data-room-id');
      openRoomDetailsModal(roomId);
    });
  });
}

/**
 * Quick Room Details Modal functionality
 */
function initRoomModal() {
  const modalOverlay = document.getElementById('room-details-modal');
  if (!modalOverlay) return;

  const closeBtn = modalOverlay.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modalOverlay.classList.remove('active');
    });
  }

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('active');
    }
  });
}

function openRoomDetailsModal(roomId) {
  const room = StorageController.getRoomById(roomId);
  const modalOverlay = document.getElementById('room-details-modal');
  if (!room || !modalOverlay) return;

  const modalBody = modalOverlay.querySelector('.modal-body');
  const modalTitle = modalOverlay.querySelector('.modal-title');
  const bookBtn = modalOverlay.querySelector('#modal-book-now-btn');

  modalTitle.textContent = room.name;
  if (bookBtn) {
    bookBtn.href = `booking.html?roomId=${encodeURIComponent(room.id)}`;
  }

  const amenitiesHtml = room.amenities.map(a => 
    `<span class="amenity-chip">${Validation.escapeHtml(a)}</span>`
  ).join('');

  modalBody.innerHTML = `
    <img src="${Validation.escapeHtml(room.image)}" alt="${Validation.escapeHtml(room.name)}" class="room-modal-hero-img" />
    <div class="room-modal-grid">
      <div class="room-modal-info">
        <span class="room-card-category">${Validation.escapeHtml(room.category)}</span>
        <h3>${Validation.escapeHtml(room.name)}</h3>
        <p>${Validation.escapeHtml(room.description)}</p>
        
        <h4 style="margin-bottom: 10px; font-size: 1.05rem;">Room Amenities & Features</h4>
        <div class="room-amenities-tags" style="margin-bottom: 20px;">
          ${amenitiesHtml}
        </div>
      </div>
      <div class="room-modal-sidebar">
        <h4>Stay Specifications</h4>
        <div class="pricing-preview-item">
          <span>Standard Rate:</span>
          <strong>$${room.price} / night</strong>
        </div>
        <div class="pricing-preview-item">
          <span>Weekend Rate:</span>
          <strong>$${room.weekendPrice} / night</strong>
        </div>
        <div class="pricing-preview-item">
          <span>Max Capacity:</span>
          <span>${room.occupancy.maxGuests} Guests (${room.occupancy.adults} Adults, ${room.occupancy.children} Children)</span>
        </div>
        <div class="pricing-preview-item">
          <span>Bed Layout:</span>
          <span>${Validation.escapeHtml(room.bedType)}</span>
        </div>
        <div class="pricing-preview-item">
          <span>Room Size:</span>
          <span>${Validation.escapeHtml(room.size)}</span>
        </div>
        <div class="pricing-preview-item">
          <span>Breakfast:</span>
          <span>${room.breakfastIncluded ? 'Complimentary' : 'Available for purchase'}</span>
        </div>
        <div class="pricing-preview-item">
          <span>Balcony:</span>
          <span>${room.balcony ? 'Yes' : 'No'}</span>
        </div>
        <div class="pricing-preview-item" style="border-top: 1px solid var(--border-light); padding-top: 8px; margin-top: 8px;">
          <span>Policy:</span>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${Validation.escapeHtml(room.cancellationPolicy)}</span>
        </div>
      </div>
    </div>
  `;

  modalOverlay.classList.add('active');
}

