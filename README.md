# StockWise 360

StockWise 360 is a full-stack inventory, billing, sales, expenses, and reporting system for small businesses. It helps teams manage stock, create customer invoices, track paid, pending, and partial payments, export reports, and monitor business performance from a responsive dashboard.

## Live Project

- Live app: [https://almaazkhan07.github.io/stockwise-360/](https://almaazkhan07.github.io/stockwise-360/)
- Backend health check: [https://stockwise-360-backend-production.up.railway.app/api/health](https://stockwise-360-backend-production.up.railway.app/api/health)
- Default login: `admin` / `Admin@123`

## Features

- Responsive dashboard for desktop, tablet, and mobile screens
- Inventory management with add, edit, update, and stock tracking
- Multi-stock support for managing separate business stock sections
- Sales and billing workflow with item-based bill calculation
- Editable invoices with customer purchase details
- Payment status support: paid, pending, and partial
- Expenses tracking for business cost monitoring
- Reports with revenue, COGS, profit, and summary analytics
- PDF, Excel, and invoice generation
- JWT-based authentication with protected API routes
- MySQL database integration for persistent data

## Stack

- Backend: Spring Boot 3, Java 17, Spring Security, JWT, Spring Data JPA
- Frontend: React 18, Vite, Tailwind CSS, Recharts
- Database: MySQL 8
- Hosting: GitHub Pages frontend, Railway backend, Railway MySQL

## Project Layout

```text
inventory-system/
  backend/
    src/main/java/com/inventory/
    src/main/resources/application.properties
  frontend/
    src/
  docs/
    SETUP_GUIDE.md
```

## Database

Create the MySQL database and user. For local XAMPP, this project was tested with `inventory_db` and a local MySQL user.

```sql
CREATE DATABASE inventory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'inventory_user'@'localhost' IDENTIFIED BY 'StrongPass@123';
GRANT ALL PRIVILEGES ON inventory_db.* TO 'inventory_user'@'localhost';
FLUSH PRIVILEGES;
```

Set database credentials with environment variables before running the backend:

```bash
DB_URL=jdbc:mysql://localhost:3306/inventory_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=Asia/Kolkata
DB_USERNAME=maazsql
DB_PASSWORD=your_mysql_password
JWT_SECRET=replace_with_a_long_random_secret
```

## Run Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend: `http://localhost:8080`
Swagger: `http://localhost:8080/swagger-ui.html`

## Run Frontend

```bash
cd frontend
npm install
npm start
```

Frontend: `http://localhost:3000`

## Default Login

- Username: `admin`
- Password: `Admin@123`

## Deployment

The project is deployed with GitHub Pages for the React frontend and Railway for the Spring Boot backend and MySQL database.

- Frontend: [GitHub Pages](https://almaazkhan07.github.io/stockwise-360/)
- Backend: [Railway](https://stockwise-360-backend-production.up.railway.app/api/health)
- Database: Railway MySQL

See [DEPLOYMENT.md](DEPLOYMENT.md) for the exact GitHub Pages workflow and backend environment variables.
