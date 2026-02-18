# User Management System

Full CRUD web app using Node.js + Express + PostgreSQL.

---

## Requirements

- [Node.js](https://nodejs.org) (v18+)
- [PostgreSQL](https://www.postgresql.org/download/) with pgAdmin (or any local Postgres instance)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the database connection

Edit the `.env` file in the project root and fill in your PostgreSQL credentials:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_password_here
PORT=3000
```

> The app will automatically create the `users` table and seed 10 default users the first time it runs.

### 3. Start the server

```bash
node app.js
```

or

```bash
npm start
```

### 4. Open the app

Visit [http://localhost:3000](http://localhost:3000)

---

## Features

- View all users (ID, First Name, Last Name, Email, Age)
- Add a new user
- Edit an existing user
- Delete a user
- Sort by any column (ascending / descending)
- Search by first name or last name
