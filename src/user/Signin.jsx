import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function SignIn() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                const response = await axios.get('http://localhost:3000/users/me', { withCredentials: true });
                if (response.data) {
                    navigate('/home');
                }
            } catch (err) {
                // Not authenticated, stay on the sign-in page
            }
        };

        checkAuthentication();
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('http://localhost:3000/users/signin', formData, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true,
            });

            alert('Sign-in successful!');
            navigate('/home');
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred during sign-in.');
        }
    };

    // Fonction pour gérer le clic sur "Forgot your password?"
    const handleForgotPassword = () => {
        navigate('/forgot-password', { state: { email: formData.email } }); // Passer l'email à la page ForgotPassword
    };

    return (
        <div className="form-container sign-in-container">
            <form onSubmit={handleSubmit}>
                <h1>Sign in</h1>
                <div className="social-container">
                    <a href="#" className="social"><i className="fab fa-facebook-f"></i></a>
                    <a href="#" className="social"><i className="fab fa-google-plus-g"></i></a>
                    <a href="#" className="social"><i className="fab fa-linkedin-in"></i></a>
                </div>
                <span>or use your account</span>
                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                <div className="password-container">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <span
                        className="eye-icon"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {/* Lien pour "Forgot your password?" */}
                <span onClick={handleForgotPassword} style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}>
  Forgot your password?
</span>
                <button type="submit">Sign In</button>
            </form>
        </div>
    );
}

export default SignIn;