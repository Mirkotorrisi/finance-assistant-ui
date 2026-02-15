# AI Finance Assistant UI

This is a finance assistant UI application built with Next.js, React, TypeScript, and AI-powered chat capabilities.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure the required environment variables for authentication and database.

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build

Build for production:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

### Lint

Run ESLint:
```bash
npm run lint
```

### Database

Generate database migrations:
```bash
npm run db:generate
```

Run database migrations:
```bash
npm run db:migrate
```

Open database studio:
```bash
npm run db:studio
```

## Features

- AI-powered financial chat assistant
- Real-time financial data and stock quotes
- Interactive charts and visualizations
- Authentication with NextAuth.js
- PostgreSQL database with Drizzle ORM
