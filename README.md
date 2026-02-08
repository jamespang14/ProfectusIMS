# ProfectusIMS

Inventory Management System built with React (Vite) and FastAPI (Python).

## Prerequisites

- **Docker** (Recommended for easiest setup)
- **Node.js** (v18+) & **npm** (for manual setup)
- **Python** (v3.9+) (for manual setup)

---

## 🚀 Quick Start (Docker)

The easiest way to run the application is using Docker Compose.

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd ProfectusIMS
    ```

2.  **Configure Environment**:
    - Copy the backend environment template:
      ```bash
      cp Backend/.env.template Backend/.env
      ```
    - Edit `Backend/.env` and add your SMTP credentials (optional, for email alerts) and `SECRET_KEY`.

3.  **Run with Docker Compose**:
    ```bash
    docker-compose up --build
    ```
    The application comes with a pre-populated demo database (`Backend/sql_app.db`).

4.  **Access the Application**:
    - Frontend: `http://localhost`
    - Backend API Docs: `http://localhost:8000/docs`

---

## 🛠 Manual Setup

If you prefer to run the application without Docker, follow these steps.

### Backend Setup

1.  Navigate to the `Backend` directory:
    ```bash
    cd Backend
    ```

2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4.  Configure Environment:
    - Create a `.env` file based on `.env.template`.
    - Ensure `ALLOWED_ORIGINS` includes your frontend URL (e.g., `http://localhost:5173`).

5.  Initialize the Database:
    ```bash
    python init_db.py
    ```

6.  Run the Server:
    ```bash
    uvicorn app.main:app --reload
    ```
    The backend will run at `http://127.0.0.1:8000`.

### Frontend Setup

1.  Navigate to the `Frontend` directory:
    ```bash
    cd Frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the Development Server:
    ```bash
    npm run dev
    ```
    The frontend will run at `http://localhost:5173`.

---

## 🔑 Default Credentials

The system is initialized with the following default users:

| Role    | Email                | Password | Permissions                                   |
| :------ | :------------------- | :------- | :-------------------------------------------- |
| **Admin**   | `admin@example.com`   | `admin`  | Full access (Manage Users, Items, Alerts, Logs) |
| **Manager** | `manager@example.com` | `manager`| Manage Items & Alerts                         |
| **Viewer**  | `viewer@example.com`  | `viewer` | Read-only access                              |

---

## ⚙️ Configuration

### Token Expiration
The JWT token expiration time can be configured in `Backend/.env`:
```env
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### SMTP Email Alerts
To enable email notifications for alerts, configure the following in `Backend/.env`:
```env
SMTP_SERVER=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your_email@example.com
SMTP_PASSWORD=your_password
ALERT_RECEIVER_EMAIL=receiver@example.com
```
