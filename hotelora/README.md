# HOTELORA — Complete Hotel Reservation Management System
**Course Project: CSE 326 — Internet Programming / Web Technologies**

A modern luxury hotel reservation web application and administration dashboard built with **HTML5**, **CSS3**, and **Vanilla JavaScript (ES6+)**. 

No external frameworks or libraries (no React, Angular, Vue, Bootstrap, Tailwind, jQuery, Node.js, or PHP). The application runs directly in any web browser and uses **LocalStorage** for data persistence.

---

## 🚀 Quick Start Guide

1. Double-click `index.html` (or open it in Google Chrome, Microsoft Edge, or Mozilla Firefox).
2. The application will initialize sample data automatically into your browser's `localStorage` on first load.
3. To open the Hotel Administration Dashboard, click **Admin Portal** in the navigation header or open `admin.html` directly.
   - **Demo Admin Password:** `admin123` (or click **One-Click Quick Sign In**).

---

## 📁 File Structure

- `index.html`: Customer Landing Page (Hero, search panel, highlights, featured rooms)
- `rooms.html`: Room Catalog, Filters, Live Month Calendar, 3-Room Comparison
- `booking.html`: 4-Step Guided Booking Workflow with live pricing breakdown
- `confirmation.html`: Booking Confirmation Voucher with window.print() print layout
- `my-bookings.html`: Customer Portal (Search by ID/Name/Email, view voucher, cancel stay)
- `admin.html`: Hotel Administration Dashboard (Overview, Rooms, Bookings, Pricing, Reports)
- `css/style.css`: Global luxury theme, color variables, typography, modals, toasts, print CSS
- `css/rooms.css`: Room cards grid, sticky comparison dock, comparison matrix
- `css/booking.css`: Multi-step progress bar, radio room cards, requests checkboxes, sticky sidebar
- `css/admin.css`: Admin sidebar, metric cards, tables, pricing matrix, visual charts
- `js/storage.js`: LocalStorage CRUD persistence, default rooms, sample bookings, demo reset
- `js/validation.js`: XSS sanitization, email/phone/date validation, toast notifications
- `js/pricing.js`: Dynamic calculation engine (base, weekend, seasonal, discounts, taxes)
- `js/availability.js`: Exact date overlap logic & interactive monthly calendar
- `js/app.js`: Homepage search form and featured room preview cards
- `js/rooms.js`: Catalog filtering, sorting, 3-room comparison with difference highlights
- `js/booking.js`: Multi-step stepper, live pricing updates, booking creation
- `js/admin.js`: Admin metrics, room CRUD, reservations manager, pricing editor, reports

