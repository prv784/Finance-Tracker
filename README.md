# 💰 AI Finance Tracker — Java 17 + Vite + Google Gemini

Full-stack personal finance application with **Google Gemini AI**, built with **Spring Boot 3.1 (Java 17)**, **React 18 + Vite**, and **PostgreSQL**.

---

## 📁 Project Structure

```
ft-complete/
├── backend/                          # Spring Boot 3.1 / Java 17
│   ├── src/main/java/com/financetracker/
│   │   ├── config/          # Security, Swagger, AppConfig
│   │   ├── controller/      # REST controllers (Auth, Expense, Income, Budget, Category, Dashboard, AI)
│   │   ├── dto/             # Request & Response DTOs
│   │   ├── entity/          # JPA Entities (User, Expense, Income, Category, Budget)
│   │   ├── exception/       # GlobalExceptionHandler + custom exceptions
│   │   ├── repository/      # Spring Data JPA repositories with native SQL
│   │   ├── security/        # JWT filter, UserDetailsService, JwtUtils
│   │   └── service/impl/    # AuthService, ExpenseService, IncomeService,
│   │                        # BudgetService, DashboardService, CategoryService,
│   │                        # GeminiAiService, EmailService
│   ├── src/main/resources/application.properties
│   ├── Dockerfile           # Java 17 multi-stage build
│   └── pom.xml
│
├── frontend/                         # React 18 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── api/index.js     # Axios API layer (VITE_API_URL)
│   │   ├── components/common/  Layout.jsx, Modal.jsx
│   │   ├── context/         AuthContext.jsx
│   │   └── pages/           Login, Register, VerifyOtp, ForgotPassword,
│   │                        ResetPassword, Dashboard, Expenses, Income,
│   │                        Budget, AiAssistant
│   ├── index.html           # Vite entry point
│   ├── vite.config.js       # Vite config with /api proxy
│   ├── tailwind.config.js
│   ├── Dockerfile           # Nginx multi-stage build
│   └── nginx.conf
│
├── docker/init.sql           # PostgreSQL schema + indexes + triggers
├── docker-compose.yml        # Full stack: postgres + backend + frontend
├── .env.example
└── README.md
```

---

## 🤖 AI Stack — Google Gemini

- **Model**: `gemini-2.0-flash-preview` (Google's fast multimodal model)
- **API**: REST via `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- **Auth**: API Key (`?key=YOUR_API_KEY`)
- **Get Key**: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) — **Free tier available**

### AI Features
| Feature | Description |
|---------|-------------|
| Spending Analysis | Full financial health score (A–D) + Shannon entropy diversity |
| Finance Chatbot | Context-aware chat with current month snapshot injected |
| Auto-Categorize | One-click AI category suggestion for new expenses |
| Smart Saving Tips | 5 personalised tips based on top spending categories |
| Health Score | Algorithm: Savings Rate (40%) + Diversity (30%) + Income (20%) + Ratio (10%) |

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# 1. Clone
git clone https://github.com/yourname/ft-complete.git
cd ft-complete

# 2. Configure
cp .env.example .env
# Edit .env — add GEMINI_API_KEY and Gmail credentials

# 3. Start everything
docker-compose up --build

# App running at:
# Frontend:  http://localhost:5173
# Backend:   http://localhost:8080/api
# Swagger:   http://localhost:8080/api/swagger-ui.html
```

### Option 2: Manual

#### Backend
```bash
cd backend
export GEMINI_API_KEY=your_key_here
export MAIL_USERNAME=your@gmail.com
export MAIL_PASSWORD=your_app_password
export JWT_SECRET=MinimumSixtyFourCharacterSecretKeyForJWTToken1234567890
export DB_HOST=localhost DB_NAME=finance_tracker DB_USERNAME=postgres DB_PASSWORD=postgres

mvn spring-boot:run
# Runs on http://localhost:8080/api
```

#### Frontend
```bash
cd frontend
npm install

# Edit .env.development:
# VITE_API_URL=http://localhost:8080/api

npm run dev
# Runs on http://localhost:5173
```

#### Database
```bash
psql -U postgres -c "CREATE DATABASE finance_tracker;"
psql -U postgres -d finance_tracker -f docker/init.sql
```

---

## 📡 API Endpoints

### Auth (`/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register → sends OTP email |
| POST | `/auth/verify-otp` | Verify `{ email, otp }` |
| POST | `/auth/resend-otp` | Resend OTP `{ email }` |
| POST | `/auth/login` | Login → returns JWT |
| POST | `/auth/forgot-password` | Send reset link `{ email }` |
| POST | `/auth/reset-password` | Reset `{ token, newPassword }` |

### Expenses (`/expenses`) — JWT required
| Method | Endpoint | Params |
|--------|----------|--------|
| GET | `/expenses` | `startDate`, `endDate`, `categoryId` |
| POST | `/expenses` | — |
| PUT | `/expenses/{id}` | — |
| DELETE | `/expenses/{id}` | — |

### Income (`/income`) — JWT required
| Method | Endpoint | Params |
|--------|----------|--------|
| GET | `/income` | `startDate`, `endDate` |
| POST | `/income` | — |
| PUT | `/income/{id}` | — |
| DELETE | `/income/{id}` | — |

### Budgets (`/budgets`) — JWT required
| Method | Endpoint | Params |
|--------|----------|--------|
| GET | `/budgets` | `month`, `year` |
| POST | `/budgets` | — |
| PUT | `/budgets/{id}` | — |
| DELETE | `/budgets/{id}` | — |

### Categories (`/categories`) — JWT required
| GET | `/categories` | All categories for user |
| POST | `/categories` | Create custom |
| PUT | `/categories/{id}` | Update (non-default only) |
| DELETE | `/categories/{id}` | Delete (non-default only) |

### Dashboard (`/dashboard`) — JWT required
| GET | `/dashboard` | `month`, `year` (defaults to current) |

### AI — Gemini (`/ai`) — JWT required
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai/analyze` | Full spending analysis + health score |
| POST | `/ai/chat` | `{ message }` → Gemini response |
| POST | `/ai/categorize` | `{ title, description }` → category name |
| GET | `/ai/saving-tips` | 5 personalised tips |

**Swagger UI**: `http://localhost:8080/api/swagger-ui.html`

---

## 🗄️ Database Tables

| Table | Description |
|-------|-------------|
| `users` | Accounts, JWT, OTP, reset tokens, role |
| `categories` | 15 default + custom expense/income categories |
| `expenses` | Expense records with category, payment method, recurrence |
| `income` | Income records with source type, recurrence |
| `budgets` | Monthly budgets with alert thresholds + email alerts |

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ | From [aistudio.google.com](https://aistudio.google.com/app/apikey) — free |
| `JWT_SECRET` | ✅ | 64+ character random string |
| `MAIL_USERNAME` | ✅ | Gmail address |
| `MAIL_PASSWORD` | ✅ | Gmail App Password (not real password) |
| `DB_HOST` | ✅ | PostgreSQL host (localhost or Neon hostname) |
| `DB_NAME` | ✅ | `finance_tracker` |
| `DB_USERNAME` | ✅ | PostgreSQL user |
| `DB_PASSWORD` | ✅ | PostgreSQL password |
| `FRONTEND_URL` | ⚡ | For email links (default: `http://localhost:5173`) |
| `VITE_API_URL` | ✅ | Frontend → backend URL |

**Generate JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

**Get Gmail App Password:**
1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Search "App passwords" → Mail → Other → Copy 16-char password

---

## 📧 Email Features

| Email | Trigger |
|-------|---------|
| Welcome | On registration |
| OTP Verification | After register / resend-otp |
| Password Reset | On forgot-password request |
| Budget Alert | When spending reaches alert threshold % |
| Monthly Summary | Scheduled (extend `BudgetServiceImpl`) |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.1, Java 17 |
| Security | Spring Security, JWT (jjwt 0.11.5), BCrypt |
| Database | PostgreSQL 16, Spring Data JPA, Hibernate |
| Email | Spring Mail (Gmail SMTP) |
| AI | Google Gemini 2.0 Flash Preview (REST API) |
| API Docs | SpringDoc OpenAPI 3 / Swagger UI |
| Frontend | React 18, Vite 5 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts (Area, Bar, Pie, Radar) |
| HTTP | Axios |
| Docker | Docker + Docker Compose + Nginx |

---

## 🧠 Algorithm Details

### Financial Health Score (0–100)
```
Component 1 — Savings Rate (40 pts):
  savingsRate = (income - expenses) / income
  ≥30% → 40 | 20-30% → 30 | 10-20% → 20 | <10% → 10 | negative → 0

Component 2 — Expense Diversity (30 pts):
  Shannon Entropy H = -Σ(pᵢ × log₂(pᵢ)) per category
  normalised = H / log₂(numCategories)
  score = normalised × 30

Component 3 — Has Income (20 pts):
  Income recorded this period → +20

Component 4 — Expense Ratio < 70% (10 pts):
  expenses/income < 0.70 → +10

Grade: A(80-100), B(60-79), C(40-59), D(<40)
```

### Dashboard Monthly Trend
```
For each month 1–12:
  income[m]   = SUM(income WHERE month = m AND year = y)
  expenses[m] = SUM(expenses WHERE month = m AND year = y)
  savings[m]  = income[m] - expenses[m]
  (missing months → 0, ensures 12 data points for charts)
```

---

## 🌐 Free Deployment

| Service | Use for | Cost |
|---------|---------|------|
| [Neon](https://neon.tech) | PostgreSQL DB | Free (0.5 GB) |
| [Render](https://render.com) | Spring Boot backend | Free (sleeps after 15 min) |
| [Netlify](https://netlify.com) | React frontend | Free forever |

```bash
# Production deploy (Docker)
export GEMINI_API_KEY=AIza...
export MAIL_USERNAME=you@gmail.com
export MAIL_PASSWORD=xxxx_xxxx_xxxx_xxxx
export JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('base64'))")
export FRONTEND_URL=https://your-app.netlify.app
docker-compose up -d --build
```

---

## ✅ Features Checklist

- [x] Register / Login with JWT
- [x] Email OTP verification (6-digit, 10-min expiry)
- [x] Forgot / Reset password via email link
- [x] Add / Edit / Delete Expenses with AI auto-categorize
- [x] Add / Edit / Delete Income
- [x] Category management (15 defaults + custom)
- [x] Date + category filters on expenses
- [x] Dashboard: Area chart, Bar chart, Pie chart
- [x] Budget management with progress bars
- [x] Budget alerts via email (threshold %)
- [x] Google Gemini AI spending analysis
- [x] AI health score (A–D grade + radar chart)
- [x] Gemini AI finance chatbot
- [x] AI auto-categorize expense by title
- [x] Smart saving tips (personalised)
- [x] Responsive UI (mobile + desktop)
- [x] Swagger API docs
- [x] Docker + Docker Compose deployment
- [x] PostgreSQL schema with indexes + triggers

---

*Built with Spring Boot 3.1 (Java 17) + React 18 + Vite + Google Gemini AI*
