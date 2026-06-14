# Energizer Sport

A full-stack e-commerce app for a sports supplement store, with an admin panel to manage products, users, and orders.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js |
| Database | MySQL |
| Frontend | HTML5, Bootstrap 4.5, Vanilla JavaScript |
| Auth | bcrypt, express-session |
| File uploads | express-fileupload |
| Config | dotenv |

## Features

- Responsive product grid with images and prices
- Live search with autocomplete and keyboard navigation
- Guest browsing — cart requires login
- Cart saved in `localStorage`
- Checkout with payment method and order notes
- Order history at `/orders`
- User registration and login with bcrypt
- Navbar adapts to login state and role
- Admin panel — CRUD for products, user management, order viewer
- Role-based access (`customer` / `admin`) enforced server-side
- Post-login redirect to the original page

## Getting Started

### Prerequisites

- Node.js v16+
- MySQL

### Installation

**1. Clone the repo**
```bash
git clone https://github.com/YazeedDev-3/energizer-sport-store.git
cd energizer-sport
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=energizersport
PORT=5000
SESSION_SECRET=replace_with_a_long_random_string
```

**4. Set up the database**
```bash
mysql -u root -p < schema.sql
```

Creates `users`, `products`, and `orders` tables with sample data and two default accounts.

**5. Start the server**
```bash
npm start
```

Go to [http://localhost:5000](http://localhost:5000).

## Project Structure

```
├── server.js
├── schema.sql
├── .env.example
├── .env
├── home.html
├── login.html
├── register.html
├── our-products.html
├── search.html
├── cart.html
├── buy.html
├── orders.html
├── manage.html
└── img_project_web1/
```

## API Reference

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/session` | — | Session state |
| GET | `/process_index` | — | List all products |
| GET | `/process_detail` | — | Get one product by title |
| GET | `/api/products/search` | — | Autocomplete search |
| POST | `/process_insert` | Admin | Add a product |
| PUT | `/process_update` | Admin | Update a product |
| DELETE | `/process_delete` | Admin | Delete a product |
| POST | `/process_registration` | — | Register a user |
| POST | `/loginprocess` | — | Login |
| GET | `/logout` | — | Logout |
| POST | `/process_buy` | Login | Submit an order |
| GET | `/api/my-orders` | Login | Current user's orders |
| GET | `/api/admin/users` | Admin | List all users |
| POST | `/api/admin/users` | Admin | Create a user |
| DELETE | `/api/admin/users/:id` | Admin | Delete a user |
| PUT | `/api/admin/users/:id/role` | Admin | Toggle user role |
| GET | `/api/admin/orders` | Admin | All orders |

## Default Accounts

| Role | Username | Password |
|---|---|---|
| Customer | `user` | `password123` |
| Admin | `admin` | `password123` |
