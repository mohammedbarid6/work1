# AuraMarket — Modern Full-Featured E-Commerce Web Application

AuraMarket is a modern, high-performance, full-featured E-Commerce web application built with a responsive single-page architecture, pure ES Modules, Tailwind CSS, Lucide-style SVG graphics, and a Node.js Express REST API backend with resilient JSON data persistence.

---

## 🌟 Highlights & Features

### 1. Storefront & Dynamic Catalog
- **24+ Curated Products** across 5 departments:
  - 🎧 *Personal Electronics*
  - 👜 *Fashion & Leather Goods*
  - ☕ *Artisan Home & Living*
  - 🧘 *Fitness & Sports*
  - ✨ *Beauty & Wellness*
- High-resolution verified imagery, discount tags (`20% OFF`, `Bestseller`, `New Arrival`), stock alerts (`In Stock`, `Only 3 left!`, `Out of Stock`), star ratings, and review counts.

### 2. Search, Multi-Facet Filters & Sorting
- **Real-Time Live Search**: Debounced instant keyword matching across title, descriptions, and category tags.
- **Department Pills**: Instant category filtering with item counts.
- **Price Slider**: Dynamic slider to filter maximum budget threshold.
- **In-Stock Filter**: Instant toggle to show only available inventory.
- **Sorting Modes**: Featured First, Price: Low to High, Price: High to Low, Highest Rated, and Newest Arrivals.

### 3. Product Quick View & Details Modal
- Image gallery with interactive thumbnail switching.
- Detailed technical specifications table.
- Real-time stock status indicator.
- Wishlist heart toggle with instant badge counter.
- **Interactive Review System**: Verified buyer ratings with a 5-star interactive picker and submission form that calculates ratings live.

### 4. Interactive Slide-Out Cart Drawer
- Smooth slide-out cart drawer with zero page reloads.
- Item quantity stepper (`+` / `-`) and instant item removal.
- **Dynamic Free Shipping Progress Meter**: Real-time progress bar towards free shipping over $50.
- **Coupon Code Engine**:
  - `SAVE10`: 10% off entire order.
  - `AURA20`: 20% off orders over $75.
  - `FREESHIP`: Free standard shipping.
  - `HACKFEST`: $25 off orders over $100.
- Detailed financial breakdown: Subtotal, Discount, Shipping, Estimated Tax (8%), and Total.

### 5. Multi-Step Checkout & Order Generation
- Contact info and shipping address fields with **⚡ One-Click Autofill Demo Details**.
- Shipping method selection: Standard Delivery (Free > $50 or $8.99) vs Express Overnight ($15.00).
- Payment methods: Credit Card (with **Auto-fill Test Card**), UPI / Instant Wallet, and Cash on Delivery.
- Order submission with stock decrementing, unique Order ID generation (e.g. `ORD-2026-9041`), and printable receipt view.

### 6. Real-Time Order Tracking
- Track order by Order ID with a 5-stage shipment timeline:
  `Order Placed` ➔ `Processing` ➔ `Shipped` ➔ `Out for Delivery` ➔ `Delivered`
- Full package contents review, carrier details, and tracking number.

### 7. Admin & Inventory Management Portal
- **Key Performance Indicators (KPIs)**: Gross Sales, Total Orders Placed, Average Order Value (AOV), and Catalog Items count.
- **Product Inventory Manager**: Add new products with custom images, prices, categories, and stock; delete products.
- **Order Fulfillment Manager**: Real-time dropdown to update customer order stages (`Confirmed`, `Processing`, `Shipped`, `Delivered`).

### 8. UX Polish
- **Dark Mode / Light Mode**: Smooth theme toggle persisted in `localStorage`.
- **Wishlist Manager**: Modal to view favorited items with one-click "Move to Cart".
- **Floating Toast System**: Non-blocking toast notifications for user actions.
- **Zero Build-Step Fragility**: Runs directly via standard Node.js without fragile build tools.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or newer recommended, tested on Node v22.15.0)

### 1. Installation
In the project folder, dependencies are already installed:
```powershell
npm.cmd install
```

### 2. Start the Server
```powershell
node server.js
```
The server will start at:
👉 **`http://localhost:3000`**

*(If port 3000 is occupied, the server will automatically detect and bind to port 3001 or next available port).*

### 3. Run Automated Tests
```powershell
node test-api.js
```
Executes 10 end-to-end integration tests covering all REST endpoints, filtering, ordering, coupons, and admin operations.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | Query products (`?category=...&search=...&minPrice=...&maxPrice=...&inStock=true&sort=...`) |
| `GET` | `/api/products/:id` | Fetch single product and its customer reviews |
| `POST` | `/api/products` | Create a new product (Admin) |
| `PUT` | `/api/products/:id` | Update product details or stock (Admin) |
| `DELETE` | `/api/products/:id` | Delete product from catalog (Admin) |
| `POST` | `/api/products/:id/reviews` | Submit verified customer review & recalculate rating |
| `POST` | `/api/coupons/validate` | Validate coupon code and calculate discount |
| `GET` | `/api/orders` | List orders (optional `?email=...`) |
| `GET` | `/api/orders/:id` | Get single order and shipment tracking timeline |
| `POST` | `/api/orders` | Place new order, decrement stock, generate tracking |
| `PATCH` | `/api/orders/:id/status` | Update fulfillment status (Admin) |
| `GET` | `/api/stats` | Admin KPIs: Revenue, orders, AOV, low stock alerts |

---

## 🎟️ Demo Promo Codes
Try applying any of these in the cart drawer:
- `SAVE10` — 10% off entire order
- `FREESHIP` — Free shipping
- `AURA20` — 20% off orders over $75
- `HACKFEST` — $25 off orders over $100

---

## 📂 Project Structure
```
c:\Users\DELL\Desktop\HF26-42\ECOMMERCE\
├── package.json
├── server.js                      # Express REST API & static server
├── test-api.js                    # Automated integration test suite
├── README.md                      # Documentation
├── data/
│   ├── products.json              # Catalog items with specs & tags
│   ├── orders.json                # Placed orders & tracking stages
│   ├── coupons.json               # Promo codes
│   └── reviews.json               # Customer reviews
└── public/
    ├── index.html                 # Single page application markup
    ├── css/
    │   └── styles.css             # Theme variables, glassmorphism, animations
    └── js/
        ├── app.js                 # App controller & event routing
        ├── store.js               # Central reactive state & localStorage
        ├── api.js                 # Fetch client for REST endpoints
        ├── utils/
        │   └── helpers.js         # Formatting, debounce, stars renderer
        └── components/
            ├── toast.js           # Floating toast alerts
            ├── productCard.js     # Responsive product card
            ├── productModal.js    # Gallery, specs, and review form
            ├── cartDrawer.js      # Slide-out bag & coupon code engine
            ├── checkoutModal.js   # 3-step checkout & order receipt
            ├── orderTracking.js   # Live multi-stage shipment timeline
            └── adminDashboard.js  # Sales KPIs & inventory controls
```
