/**
 * HOTELORA - Multi-Step Booking Workflow Controller
 * Guides guest through Step 1 (Dates) -> Step 2 (Room) -> Step 3 (Guest Info & Requests) -> Step 4 (Review & Confirm)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mainNav = document.getElementById('main-nav');
  if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener('click', () => mainNav.classList.toggle('show'));
  }

  // Parse initial query params or session storage
  const urlParams = new URLSearchParams(window.location.search);
  const sessionSearchStr = sessionStorage.getItem('hotelora_active_search');
  const sessionSearch = sessionSearchStr ? JSON.parse(sessionSearchStr) : null;

  // State
  let currentStep = 1;
  const bookingState = {
    checkIn: urlParams.get('checkIn') || (sessionSearch ? sessionSearch.checkIn : ''),
    checkOut: urlParams.get('checkOut') || (sessionSearch ? sessionSearch.checkOut : ''),
    adults: parseInt(urlParams.get('adults'), 10) || (sessionSearch ? sessionSearch.adults : 2),
    children: parseInt(urlParams.get('children'), 10) || (sessionSearch ? sessionSearch.children : 0),
    numberOfRooms: parseInt(urlParams.get('rooms'), 10) || (sessionSearch ? sessionSearch.rooms : 1),
    roomId: urlParams.get('roomId') || 'dlx-02',
    guestName: '',
    email: '',
    phone: '',
    country: 'United States',
    arrivalTime: '15:00',
    accessibility: 'None',
    bedPreference: 'Default',
    specialRequests: [],
    instructions: '',
    confirmedAgreement: false,
    wantsBreakfast: false
  };

  // Setup default dates if empty
  const today = new Date();
  const defIn = new Date(today);
  defIn.setDate(defIn.getDate() + 1);
  const defOut = new Date(today);
  defOut.setDate(defOut.getDate() + 4);

  const fmtDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  if (!bookingState.checkIn) bookingState.checkIn = fmtDate(defIn);
  if (!bookingState.checkOut) bookingState.checkOut = fmtDate(defOut);

  // DOM Elements - Stepper
  const stepItems = document.querySelectorAll('.step-item');
  const stepPanels = document.querySelectorAll('.booking-step-panel');

  // DOM Elements - Step 1
  const step1CheckIn = document.getElementById('booking-checkin');
  const step1CheckOut = document.getElementById('booking-checkout');
  const step1Rooms = document.getElementById('booking-rooms-count');
  const step1Adults = document.getElementById('booking-adults');
  const step1Children = document.getElementById('booking-children');
  const step1NextBtn = document.getElementById('step-1-next');

  // DOM Elements - Step 2
  const roomOptionsContainer = document.getElementById('room-options-container');
  const step2PrevBtn = document.getElementById('step-2-prev');
  const step2NextBtn = document.getElementById('step-2-next');

  // DOM Elements - Step 3
  const guestNameInput = document.getElementById('guest-fullname');
  const guestEmailInput = document.getElementById('guest-email');
  const guestPhoneInput = document.getElementById('guest-phone');
  const guestCountryInput = document.getElementById('guest-country');
  const arrivalTimeSelect = document.getElementById('guest-arrival');
  const accessibilitySelect = document.getElementById('guest-accessibility');
  const bedPreferenceSelect = document.getElementById('guest-bed-pref');
  const instructionsTextarea = document.getElementById('guest-instructions');
  const specialRequestCheckboxes = document.querySelectorAll('input[name="special-requests"]');
  const step3PrevBtn = document.getElementById('step-3-prev');
  const step3NextBtn = document.getElementById('step-3-next');

  // DOM Elements - Step 4
  const reviewContentMount = document.getElementById('review-content-mount');
  const agreementCheckbox = document.getElementById('agreement-checkbox');
  const step4PrevBtn = document.getElementById('step-4-prev');
  const confirmBookingBtn = document.getElementById('btn-confirm-booking');

  // Populate Step 1 controls with initial values
  if (step1CheckIn) {
    step1CheckIn.min = fmtDate(today);
    step1CheckIn.value = bookingState.checkIn;
  }
  if (step1CheckOut) {
    step1CheckOut.min = bookingState.checkIn;
    step1CheckOut.value = bookingState.checkOut;
  }
  if (step1Rooms) step1Rooms.value = bookingState.numberOfRooms;
  if (step1Adults) step1Adults.value = bookingState.adults;
  if (step1Children) step1Children.value = bookingState.children;

  // Step 1 Event Listeners
  if (step1CheckIn && step1CheckOut) {
    step1CheckIn.addEventListener('change', () => {
      const selected = new Date(step1CheckIn.value);
      if (!isNaN(selected.getTime())) {
        const nextDay = new Date(selected);
        nextDay.setDate(nextDay.getDate() + 1);
        step1CheckOut.min = fmtDate(nextDay);
        if (step1CheckOut.value <= step1CheckIn.value) {
          step1CheckOut.value = fmtDate(nextDay);
        }
      }
      syncInputsToState();
      updatePriceSummary();
    });

    step1CheckOut.addEventListener('change', () => {
      syncInputsToState();
      updatePriceSummary();
    });
  }

  [step1Rooms, step1Adults, step1Children].forEach(elem => {
    if (elem) elem.addEventListener('change', () => {
      syncInputsToState();
      updatePriceSummary();
    });
  });

  function syncInputsToState() {
    bookingState.checkIn = step1CheckIn.value;
    bookingState.checkOut = step1CheckOut.value;
    bookingState.numberOfRooms = parseInt(step1Rooms.value, 10) || 1;
    bookingState.adults = parseInt(step1Adults.value, 10) || 1;
    bookingState.children = parseInt(step1Children.value, 10) || 0;
  }

  // Step 1 -> Step 2
  step1NextBtn.addEventListener('click', () => {
    syncInputsToState();
    const dateVal = Validation.validateDateRange(bookingState.checkIn, bookingState.checkOut);
    if (!dateVal.valid) {
      Validation.showToast(dateVal.message, 'error');
      return;
    }
    renderRoomSelectionCards();
    goToStep(2);
  });

  // Step 2: Render room cards
  function renderRoomSelectionCards() {
    const rooms = StorageController.getRooms();
    let html = '';

    rooms.forEach(room => {
      const isSelected = room.id === bookingState.roomId;
      const avail = AvailabilityEngine.checkRangeAvailability(
        room.id,
        bookingState.checkIn,
        bookingState.checkOut,
        bookingState.numberOfRooms
      );

      const canSelect = avail.available && avail.remainingRooms >= bookingState.numberOfRooms;
      let badgeHtml = '';
      if (!canSelect) {
        badgeHtml = `<span class="badge badge-full">Sold Out for Dates</span>`;
      } else if (avail.remainingRooms <= 3) {
        badgeHtml = `<span class="badge badge-limited">${avail.remainingRooms} Left</span>`;
      } else {
        badgeHtml = `<span class="badge badge-available">Available</span>`;
      }

      html += `
        <div class="room-select-card ${isSelected ? 'selected' : ''} ${!canSelect ? 'disabled' : ''}" 
             data-room-id="${room.id}" 
             ${canSelect ? 'tabindex="0" role="radio" aria-checked="' + isSelected + '"' : 'style="opacity: 0.6; cursor: not-allowed;"'}>
          <img src="${Validation.escapeHtml(room.image)}" alt="${Validation.escapeHtml(room.name)}" class="room-select-thumb" />
          <div class="room-select-details">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
              <h4 class="room-select-title">${Validation.escapeHtml(room.name)}</h4>
              ${badgeHtml}
            </div>
            <div class="room-select-meta">
              ${Validation.escapeHtml(room.size)} &bull; ${Validation.escapeHtml(room.bedType)} &bull; Max ${room.occupancy.maxGuests} Guests
            </div>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px;">
              ${Validation.escapeHtml(room.description.slice(0, 100))}...
            </div>
            <div class="room-select-price">
              $${room.price} <span>/ night (weekend: $${room.weekendPrice})</span>
              ${room.discountPercentage > 0 ? `<span class="room-discount-badge">${room.discountPercentage}% OFF</span>` : ''}
            </div>
          </div>
        </div>
      `;
    });

    roomOptionsContainer.innerHTML = html;

    // Attach selection handlers
    roomOptionsContainer.querySelectorAll('.room-select-card:not(.disabled)').forEach(card => {
      card.addEventListener('click', () => {
        roomOptionsContainer.querySelectorAll('.room-select-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        bookingState.roomId = card.getAttribute('data-room-id');
        updatePriceSummary();
      });
    });
  }

  // Step 2 Nav
  step2PrevBtn.addEventListener('click', () => goToStep(1));
  step2NextBtn.addEventListener('click', () => {
    if (!bookingState.roomId) {
      Validation.showToast('Please select a room category.', 'error');
      return;
    }
    // Verify room availability again
    const avail = AvailabilityEngine.checkRangeAvailability(
      bookingState.roomId,
      bookingState.checkIn,
      bookingState.checkOut,
      bookingState.numberOfRooms
    );
    if (!avail.available) {
      Validation.showToast(avail.message, 'error');
      return;
    }
    goToStep(3);
  });

  // Step 3 Nav
  step3PrevBtn.addEventListener('click', () => goToStep(2));
  step3NextBtn.addEventListener('click', () => {
    // Validate guest details
    const name = guestNameInput.value.trim();
    const email = guestEmailInput.value.trim();
    const phone = guestPhoneInput.value.trim();
    const country = guestCountryInput.value.trim();

    if (!name || name.length < 2) {
      Validation.showToast('Please enter your full name.', 'error');
      guestNameInput.focus();
      return;
    }

    if (!Validation.isValidEmail(email)) {
      Validation.showToast('Please enter a valid email address.', 'error');
      guestEmailInput.focus();
      return;
    }

    if (!Validation.isValidPhone(phone)) {
      Validation.showToast('Please enter a valid phone number (at least 7 digits).', 'error');
      guestPhoneInput.focus();
      return;
    }

    if (!country) {
      Validation.showToast('Please provide your country/region of residence.', 'error');
      guestCountryInput.focus();
      return;
    }

    // Capture state
    bookingState.guestName = name;
    bookingState.email = email;
    bookingState.phone = phone;
    bookingState.country = country;
    bookingState.arrivalTime = arrivalTimeSelect.value;
    bookingState.accessibility = accessibilitySelect.value;
    bookingState.bedPreference = bedPreferenceSelect.value;
    bookingState.instructions = instructionsTextarea.value.trim();

    const selectedReqs = [];
    let wantsBreakfast = false;
    specialRequestCheckboxes.forEach(cb => {
      if (cb.checked) {
        selectedReqs.push(cb.value);
        if (cb.value === 'Vegetarian meal' || cb.value === 'Daily Gourmet Breakfast') {
          wantsBreakfast = true;
        }
      }
    });
    bookingState.specialRequests = selectedReqs;
    bookingState.wantsBreakfast = wantsBreakfast;

    renderReviewSummary();
    goToStep(4);
  });

  // Step 4: Render Review Summary
  function renderReviewSummary() {
    const room = StorageController.getRoomById(bookingState.roomId);
    const breakdown = PricingEngine.calculateBreakdown({
      roomId: bookingState.roomId,
      checkIn: bookingState.checkIn,
      checkOut: bookingState.checkOut,
      numberOfRooms: bookingState.numberOfRooms,
      adults: bookingState.adults,
      children: bookingState.children,
      wantsBreakfast: bookingState.wantsBreakfast
    });

    const requestsHtml = bookingState.specialRequests.length > 0
      ? bookingState.specialRequests.map(r => `<span class="amenity-chip">${Validation.escapeHtml(r)}</span>`).join(' ')
      : '<span class="text-muted">None specified</span>';

    reviewContentMount.innerHTML = `
      <div style="background: var(--bg-cream); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 20px; margin-bottom: 24px;">
        <h4 style="font-size: 1.15rem; margin-bottom: 14px; color: var(--charcoal-900);">Guest &amp; Stay Overview</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 0.92rem;">
          <div><strong>Primary Guest:</strong> ${Validation.escapeHtml(bookingState.guestName)}</div>
          <div><strong>Email Address:</strong> ${Validation.escapeHtml(bookingState.email)}</div>
          <div><strong>Phone Number:</strong> ${Validation.escapeHtml(bookingState.phone)}</div>
          <div><strong>Country/Region:</strong> ${Validation.escapeHtml(bookingState.country)}</div>
          <div><strong>Room Category:</strong> ${Validation.escapeHtml(room.name)}</div>
          <div><strong>Quantity:</strong> ${bookingState.numberOfRooms} Room(s)</div>
          <div><strong>Check-In:</strong> ${Validation.formatDisplayDate(bookingState.checkIn)} (from ${bookingState.arrivalTime})</div>
          <div><strong>Check-Out:</strong> ${Validation.formatDisplayDate(bookingState.checkOut)} (by 11:00 AM)</div>
          <div><strong>Stay Duration:</strong> ${breakdown.nights} Night(s)</div>
          <div><strong>Guests:</strong> ${bookingState.adults} Adults, ${bookingState.children} Children</div>
        </div>

        <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border-light); font-size: 0.88rem;">
          <div style="margin-bottom: 6px;"><strong>Special Requests:</strong> ${requestsHtml}</div>
          ${bookingState.instructions ? `<div><strong>Guest Notes:</strong> <em>"${Validation.escapeHtml(bookingState.instructions)}"</em></div>` : ''}
        </div>
      </div>

      <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 20px;">
        <h4 style="font-size: 1.15rem; margin-bottom: 14px; color: var(--charcoal-900);">Transparent Financial Breakdown</h4>
        <table class="price-breakdown-table">
          <tbody>
            <tr>
              <td>Room Base Subtotal (${breakdown.numberOfRooms} room &times; ${breakdown.nights} nights):</td>
              <td>${Validation.formatCurrency(breakdown.roomSubtotal)}</td>
            </tr>
            ${breakdown.discountAmount > 0 ? `
              <tr class="discount-row">
                <td>Special Promotional Discount (${breakdown.discountPercentage}% OFF):</td>
                <td>-${Validation.formatCurrency(breakdown.discountAmount)}</td>
              </tr>
            ` : ''}
            ${breakdown.extraGuestCharges > 0 ? `
              <tr>
                <td>Extra Guest Charges (${breakdown.extraGuestsCount} extra &times; $${breakdown.extraGuestRate} &times; ${breakdown.nights} nights):</td>
                <td>+${Validation.formatCurrency(breakdown.extraGuestCharges)}</td>
              </tr>
            ` : ''}
            ${breakdown.breakfastCharges > 0 ? `
              <tr>
                <td>Breakfast Package (${breakdown.totalGuests} guests &times; $${breakdown.breakfastPerPerson} &times; ${breakdown.nights} nights):</td>
                <td>+${Validation.formatCurrency(breakdown.breakfastCharges)}</td>
              </tr>
            ` : ''}
            <tr>
              <td>Applicable Government Tax &amp; Tourism Surcharge (${breakdown.taxRate}%):</td>
              <td>+${Validation.formatCurrency(breakdown.taxAmount)}</td>
            </tr>
          </tbody>
        </table>
        <div class="summary-total-box" style="margin-top: 10px;">
          <span class="summary-total-label">Final Payable Amount:</span>
          <span class="summary-total-amount">${Validation.formatCurrency(breakdown.finalTotal)}</span>
        </div>
      </div>
    `;
  }

  // Step 4 Nav
  step4PrevBtn.addEventListener('click', () => goToStep(3));

  // Agreement Checkbox enable/disable
  agreementCheckbox.addEventListener('change', (e) => {
    bookingState.confirmedAgreement = e.target.checked;
    if (e.target.checked) {
      confirmBookingBtn.removeAttribute('disabled');
    } else {
      confirmBookingBtn.setAttribute('disabled', 'true');
    }
  });

  // Final Confirmation & Submission
  confirmBookingBtn.addEventListener('click', () => {
    if (!bookingState.confirmedAgreement) {
      Validation.showToast('Please check the confirmation agreement checkbox to proceed.', 'error');
      return;
    }

    // Final availability verification
    const avail = AvailabilityEngine.checkRangeAvailability(
      bookingState.roomId,
      bookingState.checkIn,
      bookingState.checkOut,
      bookingState.numberOfRooms
    );

    if (!avail.available) {
      Validation.showToast(avail.message, 'error');
      goToStep(1);
      return;
    }

    // Prevent duplicate clicks
    confirmBookingBtn.setAttribute('disabled', 'true');
    confirmBookingBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      Processing Reservation...
    `;

    // Compute final numbers
    const room = StorageController.getRoomById(bookingState.roomId);
    const breakdown = PricingEngine.calculateBreakdown({
      roomId: bookingState.roomId,
      checkIn: bookingState.checkIn,
      checkOut: bookingState.checkOut,
      numberOfRooms: bookingState.numberOfRooms,
      adults: bookingState.adults,
      children: bookingState.children,
      wantsBreakfast: bookingState.wantsBreakfast
    });

    const bookingId = 'HTL-' + Math.floor(100000 + Math.random() * 900000);

    const newBooking = {
      bookingId,
      guestName: bookingState.guestName,
      email: bookingState.email,
      phone: bookingState.phone,
      country: bookingState.country,
      roomId: room.id,
      roomName: room.name,
      roomCategory: room.category,
      checkIn: bookingState.checkIn,
      checkOut: bookingState.checkOut,
      adults: bookingState.adults,
      children: bookingState.children,
      numberOfRooms: bookingState.numberOfRooms,
      arrivalTime: bookingState.arrivalTime,
      bedPreference: bookingState.bedPreference,
      accessibility: bookingState.accessibility,
      specialRequests: bookingState.specialRequests,
      instructions: bookingState.instructions,
      nights: breakdown.nights,
      subtotal: breakdown.roomSubtotal,
      discount: breakdown.discountAmount,
      extraGuestCharges: breakdown.extraGuestCharges,
      breakfastCharges: breakdown.breakfastCharges,
      taxes: breakdown.taxAmount,
      total: breakdown.finalTotal,
      status: 'Confirmed',
      createdAt: new Date().toISOString()
    };

    // Save to LocalStorage
    StorageController.addBooking(newBooking);

    // Save last confirmation ID for confirmation.html
    sessionStorage.setItem('hotelora_last_confirmed_id', bookingId);

    // Simulate seamless booking confirmation experience
    setTimeout(() => {
      window.location.href = `confirmation.html?bookingId=${encodeURIComponent(bookingId)}`;
    }, 700);
  });

  // Step switcher helper
  function goToStep(stepNum) {
    currentStep = stepNum;

    // Update stepper circles
    stepItems.forEach(item => {
      const stepVal = parseInt(item.getAttribute('data-step'), 10);
      item.classList.remove('active', 'completed');
      if (stepVal === stepNum) {
        item.classList.add('active');
      } else if (stepVal < stepNum) {
        item.classList.add('completed');
      }
    });

    // Show active panel
    stepPanels.forEach(panel => {
      panel.classList.remove('active');
      if (parseInt(panel.getAttribute('data-panel'), 10) === stepNum) {
        panel.classList.add('active');
      }
    });

    window.scrollTo({ top: 120, behavior: 'smooth' });
    updatePriceSummary();
  }

  // Update sticky sidebar summary
  function updatePriceSummary() {
    const room = StorageController.getRoomById(bookingState.roomId) || StorageController.getRooms()[0];
    const previewThumb = document.getElementById('summary-thumb');
    const previewName = document.getElementById('summary-room-name');
    const previewDates = document.getElementById('summary-dates');
    const previewNights = document.getElementById('summary-nights');
    const previewGuests = document.getElementById('summary-guests');
    const previewRooms = document.getElementById('summary-rooms');

    const subtotalEl = document.getElementById('sum-subtotal');
    const discountRow = document.getElementById('sum-discount-row');
    const discountEl = document.getElementById('sum-discount');
    const extraGuestRow = document.getElementById('sum-extraguest-row');
    const extraGuestEl = document.getElementById('sum-extraguest');
    const taxEl = document.getElementById('sum-taxes');
    const totalEl = document.getElementById('sum-total');

    if (!room) return;

    if (previewThumb) previewThumb.src = room.image;
    if (previewName) previewName.textContent = room.name;

    const breakdown = PricingEngine.calculateBreakdown({
      roomId: room.id,
      checkIn: bookingState.checkIn,
      checkOut: bookingState.checkOut,
      numberOfRooms: bookingState.numberOfRooms,
      adults: bookingState.adults,
      children: bookingState.children,
      wantsBreakfast: bookingState.wantsBreakfast
    });

    if (previewDates) {
      previewDates.textContent = `${Validation.formatDisplayDate(bookingState.checkIn)} - ${Validation.formatDisplayDate(bookingState.checkOut)}`;
    }
    if (previewNights) previewNights.textContent = `${breakdown.nights} Night(s)`;
    if (previewGuests) previewGuests.textContent = `${bookingState.adults} Adults, ${bookingState.children} Children`;
    if (previewRooms) previewRooms.textContent = `${bookingState.numberOfRooms} Room(s)`;

    if (subtotalEl) subtotalEl.textContent = Validation.formatCurrency(breakdown.roomSubtotal);

    if (discountRow && discountEl) {
      if (breakdown.discountAmount > 0) {
        discountRow.style.display = 'table-row';
        discountEl.textContent = `-${Validation.formatCurrency(breakdown.discountAmount)} (${breakdown.discountPercentage}%)`;
      } else {
        discountRow.style.display = 'none';
      }
    }

    if (extraGuestRow && extraGuestEl) {
      if (breakdown.extraGuestCharges > 0) {
        extraGuestRow.style.display = 'table-row';
        extraGuestEl.textContent = `+${Validation.formatCurrency(breakdown.extraGuestCharges)}`;
      } else {
        extraGuestRow.style.display = 'none';
      }
    }

    if (taxEl) taxEl.textContent = `+${Validation.formatCurrency(breakdown.taxAmount)}`;
    if (totalEl) totalEl.textContent = Validation.formatCurrency(breakdown.finalTotal);
  }

  // Initial state setup
  updatePriceSummary();
  // If roomId was provided in URL and dates are present, step 1 is pre-populated
});

