/**
 * HOTELORA - Room Availability Calendar & Inventory Engine
 * Implements strict date overlap verification and monthly interactive calendar rendering.
 */

const AvailabilityEngine = {
  /**
   * Exact overlap logic specified by requirements:
   * requestedCheckIn < existingCheckOut && requestedCheckOut > existingCheckIn
   */
  isDateOverlapping(reqCheckIn, reqCheckOut, existCheckIn, existCheckOut) {
    const rIn = new Date(reqCheckIn + 'T00:00:00');
    const rOut = new Date(reqCheckOut + 'T00:00:00');
    const eIn = new Date(existCheckIn + 'T00:00:00');
    const eOut = new Date(existCheckOut + 'T00:00:00');

    return rIn < eOut && rOut > eIn;
  },

  /**
   * Count booked rooms for a specific room category on a specific date night
   */
  getBookedRoomsCountOnDate(roomId, dateStr) {
    const nextDay = new Date(dateStr + 'T00:00:00');
    nextDay.setDate(nextDay.getDate() + 1);
    const yyyy = nextDay.getFullYear();
    const mm = String(nextDay.getMonth() + 1).padStart(2, '0');
    const dd = String(nextDay.getDate()).padStart(2, '0');
    const nextDayStr = `${yyyy}-${mm}-${dd}`;

    const bookings = StorageController.getBookings().filter(b => 
      b.status === 'Confirmed' || b.status === 'Pending'
    );

    let bookedCount = 0;
    for (const b of bookings) {
      // Check if room matches (or if roomId is null/all, calculate for specific)
      if (roomId && b.roomId !== roomId) continue;

      if (this.isDateOverlapping(dateStr, nextDayStr, b.checkIn, b.checkOut)) {
        bookedCount += (parseInt(b.numberOfRooms, 10) || 1);
      }
    }
    return bookedCount;
  },

  /**
   * Check availability for a room across a requested date range
   */
  checkRangeAvailability(roomId, checkIn, checkOut, requestedRooms = 1) {
    const room = StorageController.getRoomById(roomId);
    if (!room) return { available: false, message: 'Room not found' };

    const totalInventory = parseInt(room.inventory, 10) || 1;
    const reqRooms = parseInt(requestedRooms, 10) || 1;

    // Check each night in the range
    const current = new Date(checkIn + 'T00:00:00');
    const end = new Date(checkOut + 'T00:00:00');

    let maxBookedOnAnyNight = 0;

    while (current < end) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const booked = this.getBookedRoomsCountOnDate(roomId, dateStr);
      if (booked > maxBookedOnAnyNight) {
        maxBookedOnAnyNight = booked;
      }

      const availableOnNight = totalInventory - booked;
      if (availableOnNight < reqRooms) {
        return {
          available: false,
          maxBooked: maxBookedOnAnyNight,
          remainingRooms: Math.max(0, totalInventory - maxBookedOnAnyNight),
          totalInventory,
          conflictDate: dateStr,
          message: `Only ${Math.max(0, availableOnNight)} room(s) available on ${Validation.formatDisplayDate(dateStr)}.`
        };
      }

      current.setDate(current.getDate() + 1);
    }

    const minRemaining = totalInventory - maxBookedOnAnyNight;
    return {
      available: true,
      maxBooked: maxBookedOnAnyNight,
      remainingRooms: minRemaining,
      totalInventory,
      availabilityPercentage: Math.round((minRemaining / totalInventory) * 100),
      message: `${minRemaining} of ${totalInventory} rooms available for the selected dates.`
    };
  },

  /**
   * Get availability status for a single day
   */
  getDayAvailability(roomId, dateStr) {
    const room = StorageController.getRoomById(roomId);
    if (!room) {
      // Aggregate across all rooms
      const allRooms = StorageController.getRooms();
      let totalInv = 0;
      let totalBooked = 0;
      allRooms.forEach(r => {
        totalInv += (parseInt(r.inventory, 10) || 1);
        totalBooked += this.getBookedRoomsCountOnDate(r.id, dateStr);
      });
      const available = Math.max(0, totalInv - totalBooked);
      const ratio = totalInv > 0 ? (available / totalInv) : 0;
      let status = 'available';
      if (available === 0) status = 'full';
      else if (ratio <= 0.5) status = 'limited';

      return {
        totalRooms: totalInv,
        bookedRooms: totalBooked,
        availableRooms: available,
        percentage: Math.round(ratio * 100),
        status // 'available' (green), 'limited' (yellow), 'full' (red)
      };
    }

    const totalInventory = parseInt(room.inventory, 10) || 1;
    const booked = this.getBookedRoomsCountOnDate(roomId, dateStr);
    const available = Math.max(0, totalInventory - booked);
    const ratio = totalInventory > 0 ? (available / totalInventory) : 0;

    let status = 'available';
    if (available === 0) {
      status = 'full'; // Red
    } else if (ratio <= 0.5) {
      status = 'limited'; // Yellow
    }

    return {
      totalRooms: totalInventory,
      bookedRooms: booked,
      availableRooms: available,
      percentage: Math.round(ratio * 100),
      status
    };
  },

  /**
   * Render an interactive monthly availability calendar into a target DOM element
   */
  renderCalendar(targetElement, {
    roomId = '',
    year = new Date().getFullYear(),
    month = new Date().getMonth(),
    selectedCheckIn = null,
    selectedCheckOut = null,
    interactive = true,
    onDateSelect = null
  }) {
    if (!targetElement) return;

    let currentYear = year;
    let currentMonth = month;
    let currentRoomId = roomId;
    let tempCheckIn = selectedCheckIn;
    let tempCheckOut = selectedCheckOut;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updateView = () => {
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const rooms = StorageController.getRooms();

      // Category selector options
      const roomOptions = [
        `<option value="" ${!currentRoomId ? 'selected' : ''}>All Room Categories</option>`,
        ...rooms.map(r => `<option value="${r.id}" ${r.id === currentRoomId ? 'selected' : ''}>${Validation.escapeHtml(r.name)} (${r.inventory} rooms)</option>`)
      ].join('');

      let html = `
        <div class="calendar-wrapper">
          <div class="calendar-top-bar">
            <div class="calendar-title-group">
              <h3 class="calendar-month-title">${monthNames[currentMonth]} ${currentYear}</h3>
              <div class="calendar-room-filter">
                <label for="cal-room-select" class="sr-only">Filter Room:</label>
                <select id="cal-room-select" class="form-select calendar-select">
                  ${roomOptions}
                </select>
              </div>
            </div>
            <div class="calendar-nav-buttons">
              <button type="button" class="btn-cal-nav prev-month" aria-label="Previous Month">&#10094;</button>
              <button type="button" class="btn-cal-nav today-btn">Today</button>
              <button type="button" class="btn-cal-nav next-month" aria-label="Next Month">&#10095;</button>
            </div>
          </div>

          <div class="calendar-legend">
            <span class="legend-item"><span class="legend-dot dot-available"></span> Available (>50%)</span>
            <span class="legend-item"><span class="legend-dot dot-limited"></span> Limited (1-50%)</span>
            <span class="legend-item"><span class="legend-dot dot-full"></span> Fully Booked</span>
          </div>

          <div class="calendar-grid">
            <div class="cal-day-header">Sun</div>
            <div class="cal-day-header">Mon</div>
            <div class="cal-day-header">Tue</div>
            <div class="cal-day-header">Wed</div>
            <div class="cal-day-header">Thu</div>
            <div class="cal-day-header">Fri</div>
            <div class="cal-day-header">Sat</div>
      `;

      // Blank slots before first day
      for (let i = 0; i < firstDayOfMonth; i++) {
        html += `<div class="cal-day-cell cal-empty"></div>`;
      }

      // Date cells
      for (let day = 1; day <= daysInMonth; day++) {
        const mmStr = String(currentMonth + 1).padStart(2, '0');
        const ddStr = String(day).padStart(2, '0');
        const dateStr = `${currentYear}-${mmStr}-${ddStr}`;
        const cellDate = new Date(currentYear, currentMonth, day);
        cellDate.setHours(0, 0, 0, 0);

        const isPast = cellDate < today;
        const isToday = cellDate.getTime() === today.getTime();

        const availability = this.getDayAvailability(currentRoomId, dateStr);

        let cellClasses = ['cal-day-cell'];
        if (isPast) cellClasses.push('cal-past');
        if (isToday) cellClasses.push('cal-today');

        let statusClass = `status-${availability.status}`;
        cellClasses.push(statusClass);

        const isSelectedCheckIn = tempCheckIn === dateStr;
        const isSelectedCheckOut = tempCheckOut === dateStr;
        const isInRange = tempCheckIn && tempCheckOut && dateStr > tempCheckIn && dateStr < tempCheckOut;

        if (isSelectedCheckIn) cellClasses.push('cal-selected-checkin');
        if (isSelectedCheckOut) cellClasses.push('cal-selected-checkout');
        if (isInRange) cellClasses.push('cal-in-range');

        let statusBadgeText = `${availability.availableRooms} left`;
        if (availability.status === 'full') {
          statusBadgeText = 'Full';
        }

        html += `
          <div class="${cellClasses.join(' ')}" data-date="${dateStr}" ${isPast ? 'tabindex="-1"' : 'tabindex="0" role="button" aria-label="' + dateStr + ' ' + availability.status + '"'}>
            <span class="cal-day-number">${day}</span>
            <span class="cal-status-pill ${statusClass}">${statusBadgeText}</span>
            <div class="cal-tooltip">
              <strong>${Validation.formatDisplayDate(dateStr)}</strong><br/>
              Available: ${availability.availableRooms} / ${availability.totalRooms} rooms<br/>
              Booked: ${availability.bookedRooms} (${100 - availability.percentage}%)
            </div>
          </div>
        `;
      }

      html += `
          </div>
          <div class="calendar-selected-summary" id="cal-selected-summary">
            ${tempCheckIn ? `<span>Check-in: <strong>${Validation.formatDisplayDate(tempCheckIn)}</strong></span>` : '<span>Click a date to choose check-in</span>'}
            ${tempCheckOut ? `<span> &rarr; Check-out: <strong>${Validation.formatDisplayDate(tempCheckOut)}</strong></span>` : ''}
            ${tempCheckIn && tempCheckOut ? `<button type="button" class="btn-clear-selection" id="cal-clear-btn">Clear</button>` : ''}
          </div>
        </div>
      `;

      targetElement.innerHTML = html;

      // Event handlers
      const selectElem = targetElement.querySelector('#cal-room-select');
      if (selectElem) {
        selectElem.addEventListener('change', (e) => {
          currentRoomId = e.target.value;
          updateView();
        });
      }

      targetElement.querySelector('.prev-month').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
          currentMonth = 11;
          currentYear--;
        }
        updateView();
      });

      targetElement.querySelector('.next-month').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
        updateView();
      });

      targetElement.querySelector('.today-btn').addEventListener('click', () => {
        currentYear = new Date().getFullYear();
        currentMonth = new Date().getMonth();
        updateView();
      });

      const clearBtn = targetElement.querySelector('#cal-clear-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          tempCheckIn = null;
          tempCheckOut = null;
          updateView();
          if (onDateSelect) onDateSelect(null, null);
        });
      }

      // Date click handlers for date selection
      if (interactive) {
        targetElement.querySelectorAll('.cal-day-cell:not(.cal-past):not(.cal-empty)').forEach(cell => {
          cell.addEventListener('click', () => {
            const dateStr = cell.getAttribute('data-date');
            if (!dateStr) return;

            if (!tempCheckIn || (tempCheckIn && tempCheckOut)) {
              // First click: select check-in
              tempCheckIn = dateStr;
              tempCheckOut = null;
              updateView();
              if (onDateSelect) onDateSelect(tempCheckIn, null);
            } else if (tempCheckIn && !tempCheckOut) {
              // Second click: select check-out
              if (dateStr <= tempCheckIn) {
                // If clicked date is before check-in, set it as new check-in
                tempCheckIn = dateStr;
                tempCheckOut = null;
                updateView();
                if (onDateSelect) onDateSelect(tempCheckIn, null);
              } else {
                tempCheckOut = dateStr;
                updateView();
                if (onDateSelect) onDateSelect(tempCheckIn, tempCheckOut);
              }
            }
          });
        });
      }
    };

    updateView();
  }
};

