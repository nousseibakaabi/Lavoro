import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // Récupérer le token depuis l'URL
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/users/resetpassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Password successfully changed!');
        setError('');
        // Rediriger vers la page de connexion après un délai
        setTimeout(() => {
          navigate('/auth');
        }, 1000); // Redirection après 1 seconde
      } else {
        setError(data.error || 'An error occurred while resetting your password.');
      }
    } catch (err) {
      setError('An error occurred while resetting your password.');
      console.error('Error:', err);
    }
  };

  return (
    <div>
      <h1>Reset Password</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <form onSubmit={handleSubmit}>
        <input type="hidden" name="token" value={token} />
        <label>New Password:</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <label>Confirm Password:</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
};

export default ResetPassword;