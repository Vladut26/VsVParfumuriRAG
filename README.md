# ✦ VsV Parfumuri — AI-Powered E-Commerce Platform

A full-stack luxury e-commerce platform for perfumes and cosmetics, featuring an **AI conversational assistant** (RAG + Google Gemini) and **automated sentiment analysis** (RoBERTa via HuggingFace) of customer reviews.

Built as a Master's thesis project demonstrating the integration of artificial intelligence at every level of the online shopping experience.

![Java](https://img.shields.io/badge/Java-24-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.6-6DB33F?logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)

---

## Architecture

```
React 18 / TypeScript          Spring Boot 4 / Java 24         Python FastAPI
     (port 5173)        ──→         (port 8080)          ──→     (port 8000)
                                        │                        ↙         ↘
                                   PostgreSQL 16          HuggingFace    Google Gemini
                                    (port 5432)           (sentiment)     (chatbot)
```

| Layer | Tech | Role |
|-------|------|------|
| **Frontend** | React 18, TypeScript, Vite 5, Tailwind v4, DaisyUI v5, Zustand | SPA with luxury UI, dark mode, page transitions |
| **Backend** | Spring Boot 4.0.6, Java 24, Spring Security 7, JPA/Hibernate 7 | REST API, JWT auth, Stripe payments, email |
| **AI Service** | Python, FastAPI, Uvicorn, httpx | RAG chatbot, sentiment analysis |
| **Database** | PostgreSQL 16, HikariCP | 7 tables, referential integrity |
| **Payments** | Stripe Elements + Webhooks | PCI-DSS compliant card processing |
| **Images** | Cloudinary | Drag-and-drop upload, auto-optimization (WebP/AVIF) |

---

## Features

### AI Features
- **Conversational Chatbot** — RAG pipeline with Google Gemini. Understands natural language queries like "vreau un parfum floral sub 500 RON". Returns product cards with add-to-cart buttons.
- **Smart Catalog Filtering** — 30+ bilingual scent synonyms, price regex, brand detection, weighted scoring (85% token reduction).
- **Dual-Model Failover** — Gemini 2.5 Flash (primary) → Gemini 3.1 Flash Lite (fallback), 3-attempt retry.
- **Sentiment Analysis** — Multilingual RoBERTa (125M params) via HuggingFace Inference API. Classifies reviews as positive/negative/mixed with confidence scores and Romanian summaries.
- **Sentiment Visualization** — Color-coded badges per review + aggregate distribution bar on product pages.

### E-Commerce Features
- **Product Catalog** — Category filtering, search with autocomplete, image carousel with hover crossfade, "Nou" badge for recent products.
- **Cart & Checkout** — 3-step checkout (delivery → payment → confirmation), preventive stock verification, Stripe Elements with 3D Secure.
- **Order Management** — Full lifecycle (PENDING → CONFIRMED → SHIPPED → DELIVERED), cancellation with automatic stock restoration.
- **Favorites** — Batch-loaded wishlist with toggle from any page.
- **Email Confirmation** — Async HTML email with order details (optional, configurable).
- **Admin Dashboard** — KPI cards, revenue chart, top products, sentiment distribution, order management, user role management.

### UI/UX Features
- **Luxury Design System** — Gold/noir/cream design tokens, glassmorphism header, serif typography.
- **Dark Mode** — Full theme toggle with localStorage persistence.
- **Page Transitions** — CSS fade + slide animations between routes.
- **Skeleton Loading** — 8-card animated placeholder grid while products load.
- **Responsive** — Mobile-first (375px) to desktop.
- **Toast Notifications** — Slide-in from right with auto-dismiss.
- **Confirmation Modals** — Luxury modals replace all browser `confirm()` dialogs.
- **Back to Top** — Floating button after 600px scroll.
- **Breadcrumbs** — Navigation trail on product detail pages.
- **Related Products** — "You might also like" section from same category.

---

## Prerequisites

- **Java 24** (or 21 LTS)
- **Node.js 20+**
- **Python 3.11+**
- **PostgreSQL 16+**
- **API Keys:**
  - [Google Gemini](https://ai.google.dev/) — free tier
  - [HuggingFace](https://huggingface.co/settings/tokens) — free tier
  - [Stripe](https://dashboard.stripe.com/test/apikeys) — test mode
  - [Cloudinary](https://cloudinary.com/) — free tier (optional, for image uploads)

---

## Quick Start

### 1. Database

```sql
-- In psql as superuser:
CREATE USER vsv_user WITH PASSWORD 'your_password';
CREATE DATABASE vsv_db OWNER vsv_user;
GRANT ALL PRIVILEGES ON DATABASE vsv_db TO vsv_user;
```

### 2. Backend (Spring Boot)

```bash
cd server

# Configure
cp src/main/resources/application.properties.example src/main/resources/application.properties
# Edit: database credentials, JWT secret, Stripe keys

# Run
./mvnw spring-boot:run
# → http://localhost:8080
```

### 3. AI Service (Python)

```bash
cd vsv-ai-service

python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

pip install -r requirements.txt

# Configure
cp .env.example .env
# Edit: GEMINI_API_KEY, HF_API_KEY

uvicorn main:app --reload --port 8000
# → http://localhost:8000/health
```

### 4. Frontend (React)

```bash
cd client

npm install

# Configure
cp .env.example .env.local
# Edit: VITE_STRIPE_PUBLISHABLE_KEY, VITE_CLOUDINARY_CLOUD (optional)

npm run dev
# → http://localhost:5173
```

### 5. Seed Data

```bash
cd server
node perfumesSeed.js     # ~30 perfume products
node categorySeed.js     # ~42 products across all categories
node setup_admin.js      # Create admin account
```

Then promote admin in PostgreSQL:
```sql
UPDATE users SET role='ADMIN' WHERE email='your-admin@email.com';
```

### 6. Test Payment

Use Stripe test card: `4242 4242 4242 4242`, expiry `12/34`, CVC `123`.

---

## Project Structure

```
vsv-parfumuri/
├── server/                        # Spring Boot backend
│   ├── src/main/java/com/vsv/
│   │   ├── config/                # SecurityConfig
│   │   ├── controller/            # 8 REST controllers
│   │   ├── dto/                   # Data transfer objects
│   │   ├── entity/                # 7 JPA entities
│   │   ├── repository/            # 7 JPA repositories
│   │   ├── security/              # JWT filter, utilities
│   │   └── service/               # 7 business services
│   ├── perfumesSeed.js            # Seed script
│   ├── categorySeed.js            # Seed script
│   └── pom.xml
│
├── client/                        # React frontend
│   ├── src/
│   │   ├── components/            # 12 reusable components
│   │   ├── pages/                 # 13 page components
│   │   ├── stores/                # 7 Zustand stores
│   │   ├── services/              # APIService, Cloudinary
│   │   ├── hooks/                 # useConfirm
│   │   └── assets/                # CSS with design tokens
│   └── package.json
│
├── vsv-ai-service/                # Python AI microservice
│   ├── config.py                  # Env vars, Pydantic schemas
│   ├── sentiment_service.py       # HuggingFace RoBERTa integration
│   ├── filtering.py               # Intent extraction, product scoring
│   ├── gemini_service.py          # RAG pipeline, Gemini API
│   ├── main.py                    # FastAPI routes
│   └── requirements.txt
│
└── README.md
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Get JWT tokens |
| POST | `/api/auth/refresh` | Public | Rotate refresh token |

### Products
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/products` | Public | List with search, category, pagination |
| GET | `/api/products/:id` | Public | Product details |
| POST | `/api/products/batch` | Public | Batch fetch by IDs |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |

### Orders
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/orders/checkout` | Auth | Place order |
| GET | `/api/orders/my` | Auth | User's orders |
| PUT | `/api/orders/:id/cancel` | Auth | Cancel order |
| GET | `/api/orders/all` | Admin | All orders |
| PUT | `/api/orders/:id/status` | Admin | Update status |

### AI
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/chat` | Public | AI chatbot (proxied to Python) |
| GET | `/api/reviews/summary` | Public | Aggregated sentiment stats |

### Payments
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/payments/create-intent` | Auth | Create Stripe PaymentIntent |
| POST | `/api/payments/webhook` | Public | Stripe webhook receiver |

---

## Environment Variables

### Backend (`application.properties`)
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/vsv_db
spring.datasource.username=vsv_user
spring.datasource.password=your_password
jwt.secret=your-256-bit-secret-key
stripe.secret-key=sk_test_...
stripe.publishable-key=pk_test_...
```

### AI Service (`.env`)
```
GEMINI_API_KEY=AIza...
HF_API_KEY=hf_...
HF_MODEL=cardiffnlp/twitter-xlm-roberta-base-sentiment-multilingual
BACKEND_URL=http://localhost:8080
```

### Frontend (`.env.local`)
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_CLOUDINARY_CLOUD=your_cloud_name
VITE_CLOUDINARY_PRESET=vsv_products
```

---

## Tech Stack Details

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Java (Temurin) | 24 | Backend runtime |
| Framework | Spring Boot | 4.0.6 | REST API, DI, Security |
| ORM | Hibernate | 7.2 | Object-relational mapping |
| Security | Spring Security | 7.0 | JWT auth, RBAC |
| Database | PostgreSQL | 16 | Relational data store |
| Payments | Stripe SDK | 28.2 | Card processing, webhooks |
| AI Chat | Google Gemini | 2.5 Flash | Conversational generation |
| AI Sentiment | RoBERTa (XLM) | 125M params | Multilingual classification |
| AI API | HuggingFace | Inference API | Cloud model hosting |
| Frontend | React | 18 | UI components |
| Language | TypeScript | 5 | Type safety |
| Build | Vite | 5 | Dev server, bundling |
| CSS | Tailwind | v4 | Utility-first styling |
| Components | DaisyUI | v5 | Pre-built UI components |
| State | Zustand | 4 | Client-side state management |
| HTTP | Axios | 1.x | API client with interceptors |
| Python | FastAPI | 0.110+ | Async AI microservice |
| Images | Cloudinary | API v1 | CDN, auto-optimization |

---

## License

This project was developed as a Master's thesis at the university level. All rights reserved.

---

<p align="center">
  <strong>✦ VsV Parfumuri</strong><br>
  <em>AI-Powered Fragrance Discovery</em>
</p>