# Helpdesk Ticketing System (IIT Ropar)

A comprehensive Helpdesk and Ticketing system designed for internal IT support. This system features dynamic form fields, auto-assignment logic, LDAP integration, and secure OTP-based ticket closure.

## 🚀 Repository Status
> [!IMPORTANT]
> This is a **Private/Proprietary** repository. Unauthorized copying or distribution of these files via any medium is strictly prohibited.

## 🛠 Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Headless UI, Heroicons.
- **Backend**: Node.js, Express, Prisma (ORM).
- **Database**: PostgreSQL.
- **Authentication**: JWT, LDAP integration.
- **Reporting**: PDF generation for ticket analytics.

## 📂 Project Structure
- `/frontend`: React application (Vite).
- `/backend`: Node.js server with Prisma and services.
- `/database`: Legacy SQL reference (stored procedures, initial schema).
- `/prisma`: Modern database schema and migrations.

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v16+)
- PostgreSQL
- Gmail App Password (for SMTP)

### 2. Backend Setup
1. Navigate to `backend/`.
2. Install dependencies: `npm install`.
3. Create a `.env` file based on `.env.example`.
4. Run Prisma migrations: `npx prisma migrate dev`.
5. Start the server: `npm start` or `npm run dev`.

### 3. Frontend Setup
1. Navigate to `frontend/`.
2. Install dependencies: `npm install`.
3. Start the dev server: `npm run dev`.

## 🔄 Core Workflows
1. **Ticket Creation**: Users select categories/subcategories. The system fetches dynamic fields and auto-assigns the ticket to a team lead or technician using Round Robin logic.
2. **Resolution & OTP**: Tickets are resolved by technicians and closed only after the user verifies a secure OTP sent to their email.
3. **Escalation**: Tickets are automatically escalated to Team Leads after 48 business hours if not addressed.
4. **Reporting**: Admins can generate PDF reports by category, technician, and team, featuring turnaround time analytics.

## 📜 Legacy Database Note
The `/database` folder contains original SQL stored procedures. While most logic has moved to Prisma, the **Business Hours / SLA calculation** still resides in `stored_procedures.sql`. Refer to these files when implementing complex reporting features.
