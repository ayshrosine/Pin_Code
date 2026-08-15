# 📍 Bangalore Pincode Explorer

> A full-stack, responsive web application built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **MongoDB with Prisma ORM**. Powered by **India Post's official live public API** (`api.postalpincode.in`) paired with a **cache-first database strategy**.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://pin-code-sandy.vercel.app/)
[![Tech Stack](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Live API](https://img.shields.io/badge/API-India%20Post%20Live-FF9933?style=for-the-badge)](https://api.postalpincode.in)
[![Database Cache](https://img.shields.io/badge/Database-MongoDB%20%2B%20Prisma-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Testing](https://img.shields.io/badge/Tested%20With-Jest%20%26%20Cypress-C21325?style=for-the-badge&logo=cypress&logoColor=white)](https://cypress.io)

---

## 🌐 Live Demo & Preview

- **Production Deployment**: [https://pin-code-sandy.vercel.app/](https://pin-code-sandy.vercel.app/)
- **Local Development**: `http://localhost:3000`

---

## 🏛️ Architecture & Cache-First Strategy

The application uses a **Cache-First, API-Fallback** architecture:

```
[ User Search Request ]
          │
          ▼
┌──────────────────┐      Cache Hit (< 30 days)
│  Next.js API     ├─────────────────────────────► [ Return Cached Response ] (HTTP 200, X-Cache: HIT)
│  Proxy Route     │
└────────┬─────────┘
         │
         │ Cache Miss / Expired
         ▼
┌───────────────────────────────────────┐
│  India Post Live Public REST API      │
│  (https://api.postalpincode.in)       │
└────────┬──────────────────────────────┘
         │
         ├──► Filter to Bangalore/Karnataka
         │
         ├──► Asynchronously Write to MongoDB (PincodeCache Table)
         │
         ▼
[ Return Fresh Response ] (HTTP 200, X-Cache: MISS)
```

### Why Cache-First?
1. **Performance**: Reduces round-trip latency from ~500ms (live API call) down to ~15ms for cached lookups.
2. **Reliability & Rate-Limiting Protection**: Protects India Post's free public endpoint from being overwhelmed during heavy traffic spikes while keeping the app online even if the external service experiences downtime.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Live External API**: India Post Public API (`https://api.postalpincode.in`) — **No API Key Required**
- **Database Caching Layer**: MongoDB with Prisma ORM (`PincodeCache` model)
- **Styling**: Tailwind CSS with sleek dark/light design system
- **State Management**: React `useState` & `useCallback` with 300ms debouncing
- **Icons**: Lucide React
- **Testing**:
  - **Jest** (`ts-jest`) with `global.fetch` mocks for unit testing API routes & caching paths.
  - **Cypress** for End-to-End (E2E) search flow & error handling validation.

---

## ✨ Features List

1. **Live India Post Integration**:
   - **Pincode Lookup**: `GET /api/pincodes/[code]` -> fetches `https://api.postalpincode.in/pincode/{code}`.
   - **Area Reverse Lookup**: `GET /api/pincodes/search?area=koramangala` -> fetches `https://api.postalpincode.in/postoffice/{area}`.
2. **First-Load Cached Preview**:
   - `GET /api/pincodes/cached` populates the homepage on initial load so the interface is immediately populated with popular/recently searched Bangalore postal codes before the user types.
3. **Smart Filter**:
   - Automatically filters all raw India Post responses to ensure only authentic Bangalore / Bengaluru / Karnataka entries are returned.
4. **Distinct Error States**:
   - **400 Bad Request**: Invalid pincode format (rejected before calling external API).
   - **404 Not Found**: No matching post office or area found.
   - **503 Service Unavailable**: India Post API timeout or service downtime.
5. **Modern Accessible UI**:
   - Mobile-first layout (375px+ responsive).
   - Switchable Cards grid and Table view.
   - Skeleton loading states while network calls resolve.
   - Copy pincode to clipboard with toast feedback.
   - ARIA live region (`aria-live="polite"`) announcing result counts for screen readers.

---

## 🚀 Local Setup Instructions

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/ayshrosine/Pin_Code.git
cd Pin_Code
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# MongoDB Connection String
DATABASE_URL="mongodb://localhost:27017/pincode_db"
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 API Documentation

### 1. `GET /api/pincodes/[code]`
Fetches pincode details. Checks MongoDB cache first; if cache miss, queries India Post live API and caches result.

- **Parameters**: `code` (6-digit numeric string)
- **Header Response**: `X-Cache: HIT` or `X-Cache: MISS`
- **Example**: `GET /api/pincodes/560034`
- **Success Response** (`200 OK`):
  ```json
  {
    "data": [
      {
        "id": "66be18a123f1a23456789034",
        "code": "560034",
        "areaName": "Koramangala",
        "district": "Bangalore",
        "state": "Karnataka"
      }
    ],
    "count": 1,
    "source": "cache",
    "query": "560034"
  }
  ```

- **Invalid Format Error** (`400 Bad Request`):
  ```json
  {
    "error": "Invalid pincode format. Must be a 6-digit numeric string."
  }
  ```

- **Not Found Error** (`404 Not Found`):
  ```json
  {
    "error": "Pincode '560099' not found."
  }
  ```

- **Service Error** (`503 Service Unavailable`):
  ```json
  {
    "error": "Service temporarily unavailable, please try again."
  }
  ```

---

### 2. `GET /api/pincodes/search`
Searches post offices by area name.

- **Query Parameters**: `area` (string, e.g., `Koramangala`, `Whitefield`)
- **Example**: `GET /api/pincodes/search?area=Koramangala`
- **Success Response** (`200 OK`):
  ```json
  {
    "data": [
      {
        "code": "560034",
        "areaName": "Koramangala",
        "district": "Bangalore",
        "state": "Karnataka"
      }
    ],
    "count": 1,
    "source": "live-api",
    "query": "Koramangala"
  }
  ```

---

### 3. `GET /api/pincodes/cached`
Returns all currently cached Bangalore pincodes for instant first-load presentation.

- **Example**: `GET /api/pincodes/cached`
- **Success Response** (`200 OK`):
  ```json
  {
    "data": [...],
    "count": 16,
    "message": "Recently searched & cached pincodes retrieved successfully."
  }
  ```

---

## 🧪 Running Tests

### 1. Unit Tests (Jest)
Run unit tests verifying format validation, fetch mocking, 404 mapping, and cache-hit bypass:
```bash
npm test
```

### 2. End-to-End Tests (Cypress)
Start dev server (`npm run dev`) and run Cypress:
```bash
npx cypress run
```

---

## 📂 Project Structure

```
bangalore-pincode-explorer/
├── app/
│   ├── api/
│   │   └── pincodes/
│   │       ├── [code]/
│   │       │   └── route.ts         # GET /api/pincodes/[code] (cache-first + live API)
│   │       ├── search/
│   │       │   └── route.ts         # GET /api/pincodes/search?area=... (area lookup)
│   │       └── cached/
│   │           └── route.ts         # GET /api/pincodes/cached (initial feed)
│   ├── globals.css                  # Tailwind styles
│   ├── layout.tsx                   # Metadata & Root layout
│   └── page.tsx                     # Main interactive SPA
├── components/
│   ├── SearchBar.tsx                # Debounced search bar with mode toggle
│   ├── ResultCard.tsx               # Responsive card / table row
│   └── ErrorState.tsx               # Distinct 400, 404, 503 error UI
├── lib/
│   ├── db.ts                        # MongoDB cache functions & fallback data
│   ├── postalApi.ts                 # Live India Post API wrapper & timeout filter
│   └── prisma.ts                    # Prisma client singleton
├── prisma/
│   └── schema.prisma                # PincodeCache MongoDB model
├── __tests__/
│   └── pincode-api.test.ts          # Jest test suite (fetch mocks & cache tests)
├── cypress/
│   └── e2e/
│       └── search.cy.ts             # Cypress E2E search flow & error tests
├── cypress.config.ts                # Cypress configuration
├── jest.config.js                   # Jest configuration
└── README.md                        # Project documentation
```

---

## 🔮 Known Limitations

1. **India Post Rate Limits**: India Post does not publish formal API rate limit documentation. The caching layer actively mitigates rate-limit risks by serving repeat queries directly from MongoDB.
2. **District Matching**: India Post data sometimes uses `"Bangalore"`, `"Bengaluru"`, or `"BANGALORE URBAN"`. The `filterBangaloreOffices` helper normalizes these variations.
