import React, { useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import AuthContext from './context/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Items from './pages/Items'
import Users from './pages/Users'
import Alerts from './pages/Alerts'
import AuditLogs from './pages/AuditLogs'

function AppContent() {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const isLoginPage = location.pathname === '/login';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {!isLoginPage && user && <Sidebar />}
      <main style={{ 
        flex: 1, 
        marginLeft: (!isLoginPage && user) ? '250px' : '0', 
        transition: 'margin-left 0.3s ease' 
      }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/items" 
            element={
              <ProtectedRoute>
                <Items />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute adminOnly={true}>
                <Users />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/alerts" 
            element={
              <ProtectedRoute>
                <Alerts />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/audit-logs" 
            element={
              <ProtectedRoute adminOnly={true}>
                <AuditLogs />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/items" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
