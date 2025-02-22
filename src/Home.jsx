import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

function Home() {
    const [userInfo, setUserInfo] = useState(null);
    const navigate = useNavigate(); // Hook for redirecting to a different page

    useEffect(() => {
    const fetchUserInfo = async () => {
        try {
            const response = await axios.get('http://localhost:3000/users/me', { withCredentials: true });
            if (response.data) {
                setUserInfo(response.data); // Set the user info if authenticated
            } else {
                // Redirect to login page if user is not authenticated
                navigate('/auth');
            }
        } catch (err) {
            // If there's an error (e.g., user is not authenticated), redirect to sign-in page
            navigate('/auth');
        }
    };

    fetchUserInfo();
}, [navigate]);

    const handleLogout = async () => {
        try {
            // Send a request to the backend to log out
            await axios.post('http://localhost:3000/users/logout', {}, { withCredentials: true });
            // Redirect to the sign-in page after logging out
            navigate('/auth');
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    if (!userInfo) {
        return <p>Loading...</p>;
    }

    return (
<div className="home-container">
    <h1 className="home-title">Welcome to LAVORO</h1>
    <div className="home-grid">
        <div className="home-profile">
            <img src={`http://localhost:3000${userInfo.image}`} alt="Profile" />
        </div>
        <div className="home-user-info">
            <h3>First Name: <span>{userInfo.firstName}</span></h3>
            <h3>Last Name: <span>{userInfo.lastName}</span></h3>
            <h3>Email: <span>{userInfo.email}</span></h3>
            <h3>Phone number: <span>{userInfo.phone_number}</span></h3>

            <div className="home-buttons">
                <a className="home-btn-primary" onClick={handleLogout}>Log Out</a>
                <a className="home-btn-primary home-btn-outline">Profile</a>
            </div>
        </div>
    </div>
</div>
    );
}

export default Home;
