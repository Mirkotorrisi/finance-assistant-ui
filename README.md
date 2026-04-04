# Finance Assistant UI 🏦💬

A **Next.js** chat-first generative UI that integrates with the [Finance Assistant API](https://github.com/Mirkotorrisi/finance-assistant-api).

The user types a natural-language request. The app generates a **strict, schema-validated UI plan** that renders only whitelisted finance components backed by real backend REST APIs.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- A running instance of [finance-assistant-api](https://github.com/Mirkotorrisi/finance-assistant-api) (default: `http://localhost:8080`)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) – you will land directly on the **Chat** page.

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | ✅ | Base URL of the Finance Assistant API (browser-side) |
| `API_BASE_URL` | ✅ | Same URL used in Next.js API routes (server-side) |
| `CHAT_PLAN_URL` | ☑️ | Full URL of a backend chat/plan endpoint. When set, all chat requests are forwarded here. The endpoint must accept `POST { messages }` and return `{ text, plan? }`. |
| `USE_MOCK_PLAN` | ☑️ | Set to `true` to enable the built-in keyword-based mock plan generator (no API key needed – great for local dev). |
| `OPENAI_API_KEY` | ☑️ | OpenAI key used when neither `CHAT_PLAN_URL` nor `USE_MOCK_PLAN` is set. |

> **Tip for local dev:** Set `USE_MOCK_PLAN=true` in `.env.local` to try the generative UI without any OpenAI key.

---

## 🧩 Generative UI Architecture

### Chat flow

```
User message
    │
    ▼
/api/ai/chat  (Next.js route)
    │
    ├─ CHAT_PLAN_URL set?   → forward to backend chat endpoint → UI Plan JSON
    ├─ USE_MOCK_PLAN=true?  → keyword-match mock plan generator → UI Plan JSON
    └─ Otherwise            → OpenAI generateText with finance tools → UI Plan JSON
    │
    ▼
ChatContainer parses the UI_METADATA_MARKER
    │
    ▼
UIRenderer validates the plan with Zod
    │
    ▼
Render only whitelisted components
    │
    ▼
Each component fetches its own data from the backend APIs via lib/services/
```

### Whitelisted components

| Component | Description |
|---|---|
| `SummaryCards` | Balance, monthly income/expenses/net |
| `TransactionsTable` | Paginated transaction list |
| `AccountsList` | Financial accounts with balances |
| `SpendingPie` | Spending by category (pie chart) |
| `MonthlyBarChart` | Monthly income vs expenses bar chart |
| `FormTransaction` | Create a new transaction |
| `FormAccount` | Create a new account |

### UI Plan schema

```json
{
  "text": "Here is your financial data.",
  "components": [
    {
      "type": "SummaryCards",
      "order": 0,
      "title": "Financial Overview"
    },
    {
      "type": "TransactionsTable",
      "order": 1,
      "title": "Recent Transactions",
      "action": {
        "service": "transactions",
        "method": "list",
        "params": { "category": "groceries" }
      }
    }
  ]
}
```

Any `type` not in the whitelist is **rejected** at runtime – the frontend never renders unknown components.

---

## 🗂️ Services Layer

All backend REST endpoints are mapped in `lib/services/`:

| Service file | Backend resource |
|---|---|
| `http.ts` | Shared fetch wrapper + error handling |
| `transactions.service.ts` | `GET/POST/PUT/DELETE /api/transactions` |
| `accounts.service.ts` | `GET/POST/PUT/DELETE /api/accounts` |
| `financial-data.service.ts` | `GET /api/financial-data/{year}` |
| `financial-summary.service.ts` | `GET /api/financial-summary/*` |
| `health.service.ts` | `GET /health` |

---

## 🐳 Docker

```bash
docker build -t finance-assistant-ui .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=http://api:8080 \
  -e API_BASE_URL=http://api:8080 \
  -e USE_MOCK_PLAN=true \
  finance-assistant-ui
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| Charts | Recharts |
| AI / Tools | Vercel AI SDK + OpenAI |
| Validation | Zod |
