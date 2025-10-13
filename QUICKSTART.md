# 🚀 Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed (recommended)
- Git installed

## Setup Instructions

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Start Database with Docker

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Check if containers are running
docker-compose ps
```

### 3️⃣ Configure Environment

The `.env` file has been created with default Docker database settings:

```
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/github_clone?schema=public"
```

### 4️⃣ Run Database Migrations

```bash
# Create and apply migrations
npx prisma migrate dev --name init

# Generate Prisma Client (if not already done)
npx prisma generate
```

### 5️⃣ Start Development Server

```bash
npm run dev
```

The server will start at: `http://localhost:3000`

### 6️⃣ Test the API

```bash
# Health check
curl http://localhost:3000/health

# Root endpoint
curl http://localhost:3000/
```

---

## 🐳 Docker Commands

### Start services

```bash
docker-compose up -d
```

### Stop services

```bash
docker-compose down
```

### View logs

```bash
docker-compose logs -f postgres
```

### Access PostgreSQL

```bash
docker exec -it github-clone-postgres psql -U postgres -d github_clone
```

### Reset database

```bash
docker-compose down -v  # Removes volumes
docker-compose up -d
npx prisma migrate dev
```

---

## 📦 Available NPM Scripts

| Command                 | Description                              |
| ----------------------- | ---------------------------------------- |
| `npm run dev`           | Start development server with hot reload |
| `npm run build`         | Build for production                     |
| `npm start`             | Start production server                  |
| `npm run lint`          | Run ESLint                               |
| `npm run lint:fix`      | Fix ESLint errors                        |
| `npm run format`        | Format code with Prettier                |
| `npm test`              | Run tests                                |
| `npm run test:watch`    | Run tests in watch mode                  |
| `npm run test:coverage` | Generate test coverage                   |

---

## 🗃️ Prisma Commands

| Command                    | Description                            |
| -------------------------- | -------------------------------------- |
| `npx prisma studio`        | Open Prisma Studio (database GUI)      |
| `npx prisma migrate dev`   | Create and apply migrations            |
| `npx prisma migrate reset` | Reset database and migrations          |
| `npx prisma generate`      | Generate Prisma Client                 |
| `npx prisma db push`       | Push schema changes without migrations |
| `npx prisma db seed`       | Run seed scripts                       |

---

## 🔍 Verification Checklist

- [ ] Dependencies installed (`node_modules` exists)
- [ ] Docker containers running (`docker-compose ps`)
- [ ] Database accessible (connection string correct)
- [ ] Prisma Client generated
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Dev server starts (`npm run dev`)
- [ ] Health check passes (`curl http://localhost:3000/health`)

---

## 🐛 Troubleshooting

### Port already in use

```bash
# Find process using port 3000
lsof -i :3000
# Kill the process
kill -9 <PID>
```

### Database connection failed

```bash
# Check if PostgreSQL is running
docker-compose ps
# Restart PostgreSQL
docker-compose restart postgres
```

### Prisma Client errors

```bash
# Regenerate Prisma Client
npx prisma generate
```

---

## 📚 Next Steps

After setup is complete, you can:

1. Design the database schema in `prisma/schema.prisma`
2. Run migrations: `npx prisma migrate dev`
3. Start building features (auth, repositories, etc.)
4. Write tests in the `tests/` directory
5. Check API documentation at `/api/docs`

Happy coding! 🎉
