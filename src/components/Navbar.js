import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">BERWA HOUSING</Link>
      </div>
      
      <div className="navbar-links">
        <Link to="/clients">Clients</Link>
        <Link to="/reports">Reports</Link>
        <Link to="/report-history">Report History</Link>
      </div>
      
      <div className="navbar-user">
        <span>Welcome, {user?.username}</span>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;