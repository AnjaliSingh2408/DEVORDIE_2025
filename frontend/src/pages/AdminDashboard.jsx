import React, { useState } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';

const AdminDashboard = () => {
  const [formData, setFormData] = useState({ name: '', role: '', email: '' });
  const [qrToken, setQrToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setQrToken(null);
    setMessage('');

    try {
      const res = await axios.post('http://localhost:3000/create-identity', formData);
      setQrToken(res.data.token);
      setMessage(`Success: Identity Secured for ${res.data.user.name}`);
    } catch (err) {
      setMessage("Error: Could not generate pass. Check Backend Connection.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { padding: '8px', marginBottom: '10px', width: '100%', boxSizing: 'border-box' };
  const buttonStyle = { padding: '10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', cursor: 'pointer', width: '100%' };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#007bff' }}>HQ Identity Generator</h2>
      
      <form onSubmit={handleGenerate}>
        <input 
            type="text" 
            name="name" 
            onChange={handleChange}
            required
            // *** CHANGE THIS LINE ***
            className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-cyan-400 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Ex: Tommy Oliver"
          />
        
        {/* Keeping Email Input for Notification Feature */}
        <input 
          type="email" 
          name="email" 
          onChange={handleChange}
          required
          // *** CHANGE THIS LINE ***
          className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-cyan-400 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          placeholder="ranger@hq.com"
        />

        <select 
          name="role" 
          onChange={handleChange}
          required
          // *** CHANGE THIS LINE ***
          className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-cyan-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
        >
          <option value="">Select Clearance Level</option>
          <option value="Red Ranger">🔴 Red Ranger (Commander)</option>
          <option value="Blue Ranger">🔵 Blue Ranger (Tech)</option>
          <option value="Black Ranger">⚫ Black Ranger (Stealth)</option>
          <option value="Pink Ranger">🩷 Pink Ranger (Rescue)</option>
          <option value="Yellow Ranger">🟡 Yellow Ranger (Combat)</option>
          <option value="Green Ranger">🟢 Green Ranger (Ops)</option>
          <option value="Security Chief">🛡️ Security Chief</option>
          <option value="Zord Mechanic">🔧 Zord Mechanic</option>
          <option value="Medical Staff">⚕️ Medical Staff</option>
        </select>

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Generating..." : "Generate Secure Pass"}
        </button>
      </form>

      {message && <p style={{ color: message.includes('Error') ? 'red' : 'green', marginTop: '15px' }}>{message}</p>}

      {qrToken && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <h3>Scan This Pass:</h3>
          <div style={{ padding: '10px', border: '1px solid #333', display: 'inline-block', backgroundColor: 'white' }}>
            <QRCodeCanvas value={qrToken} size={180} />
          </div>
          <p style={{ fontSize: '10px', color: '#666', marginTop: '10px' }}>TOKEN: {qrToken.substring(0, 15)}...</p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;