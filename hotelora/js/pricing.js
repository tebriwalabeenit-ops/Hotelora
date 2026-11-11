/**
 * HOTELORA - Pricing Management and Dynamic Calculation Engine
 * Implements base rates, weekend adjustments, seasonal rules, discounts, taxes, and transparent breakdowns.
 */

const PricingEngine = {
  /**
   * Determine if a given date string is a weekend night (Friday or Saturday)
   */
  isWeekend(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay(); // 0: Sun, 1: Mon, ... 5: Fri, 6: Sat
    return day === 5 || day === 6;
  },

  /**
   * Generate an array of date strings for each night between checkIn and checkOut
   */
  getNightsList(checkInStr, checkOutStr) {
    const dates = [];
    const current = new Date(checkInStr + 'T00:00:00');
    const end = new Date(checkOutStr + 'T00:00:00');

    while (current < end) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  },

  /**
   * Calculate complete transparent price breakdown for a requested stay
   */
  calculateBreakdown({
    roomId,
    checkIn,
    checkOut,
    numberOfRooms = 1,
    adults = 2,
    children = 0,
    wantsBreakfast = false
  }) {
    const room = StorageController.getRoomById(roomId) || StorageController.getRooms()[0];
    const pricingConfig = StorageController.getPricingConfig();

    const nightsList = this.getNightsList(checkIn, checkOut);
    const nights = Math.max(1, nightsList.length);
    const numRooms = Math.max(1, parseInt(numberOfRooms, 10) || 1);
    const numAdults = Math.max(1, parseInt(adults, 10) || 1);
    const numChildren = Math.max(0, parseInt(children, 10) || 0);
    const totalGuests = numAdults + numChildren;

    // Calculate nightly rates
    let totalRoomCostPerUnit = 0;
    const nightlyRates = nightsList.map(dateStr => {
      const weekend = this.isWeekend(dateStr);
      const rate = weekend ? (room.weekendPrice || room.price * 1.2) : (room.price || 120);
      totalRoomCostPerUnit += rate;
      return {
        date: dateStr,
        isWeekend: weekend,
        rate: rate
      };
    });

    // Room Subtotal
    const roomSubtotal = totalRoomCostPerUnit * numRooms;

    // Discount
    const discountPercentage = room.discountPercentage || 0;
    const discountAmount = (roomSubtotal * discountPercentage) / 100;

    // Extra guest charges (if guests exceed standard room capacity of adults)
    const baseIncludedGuests = (room.occupancy && room.occupancy.adults) ? room.occupancy.adults * numRooms : (2 * numRooms);
    const extraGuestsCount = Math.max(0, totalGuests - baseIncludedGuests);
    const extraGuestRate = pricingConfig.extraGuestCharge || 35;
    const extraGuestCharges = extraGuestsCount * extraGuestRate * nights;

    // Breakfast charges
    let breakfastCharges = 0;
    let breakfastIncluded = !!room.breakfastIncluded;
    const breakfastPerPerson = pricingConfig.breakfastCharge || 25;

    if (!breakfastIncluded && wantsBreakfast) {
      breakfastCharges = totalGuests * breakfastPerPerson * nights;
    }

    // Taxable subtotal before taxes
    const taxableAmount = roomSubtotal - discountAmount + extraGuestCharges + breakfastCharges;
    const taxRate = pricingConfig.taxRate || 12;
    const taxAmount = (taxableAmount * taxRate) / 100;

    // Final total
    const finalTotal = taxableAmount + taxAmount;

    return {
      roomId: room.id,
      roomName: room.name,
      category: room.category,
      nights,
      numberOfRooms: numRooms,
      totalGuests,
      adults: numAdults,
      children: numChildren,
      nightlyRates,
      avgNightlyRate: nights > 0 ? (totalRoomCostPerUnit / nights) : room.price,
      roomSubtotal,
      discountPercentage,
      discountAmount,
      extraGuestsCount,
      extraGuestRate,
      extraGuestCharges,
      breakfastIncluded,
      wantsBreakfast,
      breakfastPerPerson,
      breakfastCharges,
      taxRate,
      taxAmount,
      finalTotal,
      currencySymbol: pricingConfig.currencySymbol || '$'
    };
  }
};

