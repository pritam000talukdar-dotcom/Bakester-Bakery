# 🎂 Bakester Bakery — Technical Overview

A full-stack e-commerce web application for an artisanal bakery, built with React and Supabase.

---

## 1. Problem We Solve

Modern bakeries often rely on social media DMs, phone calls, or outdated websites to take orders.
Bakester Bakery replaces that friction with:

| Pain Point | Our Solution |
|---|---|
| No online ordering | Fully interactive product catalogue with cart & checkout |
| No order tracking | Real-time order history with live status badges |
| Manual inventory management | Admin dashboard with stock & pricing controls |
| No account system | Secure email/password auth with profile management |
| Specialty cake requests | Dedicated Speciality Cakes page with custom enquiry form |

---

## 2. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend framework** | React 18 (Vite) | Fast HMR dev experience, lean production bundle |
| **Routing** | React Router v6 | Declarative nested routes, protected route wrappers |
| **Styling** | Tailwind CSS v3 | Utility-first rapid styling, design tokens via config |
| **Animations** | Framer Motion | Smooth page transitions, micro-interactions |
| **Icons** | React Icons (Feather) | Consistent lightweight icon set |
| **Backend / DB** | Supabase (PostgreSQL) | Auth + database + real-time in one hosted service |
| **Deployment** | Netlify | Git-triggered deploys, edge CDN, environment vars |

---

## 3. Architecture

```
src/
├── App.jsx                  # Root — BrowserRouter, providers, route map
├── main.jsx                 # Entry point (ReactDOM.createRoot)
├── index.css                # Global styles, Tailwind base/components
│
├── context/
│   ├── AuthContext.jsx      # Session management, profile fetch, sign-in/out
│   └── CartContext.jsx      # Client-side cart state (add, remove, update qty)
│
├── lib/
│   └── supabase.js          # Supabase client singleton with auth config
│
├── components/
│   ├── auth/
│   │   ├── AuthModal.jsx    # Sign-in / Sign-up modal (tabs, validation)
│   │   └── ProtectedRoute.jsx  # Auth & admin guards for private routes
│   ├── layout/
│   │   ├── Navbar.jsx       # Responsive top navigation
│   │   └── Footer.jsx       # Site-wide footer
│   ├── sections/            # Reusable page sections (hero, feature cards…)
│   └── ui/
│       └── AnimatedSection.jsx  # Scroll-triggered fade-in wrapper
│
└── pages/
    ├── Home.jsx             # Landing page
    ├── Products.jsx         # Product catalogue with filters
    ├── SpecialityCakes.jsx  # Custom cake enquiry
    ├── Cart.jsx             # Cart review & checkout flow
    ├── Orders.jsx           # Full order history
    ├── Profile.jsx          # User profile, recent orders, settings
    ├── About.jsx            # Brand story
    ├── Contact.jsx          # Contact form
    └── admin/
        └── AdminDashboard.jsx  # Inventory & order management (admin only)
```

---

## 4. How Authentication Works

### Flow

```
Page load
  │
  ├─► supabase.auth.getSession()  ← reads localStorage (instant, no network)
  │     └─► if session exists → fetchProfile(userId) → setLoading(false)
  │
  └─► supabase.auth.onAuthStateChange()  ← subscribes to future events
        SIGNED_IN  → fetchProfile (only if different userId)
        SIGNED_OUT → clear user / profile / isAdmin
        TOKEN_REFRESHED → no-op (userId unchanged, profile already cached)
```

### Key optimisation (v2)

The previous implementation called `fetchProfile` twice on every page load:
once inside `getSession().then(...)` and again when `onAuthStateChange` fired
a `SIGNED_IN` event immediately after. A `useRef` (`lastFetchedUserId`) now
tracks which user was last fetched so the second call is a no-op — **cutting
one full DB round-trip on every page load**.

### Role-based access

```
profiles.is_admin = true  →  AdminRoute passes through to AdminDashboard
profiles.is_admin = false →  403 Forbidden screen
(not logged in)           →  Sign-in prompt / redirect
```

---

## 5. Database Schema (Supabase / PostgreSQL)

### `profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | References `auth.users.id` |
| `full_name` | text | |
| `phone` | text | |
| `address` | text | |
| `is_admin` | boolean | Default `false` |
| `updated_at` | timestamptz | Auto-updated on save |

Row-Level Security (RLS) is enabled: users can only read/write their own row.
Admins have an additional policy allowing full table access.

### `products`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `name` | text | |
| `description` | text | |
| `price` | numeric | |
| `category` | text | e.g. `cakes`, `cookies`, `breads` |
| `image_url` | text | Supabase Storage URL |
| `stock_quantity` | integer | Managed from Admin Dashboard |
| `is_featured` | boolean | Shown in homepage hero carousel |

### `orders`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK → profiles) | |
| `order_number` | text | Human-readable e.g. `#BK-00142` |
| `status` | text | `Processing`, `Shipped`, `Delivered`, `Cancelled` |
| `total` | numeric | |
| `items` | jsonb | Snapshot of cart items at time of order |
| `created_at` | timestamptz | |

---

## 6. Cart System

The cart is **client-side only** (React Context + `localStorage`), keeping it
instant with no network dependency.

```
CartContext
  ├── items[]          { product, quantity }
  ├── addItem(product) — adds or increments
  ├── removeItem(id)   — removes by product id
  ├── updateQty(id, n) — sets exact quantity
  ├── clearCart()      — empties cart
  └── total            — computed price sum
```

On checkout, the cart snapshot is written to the `orders` table in Supabase
and the cart is cleared locally.

---

## 7. Admin Dashboard

Accessible only to users where `profiles.is_admin = true`.

Features:
- **Product management** — add, edit, delete products; update stock quantity & price
- **Order management** — view all orders, update order status
- **Low-stock alerts** — highlights products with `stock_quantity < 5`

---

## 8. Performance Decisions

| Decision | Impact |
|---|---|
| `getSession()` reads localStorage (synchronous) | Auth state is known in < 1 ms, no spinner on repeat visits |
| `fetchProfile` deduped with `useRef` | Saves 1 DB query per page load |
| Profile SELECT only needed columns | Smaller payload (5 cols vs `*`) |
| Orders SELECT only needed columns | Smaller payload (5 cols vs `*`) |
| `ordersLoading` starts `false` | No skeleton flash if user is not logged in |
| Orders fetch uses `user?.id` dependency | Runs exactly once per user, cleans up on unmount |
| Supabase `persistSession: true` + localStorage | JWT is reused; no re-login on refresh |
| Vite dev server with HMR | < 50 ms hot-reload in development |
| Netlify edge CDN | Static assets served from the nearest PoP globally |

---

## 9. Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> ⚠️ Never commit your `.env` file. It is listed in `.gitignore`.

---

## 10. Running the Project

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 11. Deployment (Netlify)

The `netlify.toml` file configures:
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Redirect rule**: `/* → /index.html` (SPA fallback for React Router)

Push to `main` branch → Netlify auto-builds and deploys.

---

*Last updated: June 2026*
