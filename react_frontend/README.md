# React Frontend

This Vite app contains two separate entry points: the lending portal and the AgriTrade POS.

## Requirements

- Node.js compatible with Vite 8
- pnpm 9+

Install dependencies from this directory:

```bash
pnpm install
```

## Entry Points

| App | HTML entry | React entry | Development URL |
| --- | --- | --- | --- |
| Loan | `index.html` | `frontend/loan/main.tsx` | `http://localhost:3001/login` |
| POS | `pos.html` | `frontend/pos/main.tsx` | `http://localhost:3002/pos.html` |

Start the Loan frontend:

```bash
pnpm run dev
```

Start the POS frontend in a separate terminal:

```bash
pnpm run dev:pos
```

Both apps call the Laravel API at `http://localhost:8000/api` by default. To use another API URL, set `VITE_API_URL` in a local `.env.local` file.

## Production Builds

Build both apps:

```bash
pnpm run build
```

Or build them individually:

```bash
pnpm run build:loan
pnpm run build:pos
```

The Loan build is written to `dist/loan/` and the POS build to `dist/pos/`.
