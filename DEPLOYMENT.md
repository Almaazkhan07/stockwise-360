# Deploy StockWise 360

## What GitHub Can Host

GitHub can host:

- Your project source code in a GitHub repository.
- The React frontend using GitHub Pages.

GitHub Pages cannot run:

- Spring Boot backend.
- MySQL or XAMPP.

For a fully live app, deploy the backend and database separately, then point the GitHub Pages frontend to that backend URL.

## Recommended Live Setup

- Frontend: GitHub Pages.
- Backend: Render, Railway, Fly.io, VPS, or another Java hosting service.
- Database: Railway MySQL, PlanetScale, Aiven, AWS RDS, or another hosted MySQL database.

## GitHub Pages Frontend

This project includes `.github/workflows/deploy-frontend.yml`.

1. Create a GitHub repository.
2. Push this project to the `main` branch.
3. In GitHub, open the repository settings.
4. Go to **Pages**.
5. Set **Source** to **GitHub Actions**.
6. Go to **Settings > Secrets and variables > Actions > Variables**.
7. Add this repository variable:

```text
VITE_API_URL=https://your-backend-domain.com/api
```

If you do not have a hosted backend yet, GitHub Pages will load the frontend, but login and MySQL-backed data will not work.

## Backend Environment Variables

Do not commit real passwords to GitHub. Use environment variables on your hosting platform:

```text
DB_URL=jdbc:mysql://your-mysql-host:3306/inventory_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=Asia/Kolkata
DB_USERNAME=your_mysql_user
DB_PASSWORD=your_mysql_password
JWT_SECRET=replace_with_a_long_random_secret_for_production
CORS_ALLOWED_ORIGINS=https://your-github-username.github.io
```

For local XAMPP development, you can set these variables in your terminal before running the backend, or keep using your packaged local jar.

## Local Development

Backend:

```bash
cd backend
mvn spring-boot:run
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```
