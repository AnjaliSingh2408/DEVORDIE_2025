import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import Scanner from './pages/Scanner';

function App() {
  return (
    <Router>
      {/* Tailwind Dark Background applied to the whole app */}
      <div className="min-h-screen bg-slate-950">
        <nav className="p-4 bg-slate-900 border-b border-slate-800 flex justify-center space-x-8">
          <Link to="/admin" className="text-slate-300 hover:text-white font-bold transition-colors">ADMIN PANEL</Link>
          <Link to="/scan" className="text-slate-300 hover:text-blue-400 font-bold transition-colors">SECURE SCANNER</Link>
        </nav>

        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/scan" element={<Scanner />} />
          <Route path="/" element={<AdminDashboard />} /> {/* Default to Admin */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;