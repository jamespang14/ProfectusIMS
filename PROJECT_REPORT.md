# Project Report: ProfectusIMS

## 1. Project Overview
ProfectusIMS is a full-stack Inventory Management System designed to demonstrate a robust, scalable, and user-friendly solution for managing stock, users, and alerts. It features a modern, responsive frontend and a high-performance backend with role-based access control.

## 2. Key Design & Implementation Decisions

### **Backend Architecture (FastAPI)**
*   **Why FastAPI?** I chose **FastAPI** over alternatives like Flask or Django for several key reasons:
    *   **Performance:** It is built on Starlette and Pydantic, offering performance comparable to Node.js and Go.
    *   **Type Safety:** Heavy reliance on Python 3.6+ type hints reduces bugs and improved developer experience with excellent IDE support.
    *   **Async Support:** Native support for asynchronous programming allowing for high concurrency, essential for future real-time features.
    *   **Auto-Documentation:** Automatic generation of Swagger/OpenAPI documentation (accessible at `/docs`) which streamlines API testing and frontend integration.

*   **Authentication & Security:**
    *   Implemented **OAuth2** with **JWT (JSON Web Tokens)** for stateless authentication, allowing the backend to scale horizontally without server-side session storage. 
    *   **BCrypt** is used for password hashing, a standard for securing user credentials.
    *   **Dependency Injection:** Used FastAPI's powerful DI system to manage database sessions and enforce authentication/authorization rules (RBAC) cleanly across endpoints.

### **Frontend Architecture (React + Vite)**
*   **Why React & Vite?**
    *   **React:** Chosen for its component-based architecture which promotes reusability (e.g., `StatCard`, `ProtectedRoute`). The ecosystem is vast, providing robust libraries for routing and charts.
    *   **Vite:** Used as the build tool instead of CRA for its significantly faster dev server start times and Hot Module Replacement (HMR), improving the development loop.

*   **Design Aesthetics (Glassmorphism):**
    *   I aimed for a "premium" feel rather than a standard admin dashboard look. 
    *   **Visuals:** Utilized semi-transparent backgrounds with backdrop filters (`backdrop-filter: blur`), extensive use of gradients, and subtle hover animations to create depth and a modern interface.
    *   **Responsiveness:** Native CSS Grid and Flexbox were used to ensure the layout adapts seamlessly from desktop to mobile screens.
    *   **Dark Mode:** A dark-themed palette was chosen to reduce eye strain and modernize the UI.

### **Database Schema Design (SQLAlchemy)**
The database was designed with normalization and integrity in mind. Key relationships include:

*   **User (`users`):** Stores credentials and roles. The `role` enum (`admin`, `manager`, `viewer`) drives the RBAC logic.
*   **Item (`items`):** The core entity. Contains `quantity`, `price`, `category`, and timestamps.
*   **AuditLog (`audit_logs`):** A critical component for accountability.
    *   **Polymorphic-style Design:** Can link to either an `ITEM` or a `USER` via `entity_type` and `entity_id`. 
    *   Tracks the `action` (CREATE, UPDATE, DELETE), the actor (`user_id`), and a timestamp, providing a complete history of changes.
*   **Alert (`alerts`):** Manages system notifications (Low Stock, Manual). Logs who created it and who resolved it (`resolved_by`), closing the loop on inventory issues.

### **DevOps & Reliability**
*   **Containerization:** The entire stack (Frontend + Backend) is containerized using **Docker** and orchestrated with **Docker Compose**, ensuring that "it works on my machine" translates to production.
*   **Testing:** **Pytest** is used for backend testing, specifically validating the Reports API and security permissions to prevent regression.

## 3. Features Completed

### ✅ Core Requirements
*   **User Roles via RBAC:**
    *   **Admin:** Full system control (Manage Users, Inventory, Logs).
    *   **Manager:** Inventory stock management and alerts.
    *   **Viewer:** Read-only access to inventory.
*   **Inventory Management:** Full CRUD capabilities for items.
*   **RESTful API:** Well-structured endpoints for all resources.

### 🌟 Bonus Features Achieved
*   **Audit Logging:** Tracks every critical action (Who, What, When) for accountability.
*   **Monthly Reports API:** Dedicated endpoint aggregating stats, trends, and category breakdowns.
*   **Interactive Dashboard:** Visualizes data with dynamic charts (Inventory Levels, Value Distribution).
*   **Bulk Operations:** CSV upload functionality for batch inventory updates.
*   **Email Alerts:** Automated SMTP notifications for low-stock items.

### 🚀 Additional Enhancements
*   **Search & Filtering:** Server-side pagination and search for high-volume data.
*   **Unit Testing:** Automated test suite for backend RBAC logic.
*   **Secure Password Hashing:** Uses **BCrypt** for storing credentials securely.

## 4. Future Roadmap

*   **Real-Time Updates:** Implement WebSockets to push inventory changes to clients instantly without refreshing.
*   **Cloud Integration:** Deploy to AWS/Azure with a managed PostgreSQL database and S3 for file storage.
*   **Mobile Application:** Develop a Flutter companion app for barcode scanning and on-the-go management.
*   **AI Forecasting:** Integrate ML models to predict stock depletion and automate reordering.
*   **Unit test coverage:** Increase unit test coverage.
*   **Crash reporting:** Implement crash reporting to identify and fix issues e.g. Sentry.
