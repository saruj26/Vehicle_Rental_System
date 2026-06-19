# 📚 RentWheels API Reference

Base URL: `http://localhost:5000/api`

### Conventions
- **Response envelope:** `{ "success": true, "message": "...", "data": { ... }, "meta": { total, page, limit, pages } }`
- **Errors:** `{ "success": false, "message": "...", "details": [...] }` with appropriate HTTP status (400/401/403/404/409/500).
- **Auth:** send `Authorization: Bearer <accessToken>`. Refresh token is set as an httpOnly cookie by `/auth/login|register` and rotated by `/auth/refresh`.
- **Pagination:** `?page=1&limit=12` on list endpoints.
- **Roles:** 🟢 public · 🔵 any authenticated · 🟠 owner · 🔴 admin · 🟣 customer

---

## Auth `/auth`
| Method | Path | Access | Body / Notes |
|---|---|---|---|
| POST | `/register` | 🟢 | `{ name, email, password, role: 'owner'\|'customer', phone?, whatsapp? }` |
| POST | `/login` | 🟢 | `{ email, password }` → `{ user, accessToken }` |
| POST | `/refresh` | 🟢(cookie) | rotates tokens → `{ accessToken, user }` |
| POST | `/logout` | 🟢 | clears refresh cookie |
| GET | `/me` | 🔵 | current user |

## Users `/users`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/me/profile` | 🔵 | |
| PATCH | `/me/profile` | 🔵 | JSON `{name,phone,whatsapp,location,bio}` or multipart `avatar` |
| PATCH | `/me/password` | 🔵 | `{ currentPassword, newPassword }` |
| GET | `/owners/featured` | 🟢 | top verified owners |
| GET | `/owners/:id` | 🟢 | public owner profile + listings |

## Catalog (public) 
| Method | Path | Notes |
|---|---|---|
| GET | `/categories` | `?all=true` to include inactive; each includes `postingFee` |
| GET | `/categories/:idOrSlug` | single + fee |
| GET | `/features` | active features |
| GET | `/fees` | all category fees |
| GET | `/fees/category/:categoryId` | fee for one category |

## Vehicles `/vehicles`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/` | 🟢 | catalog. Filters: `q, category, brand, fuelType, transmission, condition, location, seats (e.g. 7 or 20+), minPrice, maxPrice, year, minYear, minRating, featured`; `sort=newest\|price_asc\|price_desc\|rating\|popular\|trending` |
| GET | `/home` | 🟢 | `{ trending, recent, topRated, featured }` |
| GET | `/nearby` | 🟢 | `?lat=&lng=&radius=km` |
| GET | `/meta/brands` | 🟢 | distinct brands |
| GET | `/recommendations` | 🟢/🔵 | personalised if logged in |
| POST | `/compare` | 🟢 | `{ ids: [2..4] }` |
| POST | `/recently-viewed` | 🟢 | `{ ids: [] }` resolves client-stored ids |
| GET | `/owner/mine` | 🟠 | owner's listings (`?status=`) |
| POST | `/` | 🟠 | create draft → `{ vehicle, postingFee }` |
| GET | `/:vehicleId/reviews` | 🟢 | |
| POST | `/:vehicleId/reviews` | 🟣 | `{ rating, comment }` (must have a completed booking) |
| GET | `/:id/availability` | 🟢 | booked/blocked date ranges |
| GET | `/:id/similar` | 🟢 | |
| GET | `/:id/analytics` | 🟠 | views, bookings, revenue, conversion |
| POST | `/:id/images` | 🟠 | multipart `images[]` (≤20) |
| PATCH | `/:id/images` | 🟠 | `{ order:[{publicId,order}], coverPublicId, deletePublicIds:[] }` |
| POST | `/:id/pay-fee` | 🟠 | `{ provider }` → marks `feePaid` |
| POST | `/:id/submit` | 🟠 | draft → pending (needs fee + ≥1 image) |
| PATCH | `/:id` | 🟠 | update (live listing reverts to pending) |
| DELETE | `/:id` | 🟠 | blocked if active bookings |
| GET | `/:idOrSlug` | 🟢 | detail (increments views) |

### Vehicle create/update body
```
name, brand, model, year, category(id), fuelType(petrol|diesel|electric|hybrid|cng|lpg),
transmission(manual|automatic), seatCapacity, location, pricePerDay        // required
color?, engineCapacity?, mileage?, fuelEfficiency?, condition?, conditionScore?,
description?, pricePerWeek?, pricePerMonth?, securityDeposit?, availability?,
dynamicPricing?{enabled,weekendSurgePct,peakSurgePct}, ownerContact?, whatsapp?,
registrationNumber?, insuranceStatus?, features?[ids], geo?{coordinates:[lng,lat]}
```

## Bookings `/bookings`
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/quote` | 🟢 | `{ vehicleId, pickupDate, returnDate, promoCode? }` → price breakdown |
| POST | `/` | 🟣 | create booking (availability-checked) |
| GET | `/mine` | 🟣 | customer bookings (`?status=`) |
| GET | `/owner` | 🟠 | bookings for owner's vehicles |
| GET | `/:id` | 🔵 | participants/admin only |
| PATCH | `/:id/accept` | 🟠 | pending → accepted |
| PATCH | `/:id/reject` | 🟠 | `{ reason }` |
| PATCH | `/:id/cancel` | 🟣🟠 | pending/accepted → cancelled |
| PATCH | `/:id/start` | 🟠 | accepted → active |
| PATCH | `/:id/complete` | 🟠 | → completed (records payment + earnings) |

**Quote/breakdown:** `totalDays, pricePerDay, rentalAmount, serviceFee, tax, securityDeposit, discount, totalAmount, currency`.

## Reviews `/reviews`
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/:id/reply` | 🟠 | `{ text }` owner reply |
| DELETE | `/:id` | 🔵 | author or admin |

## Wishlist `/wishlist`
| Method | Path | Access |
|---|---|---|
| GET | `/` | 🔵 |
| GET | `/ids` | 🔵 |
| POST | `/:vehicleId` | 🔵 (toggle) |
| DELETE | `/:vehicleId` | 🔵 |

## Notifications `/notifications`
| Method | Path | Access |
|---|---|---|
| GET | `/` | 🔵 (`?unread=true`) |
| GET | `/unread-count` | 🔵 |
| PATCH | `/read-all` | 🔵 |
| PATCH | `/:id/read` | 🔵 |
| DELETE | `/:id` | 🔵 |

## Misc
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/promos/validate` | 🟢/🔵 | `{ code, amount }` → discount |
| GET | `/owner/dashboard` | 🟠 | stats, charts, recent bookings, top vehicles |

## Admin `/admin` (🔴 all)
| Method | Path | Notes |
|---|---|---|
| GET | `/dashboard` | stats + charts + recent activity |
| GET | `/reports` | `?type=revenue\|bookings\|vehicles&months=12` |
| GET / PATCH | `/settings` | platform settings |
| GET | `/users` | `?role=&status=&q=&page=` |
| PATCH / DELETE | `/users/:id` | status/role/verify · delete |
| POST | `/categories` | `{ name, icon, description, sortOrder, postingFee }` |
| PATCH / DELETE | `/categories/:id` | |
| POST | `/features` · PATCH/DELETE `/features/:id` | |
| PUT | `/fees/:categoryId` | `{ amount, currency, isActive }` — **dynamic fee** |
| GET | `/vehicles` | `?status=&q=` |
| POST | `/vehicles/:id/approve` | publish |
| POST | `/vehicles/:id/reject` | `{ reason }` |
| PATCH | `/vehicles/:id/feature` | `{ isFeatured, days }` |
| GET | `/bookings` | all bookings |
| GET | `/reviews` · PATCH `/reviews/:id` | moderation `{ status }` |
| GET/POST | `/promos` · PATCH/DELETE `/promos/:id` | promo codes |

---

## Data Models (summary)
`User` (roles, verification, earnings, rating) · `Category` (slug, icon, vehicleCount) ·
`Feature` · `Fee` (per-category, dynamic) · `Vehicle` (specs, pricing tiers, dynamic pricing, geo,
images, workflow status, fee gate, stats) · `Booking` (date range, price snapshot, status machine,
payment) · `Payment` (gateway-agnostic, posting_fee | booking) · `Review` (rating, owner reply,
moderation) · `Notification` · `Wishlist` · `PromoCode` (percent/flat, limits, expiry) ·
`Settings` (singleton: service fee %, tax %, default fee, etc.).

### Vehicle workflow
`draft → (pay fee + submit) → pending → approved/published → booked → completed` · or `rejected`.

### Booking status machine
`pending → accepted → active → completed` · or `rejected` / `cancelled`.
