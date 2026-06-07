# Eventful — Frontend

**→ https://eventful.fly.dev**

React + TypeScript + Vite frontend for Eventful, an event ticketing platform.

## Prerequisites

- Node.js >= 18
- pnpm
- Backend server running (see `eventful-backend/`)

## Setup

```bash
pnpm install
```

The dev server proxies API requests to `http://localhost:3000` by default. If the backend runs on a different port, update `VITE_API_URL` in `.env`:

```
VITE_API_URL=http://localhost:3000
```

## Running

```bash
pnpm dev       # dev server with HMR
pnpm build     # production build to dist/
pnpm preview   # preview production build
```

## Project Structure

```
src/
  assets/       Static assets (images, icons)
  components/   Reusable UI components
  contexts/     React contexts (auth, toast)
  lib/          API client, types, helpers
  pages/        Route-level page components
```

## Pages

| Route                 | Page              | Auth     | Role        |
| --------------------- | ----------------- | -------- | ----------- |
| `/`                   | Landing           | No       | —           |
| `/auth`               | Sign In / Sign Up | No       | —           |
| `/explore`            | Browse Events     | No       | —           |
| `/event/:id`          | Event Details     | No       | —           |
| `/payment/callback`   | Payment Confirm   | No*      | —           |
| `/ticket`             | My Tickets        | Yes      | EVENTEE     |
| `/ticket/:id`         | Ticket Detail     | Yes      | EVENTEE     |
| `/profile`            | Profile           | Yes      | Any         |
| `/reminders`          | Reminders         | Yes      | Any         |
| `/dashboard`          | Creator Dashboard | Yes      | CREATOR     |
| `/manage/events`      | Manage Events     | Yes      | CREATOR     |
| `/manage/tickets/:id` | Manage Tickets    | Yes      | CREATOR     |
| `/scan`               | Scan Tickets      | Yes      | CREATOR     |

*\* Shows "Sign in to confirm payment" if unauthenticated.*

## Key Libraries

- **React Router** — client-side routing
- **Axios** — API client with auth interceptor + error normalization
- **Tailwind CSS** — utility-first styling
- **Material Symbols** — icon set

## Error Handling

All API errors flow through `src/lib/api.ts` which normalizes them to `err.friendlyMessage`. Every page uses this instead of extracting raw `err.response.data.message`. Network errors and throttling responses are also mapped to readable strings.
