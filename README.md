# Mail Manager Web Client

React + TypeScript single page application that works with the NestJS API to manage email hosted on your local Dovecot/Postfix stack.

## Features

- Email/password login with session persistence in `localStorage`
- Inbox list with unread counter and quick message preview
- Message viewer (plain text or HTML fallback) with delete action
- Basic composer for sending new messages through the authenticated account

## Getting Started

```bash
pnpm install
pnpm run dev
```

The dev server defaults to `http://localhost:5173`.

### Configuration

Set `VITE_API_BASE_URL` if the API is not running on `http://localhost:3000`:

```bash
VITE_API_BASE_URL=http://127.0.0.1:3000 pnpm run dev
```

## Scripts

```bash
# start Vite in dev mode
pnpm run dev

# check types and produce production build
pnpm run build

# preview the production build locally
pnpm run preview
```

## Expected API Headers

All authenticated requests include the `x-session-id` header provided by the backend login response. The client handles this automatically once signed in.
