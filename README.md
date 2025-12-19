# Alpha Terminal Frontend

Real-time institutional intelligence dashboard built with Vite.js + React 18.

## Tech Stack

- **Vite.js** - Lightning-fast dev server and build tool
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Zustand** - State management
- **React Router v6** - Client-side routing
- **Framer Motion** - Animations
- **TradingView Lightweight Charts** - Professional charts
- **Recharts** - Additional charting

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── ui/          # Base UI components (Card, Badge, etc.)
│   ├── widgets/     # Dashboard widgets
│   ├── charts/      # Chart components
│   └── layout/      # Layout components (Header, Sidebar)
├── pages/           # Page components
├── hooks/           # Custom React hooks
├── lib/             # Utilities (API client, formatters)
├── stores/          # Zustand stores
└── types/           # TypeScript type definitions
```

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:8000/api/v1)
- `VITE_WS_URL` - WebSocket URL (default: ws://localhost:8000/api/v1)

## Development

The dev server runs on `http://localhost:5173` by default (Vite's default port).

Hot Module Replacement (HMR) is enabled for instant updates during development.
