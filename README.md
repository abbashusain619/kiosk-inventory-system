# 🏪 Kiosk Live – Complete Inventory Management System

A **production‑ready, real‑time** inventory system designed for kiosks, small retailers, and local shops. Built with **Astro 6**, **SQLite**, **Tailwind CSS**, and **Alpine.js** – fully modular, secure, and extensible.

[![GitHub license](https://img.shields.io/github/license/abbashusain619/kiosk-inventory-system)](LICENSE)  
[![Astro](https://img.shields.io/badge/Astro-6.x-FF5D01?logo=astro)](https://astro.build)  
[![SQLite](https://img.shields.io/badge/SQLite-3.x-003B57?logo=sqlite)](https://sqlite.org)  
[![Tailwind](https://img.shields.io/badge/Tailwind-3.x-38B2AC?logo=tailwind-css)](https://tailwindcss.com)

---

## ✨ Features

### ✅ Core (Phase 1)
- **Real‑time stock updates** – Server‑Sent Events (SSE) broadcast every stock change instantly to all connected clients.
- **Complete product management** – CRUD, categories, suppliers, units, promotions (sale badges).
- **Stock movements** – purchase (stock in), adjustments, and **cost correction** (change cost without affecting stock).
- **Multi‑product sales** – create baskets, apply discounts (percentage or fixed), and sell multiple items.
- **Quick sell** – one‑click sale from product list.
- **Customer storefront** – dynamic product grid with real‑time stock, category filter, contact bar (WhatsApp, call, location).
- **Profit & sales reports** – profit margin analysis, sales history, CSV export.
- **Configurable low stock alerts** – per‑product threshold, dashboard warning.
- **Full dynamic RBAC** – roles, permissions, user management (create staff, assign roles).
- **Dashboard** – total products, low stock count, today’s sales, inventory value, recent movements and sales.
- **Backup & recovery** – one‑click database download.

### 🚀 Phase 2 (Advanced)
- **Barcode / QR scanning** – camera scanner + USB keyboard support. Scan to add product to sale or search.
- **SKU & barcode fields** – every product can have a unique SKU and optional manufacturer barcode.
- **Unit conversions** – define bulk units (e.g., carton) and factor (12 pieces per carton). Stock in/out in bulk.
- **Audit logs** – track every `CREATE`, `UPDATE`, `DELETE`, `RESTORE`, `LOGIN` action with before/after data.
- **Multi‑language** – English / Swahili support (easily extendable to other languages).

### 🔮 Planned (Phase 3 & 4)
- Offline mode, advanced forecasting, e‑commerce sync, mobile app wrapper, etc.

---

## 🛠 Tech Stack

| Area               | Technologies                                                                 |
|--------------------|------------------------------------------------------------------------------|
| **Frontend**       | Astro 6, Tailwind CSS, Alpine.js, HTML5 QR Code scanner                     |
| **Backend**        | Astro server endpoints (SSR), SQLite, Drizzle ORM, Lucia auth               |
| **Real‑time**      | Server‑Sent Events (SSE) – global connection, event broadcasting            |
| **Validation**     | Zod + custom error handling                                                 |
| **Security**       | bcrypt for passwords, session cookies, permission‑based middleware          |
| **Reporting**      | CSV export, profit calculation, sales aggregation                           |
| **Deployment**     | Node.js hosting (Railway, Fly.io, DigitalOcean)                             |

---
## 📋 Requirements

Before installation, ensure you have the following:

- **Node.js** v20 or higher  
- **npm** v9 or higher  
- Git (for cloning the repository)  
- SQLite (pre‑installed or bundled with Node.js host)  
- Recommended: A modern browser (Chrome, Edge, Firefox) for testing  

---

## 📦 Installation

### 1. Clone the repository
```bash
git clone https://github.com/abbashusain619/kiosk-inventory-system.git
cd kiosk-inventory-system
```
### 2. Install dependencies
```bash
npm install
```
### 3. Set up environment variables
``` env
ADMIN_EMAIL=admin@kiosk.com
ADMIN_PASSWORD=admin123
```
### 4. Generate and run database migrations
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```
### 5. Seed the initial data (roles, permissions, default admin)
```bash
node seed-rbac.js
```
This creates:
Roles: super_admin, manager, cashier
Permissions: products.view, products.edit, sales.create, etc.
Admin user: admin@kiosk.com / admin123

### 6. (Optional) Create test users for manager and cashier
```bash
node create-test-users.js
```
This adds manager@kiosk.com (role = manager) and cashier@kiosk.com (role = cashier) with password manager123 / cashier123.

### 7. Start the development server
```bash
npm run dev
```
Open http://localhost:4321 – login with admin@kiosk.com / admin123.

### 🧪 Testing Roles
Super Admin – all permissions.

Manager – can edit products, view reports, but cannot manage users/roles.

Cashier – only process sales (quick sell and multi‑product) and view products.

Use /admin/users to create more staff and assign roles.

### 🚀 Deployment (Production)
Build the project:

```bash
npm run build
```

Deploy to a Node.js host (Railway, Fly.io, DigitalOcean).

The @astrojs/node adapter is already configured – the entry point is dist/server/entry.mjs.

Set the same environment variables on the host.

Ensure the data/ directory is writable by the server process (for SQLite).

Note: For high‑concurrency scenarios, consider switching to PostgreSQL (Drizzle supports it).

### 📁 Project Structure (Simplified)
```text
src/
├── components/        # Reusable UI (Toast, ConfirmModal, BarcodeScanner)
├── db/                # Database connection and schema (Drizzle)
├── layouts/           # BaseLayout, AdminLayout
├── lib/               # Utilities (auth, SSE, audit, i18n, errors)
├── pages/             # Astro pages (admin, customer, API endpoints)
├── services/          # Validation schemas, database service layer
├── i18n/              # Translation JSON files (en, sw)
├── middleware.ts      # Authentication, permission, language
└── env.d.ts           # TypeScript definitions
```
### 🤝 Contributing
Issues and pull requests are welcome. For major changes, please open an issue first.

### 📄 License

**Commercial License** – This software is proprietary and not open-source.  
You may not copy, modify, distribute, or sublicense this code without explicit written permission from the author.  

For licensing inquiries (single‑use, multi‑tenant, or white‑label rights), contact the repository owner.  
Unauthorized use is prohibited.

### 👥 Credits
Built by AshyPanda and his AI partner.