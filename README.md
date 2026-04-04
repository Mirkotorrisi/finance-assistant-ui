# Finance Assistant UI 🏦🎨

The **Finance Assistant UI** is a modern Next.js application that provides a chat-based entry point for interacting with your financial data. It uses the **Vercel AI SDK** to stream responses and dynamically render UI components on the fly.

## 🚀 Quick Start

This service is typically run as part of the [Finance Assistant Monorepo](../README.md) using Docker Compose.

### Local Development (with npm)

1. Ensure you have [Node.js 20+](https://nodejs.org/) installed.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## 🧠 Brain Integration

The UI does not call models directly. Instead, it proxies all chat requests to the **AI Agent** (`llm-finance-assistant`).
-   Configuration: `PYTHON_AGENT_URL` (default: `http://localhost:8000`).

## 🛠️ Tech Stack

-   **Frontend**: Next.js 14+, React, Tailwind CSS, Shadcn/UI.
-   **AI Interaction**: Vercel AI SDK (with custom `render_ui` tool).
-   **Charts**: Recharts / Tremor for data visualization.
-   **Database**: Drizzle ORM (for local analytics/metadata storage).

## 🐳 Docker (Standalone)

Built for efficiency, the Docker image uses Next.js `standalone` mode to keep the production bundle small:
```bash
docker build -t finance-ui .
docker run -p 3000:3000 finance-ui
```

---
Part of the [Finance Assistant Monorepo](../)
