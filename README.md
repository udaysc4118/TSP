<div align="center">

# 🛣️ MahaRoute AI — Intelligent Route Optimizer

### *Solving the Travelling Salesman Problem with Dynamic Programming & Greedy Algorithms*

[![Made with JavaScript](https://img.shields.io/badge/Made%20with-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Leaflet](https://img.shields.io/badge/Maps-Leaflet.js-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Express](https://img.shields.io/badge/Server-Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

*A premium, full-stack logistics optimization platform that computes the shortest possible route across multiple cities using advanced TSP algorithms, real-time interactive maps, and a secure authentication system powered by Supabase.*

</div>

---

## 📖 Table of Contents

- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Algorithms Used](#-algorithms-used)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Team](#-team)

---

## 🧠 About the Project

**MahaRoute AI** is a web-based route optimization engine built as a semester project. It tackles the classic **Travelling Salesman Problem (TSP)** — *given a list of cities and the distances between each pair, find the shortest possible route that visits every city exactly once and returns to the starting point.*

The platform allows users to:
1. Search and select any cities/villages worldwide using **OpenStreetMap Nominatim** geocoding
2. Compute **Optimal (DP-based)** and **Greedy** routes side-by-side
3. Visualize both routes on an interactive **Leaflet.js** map with real road distances via **OSRM**
4. Analyze a full **distance matrix**, **SVG graph visualization**, and **segment-by-segment breakdown**
5. Authenticate securely with **email OTP verification** and **JWT tokens**

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🗺️ **Interactive Map** | Leaflet.js powered map with ArcGIS tiles, city markers, and animated route polylines |
| 🔍 **Smart City Search** | Debounced autocomplete using OpenStreetMap Nominatim with city/village type detection |
| ⚡ **Dual Algorithm Comparison** | Side-by-side comparison of Optimal (DP Bitmask) vs Greedy (Nearest Neighbor) routes |
| 📊 **Distance Matrix** | Auto-generated NxN distance matrix using Haversine formula |
| 🛤️ **Real Road Routing** | Actual road distances and durations from OSRM (Open Source Routing Machine) |
| 📈 **SVG Graph Visualization** | Beautiful directed graph diagrams showing route order and edge weights |
| 🔐 **Secure Authentication** | Email + OTP based signup, JWT login, password reset with Nodemailer |
| 🛡️ **Admin Command Center** | Full admin dashboard with user management, analytics, and live chat |
| ☁️ **Cloud Database** | Supabase (PostgreSQL) for persistent user data with automatic local fallback |
| 🌤️ **Weather Integration** | Real-time weather data for route cities |
| 💬 **User-Admin Chat** | Built-in messaging system between users and administrators |

---

## 🔬 Algorithms Used

### 1. Dynamic Programming with Bitmask (Optimal TSP)
```
Time Complexity:  O(n² × 2ⁿ)
Space Complexity: O(n × 2ⁿ)
```
- Uses **Held-Karp algorithm** approach
- Explores all possible subsets using bitmask representation
- Guarantees the globally optimal (shortest) route
- Practical for up to ~15-18 cities

### 2. Greedy / Nearest Neighbor (Heuristic TSP)
```
Time Complexity:  O(n²)
Space Complexity: O(n)
```
- Starts from the selected origin city
- Always visits the nearest unvisited city next
- Fast approximation, typically within 20-25% of optimal
- Works efficiently for any number of cities

### 3. Haversine Formula (Distance Computation)
```
d = 2R × arcsin(√(sin²(Δlat/2) + cos(lat₁)·cos(lat₂)·sin²(Δlon/2)))
```
- Computes great-circle (aerial) distance between two GPS coordinates
- Used as the base metric for the distance matrix

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **HTML5 / CSS3** | Semantic structure & premium dark-theme UI |
| **Vanilla JavaScript** | Core logic, TSP algorithms, DOM manipulation |
| **Leaflet.js** | Interactive map rendering |
| **OSRM API** | Real road distance & duration calculation |
| **OpenStreetMap Nominatim** | Geocoding & city search autocomplete |
| **Chart.js** | Admin dashboard analytics charts |
| **Remix Icons** | Modern icon system |
| **Google Fonts (Outfit, Inter)** | Premium typography |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express.js** | REST API server |
| **Supabase (PostgreSQL)** | Cloud database for users, admins, OTPs, messages |
| **bcrypt / bcryptjs** | Secure password hashing |
| **JSON Web Tokens (JWT)** | Stateless session authentication |
| **Nodemailer** | OTP email dispatch (Ethereal for dev, Gmail for production) |
| **dotenv** | Environment variable management |

---

## 📁 Project Structure

```
TSP/
├── index.html              # Main map workspace (route optimizer)
├── login.html              # Authentication page (signup, login, admin, forgot password)
├── admin.html              # Admin command center dashboard
├── assets/
│   ├── css/
│   │   ├── global.css      # Design system tokens & shared styles
│   │   ├── app.css         # Map workspace styles
│   │   ├── login.css       # Authentication page styles
│   │   └── admin.css       # Admin dashboard styles
│   └── js/
│       ├── app.js          # Core TSP algorithms, map logic, route rendering
│       ├── auth.js         # Authentication handlers (signup, login, OTP, admin)
│       ├── admin.js        # Admin panel logic (user CRUD, analytics, chat)
│       ├── user-chat.js    # User-side live chat system
│       └── weather.js      # Weather data integration
├── banner/                 # Hero images for UI
├── login page image/       # Visual assets for login page
└── README.md
```

### Backend (Separate Deployment)
```
backend/
├── server.js               # Express API (1200+ lines — auth, admin, chat, AI routes)
├── .env                    # Supabase credentials, JWT secret, SMTP config
├── local_db.json           # Offline fallback JSON database
├── supabase_schema.sql     # Database bootstrap schema
├── package.json
└── node_modules/
```

---

## 📸 Screenshots

### 🗺️ Route Optimizer Workspace
> Interactive map with city waypoints, dual route visualization (Optimal vs Greedy), distance matrix, and SVG graph analysis.

### 🔐 Secure Login Portal
> Premium split-screen authentication with signup (email OTP), login, admin gateway, and password reset flows.

### 📊 Admin Command Center
> Real-time system telemetry dashboard with user management, analytics charts, and admin-user messaging.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ installed
- **npm** package manager
- A **Supabase** project (free tier works fine)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/udaysc4118/TSP.git
   cd TSP
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**
   
   Create a `.env` file inside the `backend/` folder:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key-here
   PORT=5000
   JWT_SECRET=your-super-secret-jwt-key
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

4. **Setup Supabase Database**
   
   Run the `supabase_schema.sql` file in your Supabase SQL Editor to create all required tables.

5. **Start the Server**
   ```bash
   node server.js
   ```

6. **Open in Browser**
   ```
   http://localhost:5000/login.html
   ```

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Supabase anon/public API key |
| `PORT` | Server port (default: 5000) |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `SMTP_USER` | Gmail address for sending OTP emails |
| `SMTP_PASS` | Gmail App Password (16-character) |

> **Note:** If Supabase credentials are missing, the backend automatically falls back to a local JSON file database for offline development.

---

## 🗄️ Database Schema

```sql
-- Users table (registration & authentication)
CREATE TABLE public.users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at TIMESTAMPTZ
);

-- Admins table
CREATE TABLE public.admins (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id      TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OTP verification codes
CREATE TABLE public.otps (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email      TEXT NOT NULL,
    otp        TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User-Admin messaging
CREATE TABLE public.messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT NOT NULL,
    user_name   TEXT,
    user_email  TEXT,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
    message     TEXT NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup-request` | Request signup OTP via email |
| `POST` | `/api/auth/signup-verify` | Verify OTP and create account |
| `POST` | `/api/auth/resend-otp` | Resend OTP code |
| `POST` | `/api/auth/login` | User login (returns JWT) |
| `POST` | `/api/auth/forgot-password` | Request password reset OTP |
| `POST` | `/api/auth/reset-password` | Reset password with OTP |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/login` | Admin authentication |
| `GET` | `/api/admin/users` | List all registered users |
| `PUT` | `/api/admin/users/:id` | Update user details |
| `DELETE` | `/api/admin/users/:id` | Delete a user |
| `PUT` | `/api/admin/users/:id/toggle` | Activate/deactivate user |

### Messaging
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/messages/:userId` | Get chat messages |
| `POST` | `/api/messages` | Send a message |

### Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health check |

---

## 👥 Team

| Name | Role |
|---|---|
| **Uday Chaudhari** | Full-Stack Developer & Project Lead |

---

<div align="center">

### ⭐ If you found this project helpful, consider giving it a star!

*Built with ❤️ for Semester Project — 2026*

</div>
