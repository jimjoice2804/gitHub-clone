# Installed Dependencies

## Production Dependencies

### Core Framework

- **express** (^5.1.0) - Fast, unopinionated web framework for Node.js
- **dotenv** (^17.2.3) - Load environment variables from .env file

### Security & Middleware

- **cors** (^2.8.5) - Enable CORS (Cross-Origin Resource Sharing)
- **helmet** (^8.1.0) - Secure Express apps by setting HTTP headers
- **express-rate-limit** (^8.1.0) - Rate limiting middleware for Express

### Authentication & Encryption

- **bcryptjs** (^3.0.2) - Password hashing library
- **jsonwebtoken** (^9.0.2) - JWT token generation and verification

### Database

- **@prisma/client** (^6.17.1) - Auto-generated database client for Prisma ORM

### Validation

- **zod** (^4.1.12) - TypeScript-first schema validation library

### Git Operations

- **simple-git** (^3.28.0) - Simple interface for running git commands in Node.js

---

## Development Dependencies

### TypeScript

- **typescript** (^5.9.3) - TypeScript language compiler
- **@types/node** (^24.7.2) - TypeScript definitions for Node.js
- **@types/express** (^5.0.3) - TypeScript definitions for Express
- **@types/cors** (^2.8.19) - TypeScript definitions for CORS
- **@types/bcryptjs** (^2.4.6) - TypeScript definitions for bcryptjs
- **@types/jsonwebtoken** (^9.0.10) - TypeScript definitions for JWT

### Development Tools

- **ts-node** (^10.9.2) - TypeScript execution engine for Node.js
- **ts-node-dev** (^2.0.0) - Fast TypeScript development with hot reload
- **nodemon** (^3.1.10) - Automatically restart Node.js applications
- **tsconfig-paths** (^4.2.0) - Load modules using tsconfig paths

### Database Tools

- **prisma** (^6.17.1) - Prisma CLI for database migrations and management

### Code Quality

- **eslint** (^9.37.0) - JavaScript/TypeScript linter
- **@typescript-eslint/parser** (^8.46.0) - ESLint parser for TypeScript
- **@typescript-eslint/eslint-plugin** (^8.46.0) - ESLint plugin for TypeScript
- **eslint-config-prettier** (^10.1.8) - Turns off ESLint rules that conflict with Prettier
- **prettier** (^3.6.2) - Code formatter

### Testing

- **jest** (^30.2.0) - JavaScript testing framework
- **ts-jest** (^29.4.5) - TypeScript preprocessor for Jest
- **@types/jest** (^30.0.0) - TypeScript definitions for Jest
- **supertest** (^7.1.4) - HTTP assertions for testing APIs
- **@types/supertest** (^6.0.3) - TypeScript definitions for supertest

---

## Package Counts

- **Production Dependencies**: 10 packages
- **Development Dependencies**: 18 packages
- **Total Packages Installed**: 640 packages (including transitive dependencies)

---

## Key Features Enabled

✅ **TypeScript Support** - Full type safety across the application
✅ **Express Server** - Modern web server with middleware support
✅ **Database ORM** - Prisma for type-safe database operations
✅ **Authentication** - JWT-based auth with bcrypt password hashing
✅ **Validation** - Zod for runtime type checking and validation
✅ **Security** - Helmet, CORS, and rate limiting
✅ **Git Operations** - Simple-git for repository management
✅ **Testing** - Jest with supertest for comprehensive testing
✅ **Code Quality** - ESLint + Prettier for consistent code style
✅ **Hot Reload** - Nodemon for fast development

---

## Version Information

- Node.js: v18+ recommended
- TypeScript: v5.9.3
- Prisma: v6.17.1
- Express: v5.1.0
