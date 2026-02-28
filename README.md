# 🏠 Housewarming Registry

A real-time housewarming gift registry app built with **Angular**, **Node.js**, **PostgreSQL**, and **Socket.IO**.

Guests can browse available items and reserve what they'd like to bring. Admins can manage multiple sessions (e.g., "Friends Housewarming" and "Family Housewarming"), set items with quantities, and see who's bringing what — all in real-time.

---

## Features

- **Real-time updates** — All connected users see item availability changes instantly via WebSockets
- **Guest registration** — Name, surname, email + item selection with quantity
- **Admin dashboard** — Protected login with JWT authentication
- **Session management** — Create/edit/delete reusable sessions for different events
- **Item management** — CRUD items per session with categories and quantities
- **Guest tracking** — View all registered guests and their reserved items
- **Responsive design** — Works beautifully on desktop and mobile

---

## Tech Stack

| Layer     | Technology                          |
| --------- | ----------------------------------- |
| Frontend  | Angular 17+, Angular Material, SCSS |
| Backend   | Node.js, Express, Socket.IO         |
| Database  | PostgreSQL                          |
| Auth      | JWT + bcrypt                        |
| Real-time | Socket.IO                           |

---

## Prerequisites

- **Node.js** 18+ and **npm**
- **PostgreSQL** 14+

---

## Getting Started

### 1. Clone the repository

```bash
cd house-warming
```

### 2. Set up the database

Create a PostgreSQL database:

```sql
CREATE DATABASE housewarming;
```

### 3. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your database credentials:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=housewarming
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=change-this-to-a-long-random-string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 4. Install dependencies & initialize the database

```bash
# Backend
cd backend
npm install
npm run db:init    # Creates tables
npm run db:seed    # Seeds sample data + admin user

# Frontend
cd ../frontend
npm install
```

### 5. Start the application

**Backend** (runs on port 3000):

```bash
cd backend
npm run dev
```

**Frontend** (runs on port 4200):

```bash
cd frontend
npm start
```

Visit **http://localhost:4200** to see the app.

---

## Project Structure

```
house-warming/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express server + Socket.IO
│   │   ├── db.js             # PostgreSQL connection pool
│   │   ├── socket.js         # Socket.IO setup
│   │   ├── schema.js         # Database table creation
│   │   ├── seed.js           # Sample data seeder
│   │   ├── middleware/
│   │   │   └── auth.js       # JWT authentication middleware
│   │   └── routes/
│   │       ├── auth.js       # Login endpoints
│   │       ├── sessions.js   # Session CRUD
│   │       ├── items.js      # Item CRUD + availability
│   │       └── guests.js     # Guest registration + listing
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── services/     # API, Socket, Auth services
│   │   │   │   ├── guards/       # Auth guard
│   │   │   │   └── interceptors/ # JWT interceptor
│   │   │   ├── pages/
│   │   │   │   ├── home/         # Landing page
│   │   │   │   ├── registry/     # Public item browser
│   │   │   │   ├── register/     # Guest registration form
│   │   │   │   └── admin/        # Admin pages
│   │   │   │       ├── login/
│   │   │   │       ├── dashboard/
│   │   │   │       ├── sessions/
│   │   │   │       ├── items/
│   │   │   │       ├── guests/
│   │   │   │       └── layout/
│   │   │   ├── app.routes.ts
│   │   │   ├── app.config.ts
│   │   │   └── app.component.ts
│   │   ├── environments/
│   │   ├── styles.scss
│   │   └── index.html
│   ├── angular.json
│   ├── tsconfig.json
│   └── package.json
│
└── README.md
```

---

## API Endpoints

### Public

| Method | Endpoint                  | Description                 |
| ------ | ------------------------- | --------------------------- |
| GET    | `/api/sessions`           | List active sessions        |
| GET    | `/api/sessions/:id`       | Get session details         |
| GET    | `/api/items?session_id=X` | Get items with availability |
| POST   | `/api/guests`             | Register guest + items      |

### Admin (requires JWT)

| Method | Endpoint                   | Description                |
| ------ | -------------------------- | -------------------------- |
| POST   | `/api/auth/login`          | Admin login                |
| GET    | `/api/auth/me`             | Get current admin          |
| POST   | `/api/sessions`            | Create session             |
| PUT    | `/api/sessions/:id`        | Update session             |
| DELETE | `/api/sessions/:id`        | Delete session             |
| GET    | `/api/sessions/:id/stats`  | Session statistics         |
| POST   | `/api/items`               | Create item                |
| PUT    | `/api/items/:id`           | Update item                |
| DELETE | `/api/items/:id`           | Delete item                |
| GET    | `/api/guests?session_id=X` | List guests + reservations |
| DELETE | `/api/guests/:id`          | Remove guest               |

---

## Socket.IO Events

| Event              | Direction       | Description                     |
| ------------------ | --------------- | ------------------------------- |
| `join-session`     | Client → Server | Join a session room for updates |
| `leave-session`    | Client → Server | Leave a session room            |
| `items-updated`    | Server → Client | Full items list refresh         |
| `item-created`     | Server → Client | New item added                  |
| `item-updated`     | Server → Client | Item details changed            |
| `item-deleted`     | Server → Client | Item removed                    |
| `guest-registered` | Server → Client | New guest signed up             |
| `guest-removed`    | Server → Client | Guest deleted                   |

---

## Default Admin Credentials

- **Username:** `admin`
- **Password:** `admin123`

> ⚠️ Change these in your `.env` file before deploying to production!

---

## License

MIT
