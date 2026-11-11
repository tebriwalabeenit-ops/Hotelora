/**
 * HOTELORA - Rooms Catalog, Comparison & Calendar Controller
 * Handles room filtering, dynamic status calculation, 3-room comparison, and modal views.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mainNav = document.getElementById('main-nav');
  if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener('click', () => mainNav.classList.toggle('show'));
  }

  // Parse query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const activeCheckIn = urlParams.get('checkIn') || '';
  const activeCheckOut = urlParams.get('checkOut') || '';
  const activeAdults = parseInt(urlParams.get('adults'), 10) || 2;
  const activeChildren = parseInt(urlParams.get('children'), 10) || 0;
  const activeRooms = parseInt(urlParams.get('rooms'), 10) || 1;

  // Selected comparison rooms state (array of room IDs, max 3)
  const compareSelection = new Set();

  // State for filtering
  let currentCategory = 'all';
  let maxPrice = 1000;
  let bedFilter = 'all';
  let sortBy = 'default';

  // DOM Elements
  const roomsContainer = document.getElementById('rooms-list-container');
  const categoryFilter = document.getElementById('filter-category');
  const priceFilter = document.getElementById('filter-price');
  const priceValueLabel = document.getElementById('filter-price-val');
  const bedTypeFilter = document.getElementById('filter-bed');
  const sortSelect = document.getElementById('sort-rooms');
  const calendarContainer = document.getElementById('rooms-calendar-mount');
  const toggleCalBtn = document.getElementById('btn-toggle-calendar');
  const calendarSection = document.getElementById('rooms-calendar-section');

  // Floating dock elements
  const comparisonDock = document.getElementById('comparison-dock');
  const dockCounter = document.getElementById('dock-counter');
  const dockCompareBtn = document.getElementById('dock-compare-btn');
  const dockClearBtn = document.getElementById('dock-clear-btn');

  // Comparison Modal elements
  const comparisonModal = document.getElementById('room-comparison-modal');
  const comparisonTableBody = document.getElementById('comparison-table-mount');

  // 1. Initialize interactive calendar in Rooms page
  if (calendarContainer) {
    AvailabilityEngine.renderCalendar(calendarContainer, {
      selectedCheckIn: activeCheckIn || null,
      selectedCheckOut: activeCheckOut || null,
      interactive: true,
      onDateSelect: (checkIn, checkOut) => {
        if (checkIn && checkOut) {
          // Update URL params without reloading or refresh view
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('checkIn', checkIn);
          newUrl.searchParams.set('checkOut', checkOut);
          window.history.replaceState({}, '', newUrl);
          renderRooms();
          Validation.showToast(`Selected stay: ${Validation.formatDisplayDate(checkIn)} to ${Validation.formatDisplayDate(checkOut)}`, 'info');
        }
      }
    });
  }

  // Toggle calendar view
  if (toggleCalBtn && calendarSection) {
    toggleCalBtn.addEventListener('click', () => {
      const isHidden = calendarSection.style.display === 'none';
      calendarSection.style.display = isHidden ? 'block' : 'none';
      toggleCalBtn.textContent = isHidden ? 'Hide Availability Calendar' : 'View Availability Calendar';
    });
  }

  // 2. Render Rooms Catalog
  function renderRooms() {
    const allRooms = StorageController.getRooms();
    const urlP = new URLSearchParams(window.location.search);
    const cIn = urlP.get('checkIn') || '';
    const cOut = urlP.get('checkOut') || '';
    const reqRooms = parseInt(urlP.get('rooms'), 10) || 1;

    // Filter rooms
    let filtered = allRooms.filter(room => {
      if (currentCategory !== 'all' && room.category !== currentCategory) return false;
      if (room.price > maxPrice) return false;
      if (bedFilter !== 'all' && !room.bedType.toLowerCase().includes(bedFilter.toLowerCase())) return false;
      return true;
    });

    // Sorting
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'capacity') {
      filtered.sort((a, b) => b.occupancy.maxGuests - a.occupancy.maxGuests);
    }

    if (filtered.length === 0) {
      roomsContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #fff; border-radius: 8px; border: 1px solid var(--border-color);">
          <h3>No rooms match your filter criteria</h3>
          <p class="text-muted" style="margin-top: 8px;">Try adjusting the price slider, bed type, or category filters.</p>
          <button type="button" class="btn btn-outline" style="margin-top: 16px;" id="btn-reset-filters">Reset Filters</button>
        </div>
      `;
      const resetBtn = document.getElementById('btn-reset-filters');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          categoryFilter.value = 'all';
          priceFilter.value = 1000;
          priceValueLabel.textContent = '$1,000';
          bedTypeFilter.value = 'all';
          sortSelect.value = 'default';
          currentCategory = 'all';
          maxPrice = 1000;
          bedFilter = 'all';
          sortBy = 'default';
          renderRooms();
        });
      }
      return;
    }

    const html = filtered.map(room => {
      // Calculate availability if dates selected
      let availBadgeClass = 'badge-available';
      let availText = 'Available';
      let canBook = true;

      if (cIn && cOut) {
        const availCheck = AvailabilityEngine.checkRangeAvailability(room.id, cIn, cOut, reqRooms);
        if (!availCheck.available || availCheck.remainingRooms < reqRooms) {
          availBadgeClass = 'badge-full';
          availText = 'Sold Out for Dates';
          canBook = false;
        } else if (availCheck.remainingRooms <= 3) {
          availBadgeClass = 'badge-limited';
          availText = `${availCheck.remainingRooms} Left`;
        } else {
          availBadgeClass = 'badge-available';
          availText = `${availCheck.remainingRooms} Available`;
        }
      } else {
        const totalInv = parseInt(room.inventory, 10) || 1;
        availBadgeClass = 'badge-available';
        availText = `${totalInv} Available`;
      }

      const isCheckedForCompare = compareSelection.has(room.id);
      const discountTag = room.discountPercentage > 0 
        ? `<span class="room-discount-badge">${room.discountPercentage}% OFF</span>` 
        : '';

      const amenitiesPreview = room.amenities.slice(0, 4).map(a => 
        `<span class="amenity-chip">${Validation.escapeHtml(a)}</span>`
      ).join('');

      // Build booking query URL
      const bookUrl = `booking.html?roomId=${encodeURIComponent(room.id)}${cIn ? `&checkIn=${encodeURIComponent(cIn)}` : ''}${cOut ? `&checkOut=${encodeURIComponent(cOut)}` : ''}&adults=${activeAdults}&children=${activeChildren}&rooms=${reqRooms}`;

      return `
        <article class="room-card ${isCheckedForCompare ? 'is-selected-for-compare' : ''}" data-room-id="${room.id}">
          <div class="room-card-image-wrap">
            <img src="${Validation.escapeHtml(room.image)}" alt="${Validation.escapeHtml(room.name)}" class="room-card-image" loading="lazy" />
            <div class="room-card-badges">
              <span class="badge ${availBadgeClass}">${availText}</span>
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

            <div class="room-amenities-tags">
              ${amenitiesPreview}
              ${room.amenities.length > 4 ? `<span class="amenity-chip">+${room.amenities.length - 4} more</span>` : ''}
            </div>

            <div class="room-card-specs">
              <span class="room-spec-item" title="Room Dimensions">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
                ${Validation.escapeHtml(room.size)}
              </span>
              <span class="room-spec-item" title="Max Occupancy">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
                Max ${room.occupancy.maxGuests} Guests
              </span>
              <span class="room-spec-item" title="Bed Configuration">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
                ${Validation.escapeHtml(room.bedType)}
              </span>
            </div>

            <label class="room-compare-checkbox-label">
              <input type="checkbox" class="compare-checkbox" data-room-id="${room.id}" ${isCheckedForCompare ? 'checked' : ''} />
              <span>Add to Compare (up to 3)</span>
            </label>

            <div class="room-card-actions" style="margin-top: 16px;">
              <button type="button" class="btn btn-outline btn-view-details" data-room-id="${room.id}">View Details</button>
              <a href="${bookUrl}" class="btn btn-primary ${!canBook ? 'btn-disabled' : ''}">${canBook ? 'Book Now' : 'Check Dates'}</a>
            </div>
          </div>
        </article>
      `;
    }).join('');

    roomsContainer.innerHTML = html;

    // Attach event listeners for details and comparison checkboxes
    roomsContainer.querySelectorAll('.btn-view-details').forEach(btn => {
      btn.addEventListener('click', () => {
        openRoomDetailsModal(btn.getAttribute('data-room-id'));
      });
    });

    roomsContainer.querySelectorAll('.compare-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const rId = e.target.getAttribute('data-room-id');
        if (e.target.checked) {
          if (compareSelection.size >= 3) {
            e.target.checked = false;
            Validation.showToast('You can compare a maximum of 3 rooms at a time.', 'error');
            return;
          }
          compareSelection.add(rId);
        } else {
          compareSelection.delete(rId);
        }
        updateComparisonDock();
        renderRooms();
      });
    });
  }

  // 3. Comparison Dock UI Updates
  function updateComparisonDock() {
    const count = compareSelection.size;
    dockCounter.textContent = `${count}/3`;

    if (count > 0) {
      comparisonDock.classList.add('active');
    } else {
      comparisonDock.classList.remove('active');
    }

    if (count >= 2) {
      dockCompareBtn.removeAttribute('disabled');
      dockCompareBtn.textContent = `Compare ${count} Rooms Side by Side`;
    } else {
      dockCompareBtn.setAttribute('disabled', 'true');
      dockCompareBtn.textContent = 'Select at least 2 rooms';
    }
  }

  // Clear dock
  if (dockClearBtn) {
    dockClearBtn.addEventListener('click', () => {
      compareSelection.clear();
      updateComparisonDock();
      renderRooms();
    });
  }

  // Open Comparison Modal
  if (dockCompareBtn) {
    dockCompareBtn.addEventListener('click', () => {
      if (compareSelection.size < 2) return;
      openComparisonModal(Array.from(compareSelection));
    });
  }

  // 4. Comparison Table Generation & Difference Highlighting
  function openComparisonModal(selectedIds) {
    const rooms = selectedIds.map(id => StorageController.getRoomById(id)).filter(Boolean);
    if (rooms.length < 2) return;

    // Comparison criteria definitions
    const criteria = [
      { key: 'category', label: 'Room Category', getVal: r => r.category },
      { key: 'price', label: 'Base Price / Night', getVal: r => `$${r.price}` },
      { key: 'weekendPrice', label: 'Weekend Rate / Night', getVal: r => `$${r.weekendPrice}` },
      { key: 'size', label: 'Room Size', getVal: r => r.size },
      { key: 'maxGuests', label: 'Maximum Guests', getVal: r => `${r.occupancy.maxGuests} Guests (${r.occupancy.adults} Adults, ${r.occupancy.children} Kids)` },
      { key: 'bedType', label: 'Bed Configuration', getVal: r => r.bedType },
      { key: 'breakfast', label: 'Breakfast Included', getVal: r => r.breakfastIncluded ? '<span class="feature-check">&#10003; Included</span>' : '<span class="feature-cross">&times; Optional (+$25)</span>' },
      { key: 'wifi', label: 'High-Speed Wi-Fi', getVal: () => '<span class="feature-check">&#10003; Included (Free)</span>' },
      { key: 'ac', label: 'Air Conditioning', getVal: () => '<span class="feature-check">&#10003; Climate Controlled</span>' },
      { key: 'balcony', label: 'Private Balcony', getVal: r => r.balcony ? '<span class="feature-check">&#10003; Yes</span>' : '<span class="feature-cross">&times; No</span>' },
      { key: 'cancellation', label: 'Cancellation Policy', getVal: r => r.cancellationPolicy }
    ];

    // Build Table Header
    let tableHtml = `
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Specification</th>
            ${rooms.map(r => `
              <th class="comparison-room-header">
                <img src="${Validation.escapeHtml(r.image)}" alt="${Validation.escapeHtml(r.name)}" class="comparison-room-image" />
                <div class="comparison-room-title">${Validation.escapeHtml(r.name)}</div>
                <div class="comparison-room-price">$${r.price} <span style="font-size:0.75rem; font-weight:400; color:var(--text-muted);">/ night</span></div>
                <a href="booking.html?roomId=${encodeURIComponent(r.id)}" class="btn btn-primary btn-sm" style="margin-top:8px; width:100%;">Select</a>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    // Build Rows & Check Differences
    criteria.forEach(item => {
      const values = rooms.map(r => item.getVal(r));
      // Determine if there is difference between values
      const hasDiff = values.some(v => v !== values[0]);

      tableHtml += `
        <tr class="${hasDiff ? 'diff-highlight' : ''}">
          <th>
            ${item.label}
            ${hasDiff ? '<span style="display:block; font-size:0.7rem; color:var(--primary-gold-dark); font-weight:700;">(Difference)</span>' : ''}
          </th>
          ${values.map(val => `<td>${val}</td>`).join('')}
        </tr>
      `;
    });

    tableHtml += `
        </tbody>
      </table>
    `;

    comparisonTableBody.innerHTML = tableHtml;
    comparisonModal.classList.add('active');
  }

  // Close Comparison Modal
  if (comparisonModal) {
    comparisonModal.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => comparisonModal.classList.remove('active'));
    });
    comparisonModal.addEventListener('click', (e) => {
      if (e.target === comparisonModal) comparisonModal.classList.remove('active');
    });
  }

  // Filter Event Listeners
  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      currentCategory = e.target.value;
      renderRooms();
    });
  }

  if (priceFilter && priceValueLabel) {
    priceFilter.addEventListener('input', (e) => {
      maxPrice = parseInt(e.target.value, 10);
      priceValueLabel.textContent = `$${maxPrice}`;
      renderRooms();
    });
  }

  if (bedTypeFilter) {
    bedTypeFilter.addEventListener('change', (e) => {
      bedFilter = e.target.value;
      renderRooms();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortBy = e.target.value;
      renderRooms();
    });
  }

  // Initial load
  initRoomModal();
  renderRooms();
});

