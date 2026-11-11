# HOTELORA — Complete Hotel Reservation Management System
**Course Project: CSE 326 — Internet Programming / Web Technologies**

A modern luxury hotel reservation web application and administration dashboard built with **HTML5**, **CSS3**, and **Vanilla JavaScript (ES6+)**. 

No external frameworks or libraries (no React, Angular, Vue, Bootstrap, Tailwind, jQuery, Node.js, or PHP). The application runs directly in any web browser and uses **LocalStorage** for data persistence.

---

## 🚀 Quick Start Guide

1. Navigate to the `hotelora/` folder.
2. Double-click `index.html` (or open it in Google Chrome, Microsoft Edge, or Mozilla Firefox).
3. The application will initialize sample data automatically into your browser's `localStorage` on first load.
4. To open the Hotel Administration Dashboard, click **Admin Portal** in the navigation header or open `admin.html` directly.
   - **Demo Admin Password:** `admin123` (or click **One-Click Quick Sign In**).

---

## 📁 Project Structure

```text
CSE 326/
├── index.html                  # Quick root redirect to hotelora/index.html
├── README.md                   # Complete project documentation & viva guide
└── hotelora/
    ├── index.html              # Customer Landing Page (Hero, search panel, highlights, featured rooms)
    ├── rooms.html              # Room Catalog, Filters, Live Month Calendar, 3-Room Comparison
    ├── booking.html            # 4-Step Guided Booking Workflow with live pricing breakdown
    ├── confirmation.html       # Booking Confirmation Voucher with window.print() print layout
    ├── my-bookings.html        # Customer Portal (Search by ID/Name/Email, view voucher, cancel stay)
    ├── admin.html              # Hotel Administration Dashboard (Overview, Rooms, Bookings, Pricing, Reports)
    │
    ├── css/
    │   ├── style.css           # Global luxury theme, color variables, typography, modals, toasts, print CSS
    │   ├── rooms.css           # Room cards grid, sticky comparison dock, comparison matrix
    │   ├── booking.css         # Multi-step progress bar, radio room cards, requests checkboxes, sticky sidebar
    │   └── admin.css           # Admin sidebar, metric cards, tables, pricing matrix, visual charts
    │
    ├── js/
    │   ├── storage.js          # LocalStorage CRUD persistence, default rooms, sample bookings, demo reset
    │   ├── validation.js       # XSS sanitization, email/phone/date validation, toast notifications
    │   ├── pricing.js          # Dynamic calculation engine (base, weekend, seasonal, discounts, taxes)
    │   ├── availability.js     # Exact date overlap logic & interactive monthly calendar
    │   ├── app.js              # Homepage search form and featured room preview cards
    │   ├── rooms.js            # Catalog filtering, sorting, 3-room comparison with difference highlights
    │   ├── booking.js          # Multi-step stepper, live pricing updates, booking creation
    │   └── admin.js            # Admin metrics, room CRUD, reservations manager, pricing editor, reports
    │
    └── assets/
        └── images/             # Local assets directory
```

---

## 🛠️ Key Features Implemented

### 1. Customer Homepage (`index.html`)
- **Luxury Brand Aesthetic**: Warm neutrals, charcoal (`#14171c`), soft cream background (`#faf8f5`), subtle gold accents (`#b38b4d`), and serif headings (*Playfair Display*).
- **Navigation Bar**: Responsive header with mobile hamburger menu and direct links to Home, Rooms, Amenities, My Bookings, and Admin Portal.
- **Hero & Search Panel**: Check-in and check-out date pickers with validation (check-in $\ge$ today, check-out $>$ check-in), guest counts, and room quantity.
- **Hotel Highlights**: Free Wi-Fi 6, heated infinity pool, fine dining, 24/7 room service, valet parking, and fitness centre.
- **Featured Rooms**: Live room cards rendered from storage with quick specifications and a detailed modal view.

### 2. Room Listings & Comparison (`rooms.html`)
- **Filter & Sort Toolbar**: Filter by category, bed layout (King, Queen, Twin), price range slider (up to $1,000), or sort by price and capacity.
- **Interactive Calendar**: Collapsible monthly availability calendar with visual indicators:
  - 🟢 **Green** = Available ($>50\%$ inventory remaining)
  - 🟡 **Yellow** = Limited availability ($1\text{--}50\%$ inventory)
  - 🔴 **Red** = Fully booked ($0$ inventory)
- **3-Room Comparison**:
  - Select up to 3 rooms using the "Add to Compare" checkboxes.
  - Floating bottom dock tracks selections and provides a one-click "Compare Side by Side" button.
  - Side-by-side comparison modal displays room size, price, bed layout, balcony, breakfast, Wi-Fi, AC, and cancellation policies.
  - Differing attributes are highlighted in warm gold.

### 3. Multi-Step Booking Workflow (`booking.html`)
- **Step 1: Stay Dates & Occupancy**: Date range validation and room quantity selection.
- **Step 2: Room Category Selection**: Interactive cards with photos, amenities, nightly rates, and real-time inventory checks.
- **Step 3: Guest Information & Special Requests**:
  - Required fields: Full name, email, phone, country/region.
  - Stay preferences: Estimated arrival time, accessibility requirements, bed layout preference.
  - Special requests checkboxes: Early check-in, late check-out, airport pickup, extra pillows, extra bed, vegetarian meal, birthday decoration, honeymoon arrangement, other requests.
  - Additional instructions textarea.
- **Step 4: Review Summary & Confirmation**: Complete guest and stay summary, transparent itemized pricing breakdown, agreement checkbox (*"I confirm that the booking information is correct"*), and duplicate submission prevention.
- **Sticky Price Breakdown Sidebar**: Real-time updates showing room subtotal, promotional discounts, extra guest charges, breakfast charges, and government taxes.

### 4. Booking Confirmation (`confirmation.html`)
- Generates a unique reference ID (e.g. `HTL-849204`).
- Shows confirmed status, guest details, room details, and full financial receipt.
- Printable confirmation using `window.print()` with custom `@media print` styling (hides navigation, footers, and buttons for a clean receipt voucher).

### 5. Customer Booking Management (`my-bookings.html`)
- Search existing reservations by **Booking Reference ID**, **Guest Name**, or **Guest Email**.
- Filter by status tabs: *All, Confirmed, Pending, Completed, Cancelled*.
- View full reservation modal details.
- Cancel eligible upcoming reservations:
  - Confirms cancellation reason.
  - Updates reservation status to `Cancelled` in `localStorage`.
  - Instantly frees up room inventory on the availability calendar.

### 6. Hotel Administration Dashboard (`admin.html`)
- **Demonstration Admin Login**: Client-side demo authentication overlay with disclaimer and quick sign-in.
- **Sidebar Tabs**:
  1. **Overview**: Real-time KPI metrics (Total rooms, Available today, Occupied today, Total bookings, Pending, Cancelled, Estimated revenue), occupancy breakdown, and recent reservations table.
  2. **Room Management**: Add new room categories, edit existing rooms, delete rooms without active bookings, update inventory, and change images.
  3. **Availability Calendar**: Master monthly calendar showing occupancy across all categories.
  4. **Reservation Management**: Filter by status, search bookings, inspect audit details, and update status (*Confirmed, Pending, Completed, Cancelled*).
  5. **Pricing Management**: Live editable matrix to update base rates, weekend rates, seasonal multipliers, discounts, and tax/surcharge rates.
  6. **Guest Directory**: View customer history, stay counts, and lifetime spend.
  7. **Reports & Analytics**: Filter by timeframe (*All Time, Today, Last 7 Days, Last 30 Days*), KPI averages, and CSS category popularity chart.
  8. **Settings & Demo Reset**: Edit property contact information and reset all data to default demo state.

---

## 🧮 Core Algorithms & Technical Details

### 1. Date Overlap Availability Formula
```javascript
// Located in hotelora/js/availability.js
isDateOverlapping(reqCheckIn, reqCheckOut, existCheckIn, existCheckOut) {
  const rIn = new Date(reqCheckIn + 'T00:00:00');
  const rOut = new Date(reqCheckOut + 'T00:00:00');
  const eIn = new Date(existCheckIn + 'T00:00:00');
  const eOut = new Date(existCheckOut + 'T00:00:00');

  // Exact overlap condition:
  return rIn < eOut && rOut > eIn;
}
```

### 2. Pricing Engine Calculation
```javascript
// Located in hotelora/js/pricing.js
// 1. Room Subtotal = Number of rooms * sum of nightly rates (checking weekends)
const roomSubtotal = totalRoomCostPerUnit * numRooms;

// 2. Promotional Discount
const discountAmount = (roomSubtotal * discountPercentage) / 100;

// 3. Extra Guest Charges
const extraGuestCharges = extraGuestsCount * extraGuestRate * nights;

// 4. Breakfast Charges (if requested and not already included)
const breakfastCharges = totalGuests * breakfastPerPerson * nights;

// 5. Applicable Taxes
const taxableAmount = roomSubtotal - discountAmount + extraGuestCharges + breakfastCharges;
const taxAmount = (taxableAmount * taxRate) / 100;

// 6. Final Total
const finalTotal = taxableAmount + taxAmount;
```

---

## 🎓 Viva / Presentation Q&A Reference

**Q1: How does the application persist data without a backend server or database?**  
*Answer:* It utilizes the browser's `window.localStorage` API. Structured JSON objects for rooms, bookings, pricing configuration, and hotel settings are serialized (`JSON.stringify`) and deserialized (`JSON.parse`) in `storage.js`.

**Q2: How does the system prevent double booking of rooms?**  
*Answer:* In `availability.js`, when a customer searches for a date range, the system checks each night against all confirmed and pending bookings using the overlap logic `requestedCheckIn < existingCheckOut && requestedCheckOut > existingCheckIn`. For each night, it counts overlapping rooms booked and subtracts from the room category's total inventory. If remaining rooms are less than requested, the booking is blocked.

**Q3: How is XSS (Cross-Site Scripting) prevented when displaying guest data?**  
*Answer:* In `validation.js`, the `escapeHtml(str)` utility converts user-entered characters `&`, `<`, `>`, `"`, and `'` into safe HTML character entities before injecting them into the DOM, preventing script injection.

**Q4: How does printing work for the confirmation voucher?**  
*Answer:* In `confirmation.html`, clicking "Print Confirmation" invokes `window.print()`. A dedicated `@media print` CSS block hides all non-essential elements (navigation bar, footer, interactive buttons) and formats the voucher as a clean receipt.

---

## 📄 License & Attribution
Designed for educational purposes for **CSE 326: Internet Programming**. Free to modify and submit as coursework.

