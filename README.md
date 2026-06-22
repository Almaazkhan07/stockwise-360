# StockWise 360 Inventory System

StockWise 360 is a full-stack inventory and business management app built from the setup guide in this folder.

## Stack

- Backend: Spring Boot 3, Java 17, Spring Security, JWT, Spring Data JPA
- Frontend: React 18, Vite, Tailwind CSS, Recharts
- Database: MySQL 8

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

## Hosting

The project is GitHub-ready. GitHub Pages can host the React frontend, but it cannot run the Spring Boot backend or MySQL database.

Use:

- GitHub Pages for `frontend/`
- Render, Railway, Fly.io, VPS, or similar for `backend/`
- Hosted MySQL for production data

See [DEPLOYMENT.md](DEPLOYMENT.md) for the exact GitHub Pages workflow and backend environment variables.
