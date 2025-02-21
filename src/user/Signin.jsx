import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import eye icons
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import the useNavigate hook for redirecting

function SignIn() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                const response = await axios.get('http://localhost:3000/users/me', { withCredentials: true });
                if (response.data) {
                    // User is already logged in, redirect to home page
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
                withCredentials: true, // Make sure to include cookies
            });

            alert('Sign-in successful!');
            navigate('/home'); // Redirect to home page after login
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred during sign-in.');
        }
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
                        type={showPassword ? "text" : "password"} // Toggle between text and password
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <span
                        className="eye-icon"
                        onClick={() => setShowPassword(!showPassword)} // Toggle password visibility
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />} {/* Toggle between eye and eye-slash icons */}
                    </span>
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <a href="#">Forgot your password?</a>
                <button type="submit">Sign In</button>
            </form>
        </div>
    );
}

export default SignIn;