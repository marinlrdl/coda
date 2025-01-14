import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/auth';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import NewOrder from './pages/NewOrder';
import OrderDetails from './pages/OrderDetails';
import AdminUsers from './pages/AdminUsers';
import FreelancerManagement from './pages/admin/FreelancerManagement';
import ProjectManagement from './pages/admin/ProjectManagement';

function App() {
  const { loadProfile, loading, initialized } = useAuthStore();

  React.useEffect(() => {
    if (!initialized) {
      loadProfile();
    }
  }, [loadProfile, initialized]);

  if (loading && !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/orders/new" element={<NewOrder />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/freelancers" element={<FreelancerManagement />} />
          <Route path="/admin/projects" element={<ProjectManagement />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <Toaster position="top-right" />
    </Router>
  );
}

export default App; // Add this default export
