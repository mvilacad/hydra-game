# GEMINI.md

## Project Overview

This is a real-time, multi-player quiz game called "Hydra Game". The frontend is built with React, Vite, and React Three Fiber for 3D graphics, while the backend is powered by Node.js, Express, and WebSockets for real-time communication. The project uses TypeScript for both the client and server, and a PostgreSQL database with Drizzle ORM for data persistence.

The game appears to involve players joining a game room, answering questions, and collectively battling a "Hydra" by answering correctly. The game supports multiple character types and different attack types.

### Key Technologies

*   **Frontend:** React, Vite, React Three Fiber, Tailwind CSS, Radix UI, wouter
*   **Backend:** Node.js, Express, WebSocket (socket.io), TypeScript
*   **Database:** PostgreSQL, Drizzle ORM
*   **Deployment:** Docker

## Building and Running

### Development

To run the application in development mode, use the following command:

```bash
pnpm run dev
```

This will start the Vite development server for the frontend and the Node.js server for the backend with hot module replacement.

### Docker

To run the application using Docker, use the following command:

```bash
pnpm run dev:docker
```

### Production

To build the application for production, use the following command:

```bash
pnpm run build
```

To start the application in production mode, use the following command:

```bash
pnpm run start
```

### Database

The project uses `drizzle-kit` for database migrations. The following scripts are available for database management:

*   `pnpm run db:generate`: Generate database migration files.
*   `pnpm run db:push`: Apply migrations to the database.
*   `pnpm run db:migrate`: Run database migrations.
*   `pnpm run db:studio`: Open the Drizzle Studio.
*   `pnpm run db:drop`: Drop the database.
*   `pnpm run db:setup`: A script to set up the database.

## Development Conventions

*   **Code Style:** The project uses Biome for code formatting and linting.
*   **Type Checking:** The project uses TypeScript for static type checking. Run `pnpm run check` to type-check the code.
*   **API:** The backend exposes a RESTful API for managing games and questions. The API endpoints are defined in `server/routes/index.ts`.
*   **WebSockets:** Real-time communication is handled using WebSockets. The WebSocket event handlers are defined in `server/websocket/index.ts`.
*   **Database Schema:** The database schema is defined in `shared/schema.ts` using Drizzle ORM.
