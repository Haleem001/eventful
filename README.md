# Eventful

A full-stack event management platform for discovering, creating, and managing events with ticketing capabilities. Built with React 19 + TypeScript + Vite on the frontend and NestJS on the backend.

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, TailwindCSS v4      |
| Backend  | NestJS, TypeScript, TypeORM, PostgreSQL         |
| Auth     | JWT (Passport), role-based access               |
| Payments | Paystack integration                            |
| Package  | pnpm                                            |

## Features

### For Attendees (EVENTEE)
- Browse & discover events with live API data
- View event details (date, venue, price, description)
- Purchase tickets via Paystack payment gateway
- View active tickets with QR code for check-in
- Payment verification callback handling

### For Creators (CREATOR)
- Dashboard with analytics (revenue, tickets sold, attendance rate)
- Create, edit, and delete events
- View ticket sales per event with attendee info
- QR code scanner for ticket check-in
- Manual ticket verification by ID/reference
- Camera torch toggle for low-light scanning

### Shared
- JWT-based authentication
- Role-aware routing (bottom nav adapts to role)
- Toast notifications for all API interactions

## Project Structure

```
eventful/
├── eventful-backend/          # NestJS API server
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/          # Authentication, JWT, roles
│   │   │   ├── events/        # Event CRUD
│   │   │   ├── tickets/       # Ticket management & verification
│   │   │   ├── payments/      # Paystack integration
│   │   │   ├── analytics/     # Creator analytics
│   │   │   └── notifications/ # Reminders
│   │   ├── common/            # Guards, decorators, filters
│   │   └── main.ts
│   └── ...
├── eventful-frontend/         # React SPA
│   ├── src/
│   │   ├── pages/             # Route pages
│   │   ├── components/        # Shared components
│   │   ├── contexts/          # Auth, Toast contexts
│   │   ├── lib/               # API client, types, JWT utils
│   │   └── App.tsx            # Routes & providers
│   └── ...
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- PostgreSQL

### Backend

```bash
cd eventful-backend
pnpm install

# Create .env file with:
# DATABASE_URL=postgresql://...
# JWT_SECRET=...
# PAYSTACK_SECRET_KEY=...

pnpm run start:dev
```

The API runs on `http://localhost:3000/api`.

### Frontend

```bash
cd eventful-frontend
pnpm install
pnpm run dev
```

The UI runs on `http://localhost:5173`.

## API Endpoints

| Method | Path                       | Auth     | Role    | Description              |
| ------ | -------------------------- | -------- | ------- | ------------------------ |
| GET    | /api/events                | Public   | -       | List all events          |
| GET    | /api/events/:id            | Public   | -       | Get event details        |
| POST   | /api/events                | JWT      | CREATOR | Create an event          |
| PATCH  | /api/events/:id            | JWT      | CREATOR | Update an event          |
| DELETE | /api/events/:id            | JWT      | CREATOR | Delete an event          |
| GET    | /api/events/creator        | JWT      | CREATOR | List creator's events    |
| POST   | /api/auth/register         | Public   | -       | Register user            |
| POST   | /api/auth/login            | Public   | -       | Login                    |
| GET    | /api/tickets/user          | JWT      | -       | Current user's tickets   |
| GET    | /api/tickets/event/:id     | JWT      | CREATOR | Tickets for an event     |
| PATCH  | /api/tickets/:id/verify    | JWT      | CREATOR | Verify/scan a ticket     |
| POST   | /api/payments/initialize   | JWT      | -       | Initialize Paystack      |
| POST   | /api/payments/verify       | JWT      | -       | Verify payment           |
| GET    | /api/analytics/creator     | JWT      | CREATOR | Creator dashboard data   |

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/eventful
JWT_SECRET=your-secret-key
PAYSTACK_SECRET_KEY=sk_test_...
PORT=3000
```

### Frontend
Configured via Vite — the API base URL defaults to `http://localhost:3000/api`. Override with `VITE_API_URL` in `.env`.

## License

MIT
