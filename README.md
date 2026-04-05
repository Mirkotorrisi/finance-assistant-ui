# Finance Assistant UI 🏦💬

A **Next.js** chat-first generative UI that integrates with the [Finance Assistant API](https://github.com/Mirkotorrisi/finance-assistant-api) and the [LLM Finance Assistant](https://github.com/Mirkotorrisi/llm-finance-assistant).

The user types a natural-language request. The LLM backend processes it and returns a **strict, schema-validated UI plan** that renders only whitelisted finance components backed by real backend REST APIs.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- A running instance of [finance-assistant-api](https://github.com/Mirkotorrisi/finance-assistant-api) (default: `http://localhost:8080`)
- A running instance of [llm-finance-assistant](https://github.com/Mirkotorrisi/llm-finance-assistant) (default: `http://localhost:8000`)

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
| `NEXT_PUBLIC_API_BASE_URL` | ✅ | Base URL of the Finance Assistant API (browser-side). |
| `API_BASE_URL` | ✅ | Same URL used in server-side contexts. |
| `NEXT_PUBLIC_LLM_API_BASE_URL` | ✅ | Base URL of the LLM Finance Assistant backend. The UI calls `POST {NEXT_PUBLIC_LLM_API_BASE_URL}/chat` directly from the browser. Default: `http://localhost:8000`. |

---

## 🧩 Generative UI Architecture

### Chat flow

```
User message
    │
    ▼
POST {NEXT_PUBLIC_LLM_API_BASE_URL}/chat  (direct browser call to LLM backend)
    │
    ▼
LLM backend returns { response: { text, ui? }, action, parameters, ... }
    │
    ▼
ChatContainer embeds ui_metadata with the UI_METADATA_MARKER
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
  -e NEXT_PUBLIC_LLM_API_BASE_URL=http://llm:8000 \
  finance-assistant-ui
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| Charts | Recharts |
| Validation | Zod |
