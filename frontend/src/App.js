import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import Scanner from './pages/Scanner';

function App() {
  return (
    <Router>
      <div>
        {/* Simple Navigation Bar */}
        <nav style={{padding: '10px', background: '#333', color: 'white', marginBottom: '20px'}}>
          <Link to="/admin" style={{marginRight: '15px', color: 'white'}}>Admin Panel</Link>
          <Link to="/scan" style={{color: 'white'}}>Scanner</Link>
        </nav>

        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/scan" element={<Scanner />} />
          <Route path="/" element={<div style={{textAlign: 'center', marginTop: '50px'}}>
            <h1>Welcome to Ranger HQ</h1>
            <p>Select a portal from the menu above.</p>
          </div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;