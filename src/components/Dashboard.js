import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Dashboard = ({ user }) => {
  const [clientCount, setClientCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, reportsRes] = await Promise.all([
          axios.get('/clients'),
          axios.get('/reports')
        ]);
        setClientCount(clientsRes.data.length);
        setReportCount(reportsRes.data.length);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="dashboard-container">
      <h2>Welcome, {user?.username}</h2>
      <p className="role-badge">{user?.role}</p>
      
      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Clients</h3>
          <p className="stat-value">{clientCount}</p>
          <Link to="/clients" className="stat-link">View Clients</Link>
        </div>
        
        <div className="stat-card">
          <h3>Reports Generated</h3>
          <p className="stat-value">{reportCount}</p>
          <Link to="/report-history" className="stat-link">View History</Link>
        </div>
      </div>
      
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <Link to="/clients/add" className="action-btn">
            Add New Client
          </Link>
          <Link to="/reports" className="action-btn">
            Generate Report
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;