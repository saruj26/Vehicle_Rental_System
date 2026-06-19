# 🚗 RentWheels — Vehicle Rental Marketplace (MERN)

A production-ready, mobile-first vehicle rental marketplace built with the **MERN** stack.
Three roles (**Admin**, **Vehicle Owner**, **Customer**), a single login/register page with
role selection, a full booking engine, dynamic posting fees, an approval workflow, reviews,
wishlists, in-app notifications, dashboards with charts, and a modern glassmorphism UI with
light/dark mode.

> Built end-to-end and verified: the API boots against MongoDB, seeds demo data, and the React
> client builds cleanly. See [Verification](#-verification).

---

## ✨ Features

### Roles & Auth
- Single **login/register** page, role chosen at signup (`customer` / `owner`; admins are seeded/promoted).
- **JWT** access tokens (in-memory) + **httpOnly refresh cookie** with transparent silent refresh.
- Role-based authorization, protected routes, rate limiting, password hashing (bcrypt), Helmet, HPP, mongo-sanitize.

### Admin
- Dashboard (users, vehicles, bookings, revenue, pending approvals) with **Recharts** charts & reports.
- Manage users (ban/verify/role/delete), **dynamic posting fees per category**, categories, features, promo codes.
- Approve / reject vehicle listings, feature listings, moderate reviews, edit platform settings (service fee %, tax %, etc.).

### Vehicle Owner
- Add / edit / delete vehicles, multi-image upload (1–20, Cloudinary), reorder & set cover.
- **Posting-fee gate**: pay the category fee → submit for approval → admin publishes.
- Manage bookings (accept / reject / start / complete), view earnings & per-vehicle analytics.

### Customer
- Search & filter (brand, model, category, fuel, transmission, price, year, rating) + **visual seat-capacity filter**.
- Live availability calendar data, price quote (days × rate + service fee + tax − promo), booking flow.
- Wishlist/favorites, reviews & ratings, in-app notifications, **WhatsApp direct booking**.

### Marketplace extras
Dynamic pricing (weekend surge), promo codes, owner verification badges, featured ads, nearby search
(geo), AI-style recommendations, **vehicle compare**, multi-image gallery with zoom, condition score
(x/100), fuel-efficiency display, recently-viewed, trending/top-rated/recently-added home sections.

---

## 🧱 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite, React Router v6, Tailwind CSS, Lucide icons, React Hook Form + Zod, Recharts, Axios, react-hot-toast |
| Backend | Node.js + Express, Mongoose, JWT, Multer + Cloudinary, Zod, Helmet, rate-limit |
| Database | MongoDB |

State is managed with **Context API** (Auth, Theme, Wishlist) — no Redux needed.

---

## 📁 Project Structure

```
Order_Booking/
├── backend/
│   ├── src/
│   │   ├── config/        env, db, cloudinary
│   │   ├── models/        12 Mongoose schemas
│   │   ├── middleware/    auth, roles, validate, error, rateLimit
│   │   ├── controllers/   auth, user, category, feature, fee, vehicle,
│   │   │                  booking, review, wishlist, notification, promo, dashboard
│   │   ├── routes/        per-domain routers + index
│   │   ├── validators/    Zod schemas
│   │   ├── utils/         tokens, ApiError, helpers, notify, seed
│   │   ├── app.js         express app (security middleware)
│   │   └── server.js      entrypoint
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    ui, layout (Navbar/Footer/DashboardShell), vehicle (Card/SeatFilter)
│   │   ├── context/       Auth, Theme, Wishlist
│   │   ├── hooks/         useFetch
│   │   ├── lib/           api (axios + refresh), utils
│   │   ├── pages/         public + customer/ owner/ admin/
│   │   ├── App.jsx        routes
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── API.md                 full REST API reference
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB (local, Atlas, or Docker)

### 1. MongoDB (Docker option)
```bash
docker run -d --name rental-mongo -p 27017:27017 mongo:7
```
> A `rental-mongo` container may already be running from setup. Use Atlas instead by setting `MONGO_URI`.

### 2. Backend
```bash
cd backend
cp .env.example .env          # then edit values (a .env with generated JWT secrets may already exist)
npm install
npm run seed                  # creates admin + demo owner/customer + 15 categories + sample vehicles
npm run dev                   # http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env          # VITE_API_URL=/api (uses Vite proxy to :5000)
npm install
npm run dev                   # http://localhost:5173
```

> The frontend uses `legacy-peer-deps` is **not** required; the backend includes an `.npmrc`
> with `legacy-peer-deps=true` to satisfy `multer-storage-cloudinary`'s peer range.

### Demo accounts (after `npm run seed`)
| Role | Email | Password |
|---|---|---|
| Admin | `admin@rental.com` | `Admin@12345` |
| Owner | `owner@rental.com` | `Owner@12345` |
| Customer | `customer@rental.com` | `Customer@12345` |

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
| Key | Description |
|---|---|
| `PORT` | API port (default 5000) |
| `CLIENT_URL` | Allowed CORS origin(s), comma-separated |
| `MONGO_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | JWT signing secrets (≥32 chars) |
| `JWT_ACCESS_EXPIRES` / `JWT_REFRESH_EXPIRES` | Token lifetimes (e.g. `15m`, `7d`) |
| `CLOUDINARY_*` | Cloud name / key / secret. **Optional** — without them uploads fall back to placeholders so the app still runs. |
| `ADMIN_*` | Seed admin credentials |

### Frontend (`frontend/.env`)
| Key | Description |
|---|---|
| `VITE_API_URL` | API base. Leave `/api` to use the dev proxy. |

---

## 🖼️ Image Uploads
Set the three `CLOUDINARY_*` vars to enable real uploads (Multer → Cloudinary, max 20 images @ 8MB).
Without keys the server boots fine and image endpoints return placeholder URLs — handy for local dev.

## 💳 Payments
Payment structure is gateway-agnostic and **payment-ready**: the `Payment` model + posting-fee and
booking flows record `provider`, `providerRef`, `status`, `platformShare`, `ownerShare`. Drop in
Stripe/PayPal/Razorpay by flipping `status` to `succeeded` on the webhook. Current flow uses
`provider: 'manual'` and marks success immediately.

---

## ✅ Verification
This project was verified during build:
- ✅ Backend boots, connects to MongoDB, seeds 15 categories + fees + features + 6 sample vehicles.
- ✅ Frontend `npm run build` — 2290 modules transformed, no errors.
- ✅ Smoke-tested live: login → JWT, price quote (math validated), booking creation, RBAC (403 for
  customer on admin routes), wishlist toggle, admin dashboard aggregations.

---

## 📚 API
See **[API.md](./API.md)** for the full endpoint reference (auth, vehicles, bookings, admin, etc.).

## 📝 License
MIT — built as a reference MERN marketplace.
