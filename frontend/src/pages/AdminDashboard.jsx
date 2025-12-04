import React, { useState } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';

const AdminDashboard = () => {
  // Added 'email' to state because backend expects it now
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
    setMessage('');
    setQrToken(null);

    try {
      // Sending Name, Role, AND Email to backend
      const res = await axios.post('http://localhost:3000/create-identity', formData);
      
      setQrToken(res.data.token); // Store the signed token string
      setMessage(`✅ Success! Pass generated for ${res.data.user.name}. Valid for 2 Days.`);
    } catch (err) {
      console.error(err);
      setMessage("❌ Error: Could not generate pass. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={{color: '#333'}}>HQ Identity Generator</h2>
      
      <form onSubmit={handleGenerate} style={styles.form}>
        <input 
          type="text" 
          name="name" 
          placeholder="Ranger Name" 
          required 
          onChange={handleChange} 
          style={styles.input}
        />
        
        {/* NEW: Email Input for Notifications */}
        <input 
          type="email" 
          name="email" 
          placeholder="Ranger Email (for Expiry Alerts)" 
          required 
          onChange={handleChange} 
          style={styles.input}
        />

        <select name="role" required onChange={handleChange} style={styles.input}>
          <option value="">Select Role</option>
          <option value="Red Ranger">Red Ranger</option>
          <option value="Blue Ranger">Blue Ranger</option>
          <option value="Security Chief">Security Chief</option>
        </select>

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Secure Pass'}
        </button>
      </form>

      {message && <p style={{marginTop: '15px', fontWeight: 'bold'}}>{message}</p>}

      {qrToken && (
        <div style={styles.qrContainer}>
          <h3>Official Digital Pass</h3>
          <p style={{fontSize: '12px', color: '#666'}}>Scan this at the entry gate</p>
          
          <div style={{background: 'white', padding: '10px', display: 'inline-block'}}>
            <QRCodeCanvas value={qrToken} size={200} />
          </div>
          
          <p style={styles.tokenText}>
            Token Signature: {qrToken.substring(0, 20)}...
          </p>
        </div>
      )}
    </div>
  );
};

// Simple Styles
const styles = {
  container: { maxWidth: '500px', margin: '40px auto', textAlign: 'center', fontFamily: 'Arial, sans-serif' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '12px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' },
  button: { padding: '12px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer' },
  qrContainer: { marginTop: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '10px', border: '2px dashed #ccc' },
  tokenText: { fontSize: '10px', color: '#999', marginTop: '10px', wordBreak: 'break-all' }
};

export default AdminDashboard;