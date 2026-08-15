# Backend Auth Starter Kit

A TypeScript backend boilerplate featuring robust authentication, secure file uploads and logging. Built as a customizable foundation to accelerate your project development.

---

## Project Architecture

This starter kit implements a **3-Layer MVC (Model-View-Controller)** pattern. The decoupled design allows you to seamlessly transition into a Service-Repository structure, Feature-Based architecture, or Microservices as your application scales.

```text
Backend/
├── src/
│   ├── controllers/      # Handles incoming requests & HTTP responses

│   ├── routes/           # Defines API endpoints & maps to controllers

│   ├── validations/      # Zod validation schemas
│   ├── middlewares/      # Security, Auth, and Error interceptors

│   ├── models/           # MongoDB schemas and database logic
│   ├── interfaces/       # TypeScript type definitions & interfaces

│   └── utils/            # Helper classes, emailers, and loggers

├── temp/                 # Temporary local storage for file uploads

├── app.ts                # Express application configuration
├── server.ts             # Server entry point & database connection

├── .env                  # Local environment variables (git-ignored)

├── .env.sample           # Template for environment variables
├── .gitignore            # Git exclusion rules
├── openapi.json          # Swagger API documentation specs
├── package.json          # Project dependencies and scripts
├── readme.md             # Project documentation
└── tsconfig.json         # TypeScript compiler configurations
```

---

## Core Features

### Advanced Authentication
*   **Dual-Token System**: Implements JWT Access and Refresh token mechanics.
*   **Secure Cookies**: Refresh tokens are stored in secure, `httpOnly` cookies to mitigate XSS attacks.
*   **Bearer Auth**: Access tokens are transmitted via the standard HTTP Authorization header for rapid request processing.

### Account Management
*   **User Profiles**: Pre-configured schema storing `firstName`, `lastName`, `DOB`, and `avatar`.
*   **Scalable Models**: Easily extendable MongoDB schemas to fit unique domain requirements.

### Media & Storage Pipelines
*   **Multer Integration**: Seamlessly handles multipart/form-data for incoming local file uploads.
*   **Cloudinary Storage**: Automates media uploads to Cloudinary, persisting structured asset metadata (`URL`, `publicId`) into MongoDB.

### Data Validation & Security
*   **Zod Schemas**: Strict, compile-time runtime validation guarding your API entry points.
*   **Validation Middleware**: Intercepts invalid incoming payloads before they hit your business logic, returning structured validation errors.

### Enterprise Logging & Operations
*   **Winston Logger**: Formatted, level-based console and file logging to track production runtime behavior.
*   **Morgan Middleware**: Real-time HTTP request logging for development transparency.

### Email Utilities
*   **Nodemailer Integration**: Pre-configured SMTP mailing channel.
*   **Template Ready**: Built to support custom HTML transactional email templates (e.g., verification, password resets).

### Interactive Documentation
*   **Swagger UI**: Integrated OpenAPI spec (`openapi.json`) allows you to test, debug, and execute live API queries instantly without a frontend.

---

##  Quick Start

### 1. Clone & Install
```bash
git clone <https://github.com/tafajjul-khan/Backend-Auth-Starter-Kit>
cd Backend
npm install
```

### 2. Environment Setup
Copy the sample file and populate it with your credentials:
```bash
cp .env.sample .env
```

### 3. Run the Application
```bash
# Development mode (with Hot Reloading)
npm run dev

# Production Build
npm run build
npm start
```
