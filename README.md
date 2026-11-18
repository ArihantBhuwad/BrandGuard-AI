# BrandGuard AI

**AI-powered Brand Governance and Content Compliance Platform**

BrandGuard AI helps organisations maintain consistent brand identity by bringing brand guidelines, content auditing, compliance checks and approval workflows into one centralised platform.

## Overview

Organisations publish content across multiple channels, making it difficult to maintain consistent brand voice, terminology and communication standards.

BrandGuard AI provides a centralised workspace to manage brand guidelines, audit content, identify compliance issues and review content before approval.

## Key Features

### 1. Brand Guidelines Management
- Create, view, edit and delete brand guidelines.
- Organise rules by category.
- Maintain a centralised brand knowledge hub.

### 2. Content Auditor
- Submit content for brand compliance checks.
- Identify writing-style, terminology and promotional-claim issues.
- Display evidence and severity for detected violations.
- Generate suggested corrections.
- Calculate an explainable compliance score.

### 3. Review & Approval
- Submit audited content for review.
- Support approval and rejection workflows.
- Maintain review decisions.

### 4. Reports & Insights
- View saved audit records and compliance scores.
- Track audit activity and review outcomes.
- Access reporting information from the workspace.

### 5. Authentication
- User registration and login.
- Password hashing and JWT-based authentication.
- Protected, user-specific API resources.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | CSS |
| Icons | Lucide React |
| Backend | Python, FastAPI |
| Database | PostgreSQL 16 |
| ORM | SQLAlchemy |
| Authentication | JWT, Argon2 |
| Containerisation | Docker, Docker Compose |
| API Documentation | OpenAPI, Swagger UI |

## System Architecture

```text
              User
               |
               v
       React + TypeScript
          Frontend
               |
          REST API
               |
               v
        FastAPI Backend
               |
       Authentication Layer
               |
       Business Logic & APIs
          /          \
         v            v
   PostgreSQL     Audit Engine
   Database       (Rule-based)
         |
         v
   Persistent Data
```

## Project Structure

```text
BrandGuard-AI/
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── database.py
│   │   └── main.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── public/
├── src/
│   ├── assets/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
│
├── docker-compose.yml
├── package.json
├── package-lock.json
├── index.html
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3.12 or compatible version
- Docker Desktop
- Git

### 1. Clone the repository

```bash
git clone https://github.com/ArihantBhuwad/BrandGuard-AI.git
cd BrandGuard-AI
```

### 2. Configure environment variables

Create a root `.env` file:

```env
POSTGRES_PASSWORD=your_secure_password
```

Create `backend/.env`:

```env
APP_NAME=BrandGuard AI API
ENVIRONMENT=development
DATABASE_URL=postgresql+psycopg://brandguard_user:your_secure_password@db:5432/brandguard_db
CORS_ORIGINS=http://localhost:5173
JWT_SECRET_KEY=your_generated_secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Use the same database password in both files. Generate a unique JWT secret and never commit either `.env` file.

### 3. Start the backend and database

```bash
docker compose up --build -d
```

Backend API:

`http://localhost:8000`

Swagger documentation:

`http://localhost:8000/docs`

### 4. Start the frontend

Open another terminal:

```bash
npm install
npm run dev
```

Frontend:

`http://localhost:5173`

For a different backend address, configure `VITE_API_BASE_URL` in the frontend environment.

## API Modules

| Module | Operations |
|---|---|
| Authentication | Register, login, current user |
| Guidelines | Create, read, update, delete |
| Audits | Create and retrieve audit records |
| Reviews | Submit, retrieve, approve and reject reviews |
| Health | API and database health checks |

## Current Implementation Notes

- The current content auditing engine uses local rule-based checks rather than a fully integrated external AI model.
- Audit records and guidelines are persisted in PostgreSQL.
- Review and approval functionality is connected to the backend.
- Reports & Insights provides basic reporting functionality. Advanced analytics and downloadable reports are future enhancements.

## Team BrandGuard AI

**Round 2 – The Build**

- Arihant Bhuwad
- Piyush Mandhare
- Chetan Rokade
- Niharika Pawar
- Samrudhi Varma
- Arpita Bhongade

## Future Scope

- Context-aware AI-powered semantic auditing.
- Advanced Brand Memory with document ingestion and retrieval.
- Advanced compliance analytics and risk insights.
- Downloadable compliance reports.

---

**BrandGuard AI — Protecting Brand Identity Through Intelligent Governance.**