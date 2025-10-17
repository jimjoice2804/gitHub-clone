# GitHub Clone - Backend API

A full-featured GitHub clone built with **Node.js**, **TypeScript**, **Express**, and **Prisma ORM**.

## 🚀 Features

- ✅ User authentication & authorization (JWT)
- ✅ Repository management (create, delete, fork, star)
- ✅ Git operations (commit, push, pull, branch, merge)
- ✅ Issues & Pull Requests
- ✅ Social features (follow, star, watch)
- ✅ Search & discovery
- ✅ Type-safe with TypeScript
- ✅ Database with Prisma ORM

## 🛠️ Tech Stack

- **Runtime**: Node.js v18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: Zod
- **Testing**: Jest
- **Code Quality**: ESLint, Prettier

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v14 or higher)
- [Git](https://git-scm.com/)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd gitHub-clone
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure your database and other settings.

4. **Set up the database**

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## 📜 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

## 📁 Project Structure

```
gitHub-clone/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── services/        # Business logic layer
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Helper functions
│   ├── types/           # TypeScript type definitions
│   └── index.ts         # Application entry point
├── prisma/
│   └── schema.prisma    # Prisma database schema
├── tests/               # Test files
├── .env.example         # Environment variables template
├── tsconfig.json        # TypeScript configuration
├── package.json         # Project dependencies
└── README.md            # Project documentation
```

## 🔐 Environment Variables

See `.env.example` for all available environment variables.

Key variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 3000)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📝 API Documentation

API documentation will be available at `http://localhost:3000/api/docs` when the server is running.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Jimmy Joice Kerketta

## 🙏 Acknowledgments

- Inspired by GitHub
- Built with modern Node.js best practices
