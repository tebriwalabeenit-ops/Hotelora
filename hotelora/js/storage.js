/**
 * HOTELORA - LocalStorage Data Persistence Layer
 * Provides robust CRUD operations with initial sample data and fallbacks.
 */

const STORAGE_KEYS = {
  ROOMS: 'hotelora_rooms_v1',
  BOOKINGS: 'hotelora_bookings_v1',
  PRICING: 'hotelora_pricing_v1',
  SETTINGS: 'hotelora_settings_v1',
  ADMIN_SESSION: 'hotelora_admin_session_v1'
};

// Initial default luxury room types
const DEFAULT_ROOMS = [
  {
    id: 'std-01',
    name: 'Standard Room',
    category: 'Standard Room',
    description: 'Thoughtfully designed for comfort and tranquility, our Standard Room features contemporary furnishings, a plush queen-size bed, and essential amenities for business or leisure travelers.',
    price: 120,
    weekendPrice: 145,
    seasonalPrice: 135,
    discountPercentage: 0,
    inventory: 10,
    occupancy: { adults: 2, children: 1, maxGuests: 3 },
    bedType: '1 Queen Bed',
    size: '28 m² / 300 sq ft',
    amenities: ['Free High-Speed Wi-Fi', 'Individual Air Conditioning', '43-inch Smart TV', 'En-suite Rain Shower', 'Tea & Coffee Station', 'Ergonomic Work Desk', 'Electronic In-room Safe'],
    balcony: false,
    breakfastIncluded: false,
    cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    featured: true
  },
  {
    id: 'dlx-02',
    name: 'Deluxe Room',
    category: 'Deluxe Room',
    description: 'Elevate your stay with our spacious Deluxe Room, featuring panoramic city skyline views, bespoke designer accents, a luxury Italian marble bath, and enhanced comfort.',
    price: 180,
    weekendPrice: 215,
    seasonalPrice: 200,
    discountPercentage: 10,
    inventory: 8,
    occupancy: { adults: 2, children: 2, maxGuests: 4 },
    bedType: '1 King Bed or 2 Twin Beds',
    size: '38 m² / 410 sq ft',
    amenities: ['Free High-Speed Wi-Fi', 'Climate Control AC', 'Private City View Balcony', '55-inch Ultra HD TV', 'Marble Bath with Rain Shower', 'Nespresso Coffee Bar', 'Mini Bar Selection', 'Luxury Bathrobes & Slippers'],
    balcony: true,
    breakfastIncluded: true,
    cancellationPolicy: 'Free cancellation up to 24 hours before check-in',
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
    featured: true
  },
  {
    id: 'exe-03',
    name: 'Executive Room',
    category: 'Executive Room',
    description: 'Tailored for discerning professionals and travelers, the Executive Room includes exclusive access to our 14th-floor Executive Club Lounge, private terrace, and personalized concierge service.',
    price: 260,
    weekendPrice: 295,
    seasonalPrice: 280,
    discountPercentage: 15,
    inventory: 6,
    occupancy: { adults: 3, children: 1, maxGuests: 4 },
    bedType: '1 King Bed + Lounge Sofa',
    size: '48 m² / 515 sq ft',
    amenities: ['Executive Club Lounge Access', 'Complimentary Evening Cocktails', 'Private Panoramic Balcony', 'Deep Soaking Tub & Rain Shower', 'Dedicated Concierge', 'Workstation with USB-C Hub', 'High-Speed Wi-Fi 6', 'Turndown Service'],
    balcony: true,
    breakfastIncluded: true,
    cancellationPolicy: 'Free cancellation up to 24 hours before check-in',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    featured: true
  },
  {
    id: 'ps-04',
    name: 'Premium Suite',
    category: 'Premium Suite',
    description: 'An oasis of pure luxury featuring an expansive private living parlor, panoramic floor-to-ceiling windows, spa-inspired marble bath with soaking jacuzzi, and optional butler service.',
    price: 390,
    weekendPrice: 450,
    seasonalPrice: 420,
    discountPercentage: 10,
    inventory: 4,
    occupancy: { adults: 4, children: 2, maxGuests: 6 },
    bedType: '1 King Master Suite + Queen Sofa Bed',
    size: '68 m² / 730 sq ft',
    amenities: ['Separate Living & Dining Salon', 'Private Wrap-around Balcony', 'Hydromassage Jacuzzi Bath', 'Walk-in Dressing Closet', 'Complimentary Gourmet Minibar', '24/7 Priority Butler Service', 'Premium Sound System', 'Bvlgari Toiletries'],
    balcony: true,
    breakfastIncluded: true,
    cancellationPolicy: 'Free cancellation up to 72 hours before check-in',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
    featured: true
  },
  {
    id: 'fam-05',
    name: 'Family Suite',
    category: 'Family Suite',
    description: 'Designed specifically for family getaways with two generous interconnecting bedrooms, two full bathrooms, a children entertainment nook, and generous living space to keep everyone comfortable.',
    price: 330,
    weekendPrice: 380,
    seasonalPrice: 350,
    discountPercentage: 5,
    inventory: 5,
    occupancy: { adults: 5, children: 3, maxGuests: 8 },
    bedType: '1 King Bed + 2 Twin Beds + 1 Daybed',
    size: '64 m² / 690 sq ft',
    amenities: ['Two Interconnected Bedrooms', 'Two Full En-suite Bathrooms', 'Child-safe Private Balcony', 'Play & Gaming Corner', 'Kitchenette with Microwave & Fridge', 'Kids Welcome Gift Kit', 'Fast Family Wi-Fi', 'Baby Crib upon request'],
    balcony: true,
    breakfastIncluded: true,
    cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
    image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
    featured: true
  }
];

// Initial default pricing parameters
const DEFAULT_PRICING = {
  extraGuestCharge: 35,
  breakfastCharge: 25,
  taxRate: 12, // percentage
  currencySymbol: '$',
  currencyCode: 'USD',
  seasonalMultiplier: 1.15 // for peak seasons if toggled
};

// Initial default hotel settings
const DEFAULT_SETTINGS = {
  hotelName: 'HOTELORA Luxury Resort & Spa',
  email: 'reservations@hotelora.com',
  phone: '+1 (800) 468-3567',
  address: '742 Ocean Promenade, Grand Bay Coastal District',
  checkInTime: '15:00',
  checkOutTime: '11:00',
  cancellationWindowHours: 24
};

// Helper: Get formatted date string YYYY-MM-DD
function getDateStringOffset(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

// Generate realistic sample bookings relative to current date
function generateInitialBookings() {
  return [
    {
      bookingId: 'HTL-109482',
      guestName: 'Eleanor Vance',
      email: 'eleanor.vance@example.com',
      phone: '+1 555-0192',
      country: 'United States',
      roomId: 'dlx-02',
      roomName: 'Deluxe Room',
      checkIn: getDateStringOffset(1),
      checkOut: getDateStringOffset(4),
      adults: 2,
      children: 1,
      numberOfRooms: 1,
      specialRequests: ['Late check-out', 'Airport pickup', 'Extra pillows'],
      instructions: 'Please arrange airport pickup around 2 PM.',
      subtotal: 540,
      discount: 54,
      extraGuestCharges: 0,
      breakfastCharges: 0, // already included in Deluxe
      taxes: 58.32,
      total: 544.32,
      status: 'Confirmed',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      bookingId: 'HTL-109483',
      guestName: 'Julian Sterling',
      email: 'j.sterling@financehub.co.uk',
      phone: '+44 20 7946 0912',
      country: 'United Kingdom',
      roomId: 'exe-03',
      roomName: 'Executive Room',
      checkIn: getDateStringOffset(2),
      checkOut: getDateStringOffset(6),
      adults: 2,
      children: 0,
      numberOfRooms: 1,
      specialRequests: ['Early check-in', 'Vegetarian meal'],
      instructions: 'High floor preferred please.',
      subtotal: 1040,
      discount: 156,
      extraGuestCharges: 0,
      breakfastCharges: 0,
      taxes: 106.08,
      total: 990.08,
      status: 'Confirmed',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      bookingId: 'HTL-109484',
      guestName: 'Sophia & Marcus Rossi',
      email: 'sophia.rossi@milano.it',
      phone: '+39 02 8901 2345',
      country: 'Italy',
      roomId: 'ps-04',
      roomName: 'Premium Suite',
      checkIn: getDateStringOffset(5),
      checkOut: getDateStringOffset(9),
      adults: 2,
      children: 0,
      numberOfRooms: 1,
      specialRequests: ['Honeymoon arrangement', 'Birthday decoration'],
      instructions: 'We are celebrating our 5th wedding anniversary.',
      subtotal: 1560,
      discount: 156,
      extraGuestCharges: 0,
      breakfastCharges: 0,
      taxes: 168.48,
      total: 1572.48,
      status: 'Pending',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      bookingId: 'HTL-109480',
      guestName: 'David Zhang',
      email: 'dzhang@techventures.sg',
      phone: '+65 6789 0123',
      country: 'Singapore',
      roomId: 'std-01',
      roomName: 'Standard Room',
      checkIn: getDateStringOffset(-5),
      checkOut: getDateStringOffset(-1),
      adults: 1,
      children: 0,
      numberOfRooms: 1,
      specialRequests: ['Quiet room'],
      instructions: 'Attended regional seminar.',
      subtotal: 480,
      discount: 0,
      extraGuestCharges: 0,
      breakfastCharges: 100,
      taxes: 69.60,
      total: 649.60,
      status: 'Completed',
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString()
    },
    {
      bookingId: 'HTL-109481',
      guestName: 'Clara Dubois',
      email: 'clara.dubois@parisart.fr',
      phone: '+33 1 42 68 55 00',
      country: 'France',
      roomId: 'fam-05',
      roomName: 'Family Suite',
      checkIn: getDateStringOffset(-2),
      checkOut: getDateStringOffset(2),
      adults: 3,
      children: 2,
      numberOfRooms: 1,
      specialRequests: ['Extra bed', 'Airport pickup'],
      instructions: 'Trip rescheduled due to flight changes.',
      subtotal: 1320,
      discount: 66,
      extraGuestCharges: 0,
      breakfastCharges: 0,
      taxes: 150.48,
      total: 1404.48,
      status: 'Cancelled',
      cancellationReason: 'Customer requested cancellation due to flight schedule.',
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString()
    }
  ];
}

/**
 * Storage Controller Object
 */
const StorageController = {
  // Initialize storage if not already populated
  init() {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.ROOMS)) {
        this.saveRooms(DEFAULT_ROOMS);
      }
      if (!localStorage.getItem(STORAGE_KEYS.PRICING)) {
        this.savePricingConfig(DEFAULT_PRICING);
      }
      if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        this.saveSettings(DEFAULT_SETTINGS);
      }
      if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
        this.saveBookings(generateInitialBookings());
      }
    } catch (e) {
      console.warn('LocalStorage initialization warning:', e);
    }
  },

  // Rooms CRUD
  getRooms() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROOMS);
      return data ? JSON.parse(data) : DEFAULT_ROOMS;
    } catch (e) {
      console.error('Error reading rooms from storage:', e);
      return DEFAULT_ROOMS;
    }
  },

  getRoomById(id) {
    const rooms = this.getRooms();
    return rooms.find(r => r.id === id) || null;
  },

  saveRooms(rooms) {
    try {
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
      return true;
    } catch (e) {
      console.error('Error saving rooms:', e);
      return false;
    }
  },

  saveRoom(room) {
    const rooms = this.getRooms();
    const index = rooms.findIndex(r => r.id === room.id);
    if (index >= 0) {
      rooms[index] = { ...rooms[index], ...room };
    } else {
      rooms.push(room);
    }
    return this.saveRooms(rooms);
  },

  deleteRoom(id) {
    const rooms = this.getRooms();
    const updated = rooms.filter(r => r.id !== id);
    return this.saveRooms(updated);
  },

  // Bookings CRUD
  getBookings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading bookings from storage:', e);
      return [];
    }
  },

  getBookingById(id) {
    const bookings = this.getBookings();
    return bookings.find(b => b.bookingId.toLowerCase() === id.trim().toLowerCase()) || null;
  },

  saveBookings(bookings) {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
      return true;
    } catch (e) {
      console.error('Error saving bookings:', e);
      return false;
    }
  },

  addBooking(booking) {
    const bookings = this.getBookings();
    // Prevent duplicate booking ID
    const exists = bookings.some(b => b.bookingId === booking.bookingId);
    if (exists) {
      booking.bookingId = 'HTL-' + Math.floor(100000 + Math.random() * 900000);
    }
    bookings.unshift(booking);
    return this.saveBookings(bookings);
  },

  updateBookingStatus(bookingId, newStatus, reason = '') {
    const bookings = this.getBookings();
    const booking = bookings.find(b => b.bookingId === bookingId);
    if (booking) {
      booking.status = newStatus;
      if (reason) {
        booking.cancellationReason = reason;
      }
      booking.updatedAt = new Date().toISOString();
      return this.saveBookings(bookings);
    }
    return false;
  },

  // Pricing Config
  getPricingConfig() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRICING);
      return data ? JSON.parse(data) : DEFAULT_PRICING;
    } catch (e) {
      console.error('Error reading pricing config:', e);
      return DEFAULT_PRICING;
    }
  },

  savePricingConfig(config) {
    try {
      localStorage.setItem(STORAGE_KEYS.PRICING, JSON.stringify(config));
      return true;
    } catch (e) {
      console.error('Error saving pricing:', e);
      return false;
    }
  },

  // Settings
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : DEFAULT_SETTINGS;
    } catch (e) {
      console.error('Error reading settings:', e);
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (e) {
      console.error('Error saving settings:', e);
      return false;
    }
  },

  // Admin Session (Simulated frontend demo auth)
  isAdminLoggedIn() {
    return sessionStorage.getItem(STORAGE_KEYS.ADMIN_SESSION) === 'true';
  },

  setAdminLoggedIn(status) {
    if (status) {
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
    }
  },

  // Reset to default sample data
  resetDemoData() {
    localStorage.removeItem(STORAGE_KEYS.ROOMS);
    localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
    localStorage.removeItem(STORAGE_KEYS.PRICING);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    this.init();
    return true;
  }
};

// Initialize right away on script load
StorageController.init();

