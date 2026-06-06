# 🔗 URL Shortener App

A full-stack URL shortener with a modern React frontend and a production-ready Node.js REST API. Features include analytics, authentication, Redis caching, rate limiting, and Swagger documentation.

---

## 📸 Preview

| Landing Page | Dashboard | Analytics |
|---|---|---|
| Paste a URL, give it a name, share instantly | Manage all your links in one place | Deep click analytics per link |

---

## 🚀 Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express.js |
| Database | PostgreSQL via **Prisma ORM** |
| Cache | Redis via **ioredis** |
| Auth | JWT (access 15m + refresh 7d) |
| Validation | Zod |
| API Docs | Swagger UI |
| Testing | Jest + Supertest |
| Logging | Winston + Morgan |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Routing | React Router v6 |
| Data Fetching | TanStack Query v5 |
| HTTP Client | Axios |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React |
| Notifications | React Hot Toast |

---

## ✨ Features

### URL Management
- ✅ Shorten any URL — auto-generate or custom slug
- ✅ Popup name input for clean, memorable links
- ✅ Set expiry date and password protection
- ✅ Soft delete (data preserved, never hard-deleted)
- ✅ Full audit trail — `createdBy`, `updatedBy`, `deletedBy` on every record

### Analytics
- ✅ Total clicks & unique visitors
- ✅ Clicks over time (7d / 30d / 90d chart)
- ✅ Breakdown by device, browser, OS, country
- ✅ Top referrers

### Authentication
- ✅ Register / Login with bcrypt-hashed passwords
- ✅ JWT access token (15m) + refresh token (7d)
- ✅ Silent token refresh on 401
- ✅ Soft-delete logout (refresh token revoked, not hard-deleted)

### Performance & Security
- ✅ Redis cache-aside for redirects (1-hour TTL)
- ✅ Custom Redis rate limiter (global 100/15min, create 5–50/hour)
- ✅ Helmet.js security headers
- ✅ CORS whitelist from env
- ✅ URL sanitization (blocks localhost, private IPs, malformed URLs)
- ✅ IP geolocation via ip-api.com (no API key needed)

---

## 📁 Project Structure

```
url-shortener-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema with audit fields
│   │   └── migrations/
│   ├── src/
│   │   ├── config/               # Prisma, Redis, Swagger clients
│   │   ├── middlewares/          # Auth, rate limiter, validation, error handler
│   │   ├── modules/
│   │   │   ├── auth/             # Register, login, refresh, logout
│   │   │   ├── url/              # CRUD endpoints
│   │   │   ├── redirect/         # Slug → redirect with click tracking
│   │   │   └── analytics/        # Click aggregation queries
│   │   ├── utils/                # Slug generator, URL validator, GeoIP, logger
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/                    # Jest + Supertest (30 tests)
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/           # Layout, Sidebar, Topbar, modals, cards
    │   ├── pages/                # Landing, Login, Register, Dashboard, Analytics
    │   ├── contexts/             # AuthContext, ThemeContext
    │   ├── services/             # Axios API wrappers
    │   └── hooks/                # useAuth, useClipboard
    └── .env.example
```

---

## 🗄️ Database Schema

All tables include full **audit fields**:

```
createdAt  DateTime   — auto timestamp on insert
createdBy  String?    — email/name of creator
updatedAt  DateTime   — auto timestamp on update
updatedBy  String?    — email/name of last modifier
deletedAt  DateTime?  — null = active; set = soft-deleted
deletedBy  String?    — email/name who deleted
```

Tables: `User`, `RefreshToken`, `Url`, `Click`

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Redis 6+

### 1. Clone the repo

```bash
git clone https://github.com/adianali/url-shortener-app.git
cd url-shortener-app
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — fill in DATABASE_URL, REDIS_URL, JWT secrets
npm run db:migrate    # Run Prisma migrations
npm run dev           # Dev server on http://localhost:3000
```

### 3. Setup Frontend

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:3000
npm run dev           # Dev server on http://localhost:5174
```

### 4. Run Tests

```bash
cd backend
npm test              # 30 tests — all should pass
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

```env
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

DATABASE_URL=postgresql://user:password@localhost:5432/urlshortener

REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=your_strong_random_secret_here
JWT_REFRESH_SECRET=your_other_strong_random_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

GEOIP_API_URL=http://ip-api.com/json

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register new account |
| POST | `/api/auth/login` | — | Login, returns tokens |
| POST | `/api/auth/refresh` | — | Refresh access token |
| POST | `/api/auth/logout` | — | Revoke refresh token |

### URLs
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/urls` | Optional | Create short URL |
| GET | `/api/urls` | Required | List user's URLs |
| GET | `/api/urls/:id` | Required | Get URL detail |
| PATCH | `/api/urls/:id` | Required | Update URL |
| DELETE | `/api/urls/:id` | Required | Soft delete URL |

### Analytics
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/urls/:id/analytics` | Required | Full analytics breakdown |
| GET | `/api/urls/:id/analytics/clicks` | Required | Click time series |
| GET | `/api/urls/:id/analytics/summary` | Required | Summary stats |
| GET | `/api/dashboard` | Required | Account-wide stats |

### Redirect
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/:slug` | — | Redirect to original URL |
| POST | `/:slug/verify` | — | Verify password-protected URL |

**Swagger UI** available at `http://localhost:3000/docs`

---

## 🧪 Test Coverage

```
✅ auth.test.js        — Register, login, validation
✅ url.test.js         — Create, list, CRUD, auth guard
✅ redirect.test.js    — Redirect, expired, password protect
✅ analytics.test.js   — Analytics endpoints
✅ rateLimiter.test.js — 429 rate limit enforcement

30 tests passed, 0 failed
```

---

## 🚢 Deploy to Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add **PostgreSQL** and **Redis** plugins
4. Set environment variables (Railway auto-injects `DATABASE_URL` and `REDIS_URL`)
5. Set start command: `cd backend && npm start`
6. Done — Railway auto-deploys on every push to `main`

---

## 📄 License

MIT © [Adianali](https://github.com/adianali)
