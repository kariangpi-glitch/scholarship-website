# ScholarshipHub

Scholarships and Free-ships Management — a full-stack-style React app with role-based demo login and localStorage persistence (no backend required).

## Tech stack

- React 19 + Vite
- React Router
- Plain CSS (responsive layout)

## Getting started

```bash
cd scholarship-hub
npm install
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173).

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Student | student@gmail.com | 1234 |
| Admin | admin@gmail.com | 1234 |
| Institution | institution@gmail.com | 1234 |

## Features

### Student
- Dashboard (applications, pending, approved)
- Browse and apply for scholarships
- Upload documents
- Track application status
- Profile

### Admin
- Dashboard (active scholarships, pending reviews, approvals)
- Create, edit, delete scholarships
- Approve or reject applications
- Post announcements
- Profile

### Institution
- Dashboard
- Review applications and forward to admin
- Verify student documents
- Manage institution scholarships
- Profile

## Data storage

All data is stored in the browser `localStorage` under keys prefixed with `sh_`. Seed data loads on first visit.

## Build for production

```bash
npm run build
npm run preview
```
