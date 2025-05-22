import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Import Components
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import ClientList from './components/ClientList';
import ClientForm from './components/ClientForm';
import Reports from './components/Reports';
import ReportHistory from './components/ReportHistory';
import Dashboard from './components/Dashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set axios defaults
  axios.defaults.baseURL = 'http://localhost:5000/api';
  axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Check authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get('/clients');
          setIsAuthenticated(true);
          setUser(response.config.user);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Login function
  const handleLogin = async (credentials) => {
    try {
      const response = await axios.post('/login', credentials);
      localStorage.setItem('token', response.data.token);
      setIsAuthenticated(true);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.error || 'Login failed' };
    }
  };

  // Register function
  const handleRegister = async (userData) => {
    try {
      await axios.post('/register', userData);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.error || 'Registration failed' };
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        {isAuthenticated && <Navbar user={user} onLogout={handleLogout} />}
        
        <div className="container">
          <Routes>
            <Route 
              path="/login" 
              element={
                !isAuthenticated ? 
                  <Login onLogin={handleLogin} /> : 
                  <Navigate to="/" />
              } 
            />
            <Route 
              path="/register" 
              element={
                !isAuthenticated ? 
                  <Register onRegister={handleRegister} /> : 
                  <Navigate to="/" />
              } 
            />
            <Route 
              path="/" 
              element={
                isAuthenticated ? 
                  <Dashboard user={user} /> : 
                  <Navigate to="/login" />
              } 
            />
            <Route 
              path="/clients" 
              element={
                isAuthenticated ? 
                  <ClientList /> : 
                  <Navigate to="/login" />
              } 
            />
            <Route 
              path="/clients/add" 
              element={
                isAuthenticated ? 
                  <ClientForm /> : 
                  <Navigate to="/login" />
              } 
            />
            <Route 
              path="/clients/edit/:id" 
              element={
                isAuthenticated ? 
                  <ClientForm /> : 
                  <Navigate to="/login" />
              } 
            />
            <Route 
              path="/reports" 
              element={
                isAuthenticated ? 
                  <Reports /> : 
                  <Navigate to="/login" />
              } 
            />
            <Route 
              path="/report-history" 
              element={
                isAuthenticated ? 
                  <ReportHistory /> : 
                  <Navigate to="/login" />
              } 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;