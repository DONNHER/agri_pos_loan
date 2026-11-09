# Lending PIS - Project Overview

This repository contains the complete Lending PIS (Project Information System) application, split into two main components:

## Project Structure

```
Lending_PIS/
├── laravel_backend/     # Laravel API Backend
└── React Frontend/      # React TypeScript Frontend
```

## Components

### 🔧 Laravel Backend (`laravel_backend/`)
- **Framework**: Laravel 10+
- **Language**: PHP 8.1+
- **Purpose**: RESTful API, business logic, database management, authentication
- **Documentation**: See [laravel_backend/README.md](laravel_backend/README.md)

### ⚛️ React Frontend (`React Frontend/`)
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Purpose**: User interface, client-side state management, API integration
- **Documentation**: See [React Frontend/README.md](React Frontend/README.md)

## Getting Started

### Prerequisites
- PHP 8.1+ and Composer (for Laravel backend)
- Node.js 18+ and npm (for React frontend)
- Database (MySQL/PostgreSQL/SQLite)

### Quick Start

1. **Setup Laravel Backend:**
   ```bash
   cd laravel_backend
   composer install
   cp .env.example .env
   php artisan key:generate
   php artisan migrate
   php artisan serve
   ```

2. **Setup React Frontend (in a new terminal):**
   ```bash
   cd "React Frontend"
   npm install
   npm run dev
   ```

3. **Access the application:**
   - Backend API: http://localhost:8000
   - Frontend: http://localhost:5173 (or as shown in Vite output)

## Development Workflow

1. Start the Laravel backend server (`php artisan serve`)
2. Start the React development server (`npm run dev`)
3. Develop features in both folders independently
4. API communication happens via HTTP requests from React to Laravel

## Deployment

- **Backend**: Deploy Laravel to your preferred PHP hosting (Heroku, AWS, DigitalOcean, etc.)
- **Frontend**: Build with `npm run build` and deploy static files to Netlify, Vercel, AWS S3, etc.
- Configure CORS in Laravel to allow your frontend domain

## License

[Add your license here]

# agri_pos_loan
