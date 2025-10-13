# Authentication API Testing Guide

## 🚀 Getting Started

### Start the Server

```bash
npm run dev
```

The server will be running at `http://localhost:3000`

---

## 📝 API Endpoints

### Base URL

```
http://localhost:3000/api
```

---

## 🔐 Authentication Endpoints

### 1. Register a New User

**Endpoint:** `POST /api/auth/register`

**Request Body:**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "name": "John Doe"
  }'
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "name": "John Doe",
      "bio": null,
      "avatarUrl": null,
      "createdAt": "2025-10-13T..."
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Validation Errors (400):**

```json
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "username": ["Username must be at least 3 characters"],
    "password": ["Password must contain at least one uppercase letter"]
  }
}
```

---

### 2. Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "name": "John Doe",
      ...
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401):**

```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

---

### 3. Get Current User (Protected)

**Endpoint:** `GET /api/auth/me`

**Headers:**

```
Authorization: Bearer <accessToken>
```

**cURL Example:**

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "name": "John Doe",
    "bio": null,
    "location": null,
    "website": null,
    "avatarUrl": null,
    "company": null,
    "isVerified": false,
    "createdAt": "2025-10-13T...",
    "updatedAt": "2025-10-13T...",
    "_count": {
      "repositories": 0,
      "followers": 0,
      "following": 0
    }
  }
}
```

**Error Response (401):**

```json
{
  "success": false,
  "error": "No token provided"
}
```

---

### 4. Refresh Token

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 5. Logout

**Endpoint:** `POST /api/auth/logout`

**cURL Example:**

```bash
curl -X POST http://localhost:3000/api/auth/logout
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Note:** Logout is client-side. Delete the access and refresh tokens from local storage.

---

## 🔍 Testing with Existing Users

You can use the seeded test users:

```bash
# Login as John Doe
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Login as Jane Doe
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "password123"
  }'
```

---

## 📊 Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

---

## 📊 Username Requirements

- Minimum 3 characters
- Maximum 30 characters
- Only letters, numbers, hyphens, and underscores
- Must be unique

---

## 🔒 Token Information

### Access Token

- **Expires:** 7 days (configurable in `.env`)
- **Used for:** API authentication
- **Header:** `Authorization: Bearer <token>`

### Refresh Token

- **Expires:** 30 days (configurable in `.env`)
- **Used for:** Getting new access tokens
- **Should be:** Stored securely (httpOnly cookie recommended)

---

## 🧪 Testing with Postman

### Collection Setup

1. **Create Environment Variables:**
   - `baseUrl`: `http://localhost:3000/api`
   - `accessToken`: (will be set automatically)
   - `refreshToken`: (will be set automatically)

2. **Register Request:**
   - POST `{{baseUrl}}/auth/register`
   - Body: Raw JSON
   - Test script to save tokens:
     ```javascript
     const response = pm.response.json();
     pm.environment.set('accessToken', response.data.accessToken);
     pm.environment.set('refreshToken', response.data.refreshToken);
     ```

3. **Protected Request:**
   - GET `{{baseUrl}}/auth/me`
   - Headers: `Authorization: Bearer {{accessToken}}`

---

## 🐛 Common Errors

### 400 Bad Request

- **Cause:** Invalid input data
- **Fix:** Check validation errors in response

### 401 Unauthorized

- **Cause:** Missing or invalid token
- **Fix:** Include valid Bearer token in Authorization header

### 404 Not Found

- **Cause:** Route doesn't exist
- **Fix:** Check endpoint URL

### 500 Internal Server Error

- **Cause:** Server error
- **Fix:** Check server logs

---

## 📝 Rate Limiting

- **Window:** 15 minutes
- **Max Requests:** 100
- **Applies to:** `/api/*` routes
- **Response (429):**
  ```json
  {
    "success": false,
    "error": "Too many requests from this IP, please try again later."
  }
  ```

---

## ✅ Next Steps

After successful authentication:

1. Store tokens securely (localStorage or secure cookie)
2. Include `Authorization: Bearer <token>` header in protected requests
3. Refresh token before expiration
4. Handle 401 errors by refreshing token or redirecting to login
