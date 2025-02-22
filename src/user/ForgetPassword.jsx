import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || ''); // Récupérer l'email depuis l'état de navigation
  const [showPopup, setShowPopup] = useState(false);
  const [error, setError] = useState('');

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3000/users/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log('Server response:', data); // Log la réponse du serveur

      if (response.ok) {
        setShowPopup(true); // Afficher la pop-up
        setError('');
      } else {
        setError(data.error || 'An error occurred');
      }
    } catch (err) {
      setError("An error occurred while sending the email.");
      console.error('Error:', err); // Log l'erreur
    }
  };

  return (
    <div>
      <h1>Forgot Password</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleForgotPassword}>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Reset Password</button>
      </form>

      {/* Pop-up */}
      {showPopup && (
        <div style={popupStyle}>
          <p>✅ Check your email for the reset link!</p>
          <button onClick={() => navigate('/auth')}>OK</button> {/* Rediriger vers la page SignIn */}
        </div>
      )}
    </div>
  );
};

// Style pour la pop-up
const popupStyle = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  background: 'white',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  textAlign: 'center',
  zIndex: 1000,
};

export default ForgotPassword;