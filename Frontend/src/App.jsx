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
import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'

function AppContent() {
  const location = useLocation();
  const { user, loading } = useContext(AuthContext);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const isLoginPage = location.pathname === '/login';

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  const sidebarWidth = isCollapsed ? '70px' : '250px';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {!isLoginPage && user && (
        <Sidebar 
          isCollapsed={isCollapsed} 
          toggleCollapse={() => setIsCollapsed(!isCollapsed)} 
        />
      )}
      <main style={{ 
        flex: 1, 
        marginLeft: (!isLoginPage && user) ? sidebarWidth : '0', 
        transition: 'margin-left 0.3s ease',
        width: (!isLoginPage && user) ? `calc(100% - ${sidebarWidth})` : '100%'
      }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
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
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute adminOnly={true}>
                <Reports />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
