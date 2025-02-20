import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import './Signup.css'; // Custom CSS for additional styling
import { FaCamera } from 'react-icons/fa'; // Import camera icon from react-icons

function Signup() {
    // State for form fields
    const [firstName, setFirst] = useState("");
    const [lastName, setLast] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phoneNumber, setPhone] = useState("");
    const [image, setImage] = useState(null); // State for the uploaded image
    const [imagePreview, setImagePreview] = useState(null); // State for image preview
    const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 }); // State for image position
    const [error, setError] = useState("");

    // Ref for file input
    const fileInputRef = useRef(null);

    // State for password validation
    const [passwordRequirements, setPasswordRequirements] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
    });

    // State for suggested passwords
    const [suggestedPasswords, setSuggestedPasswords] = useState([]);

    // Generate random passwords on component mount
    useEffect(() => {
        generateSuggestedPasswords();
    }, []);

    // Function to generate random passwords
    const generateSuggestedPasswords = () => {
        const passwords = [];
        for (let i = 0; i < 3; i++) {
            passwords.push(generateRandomPassword());
        }
        setSuggestedPasswords(passwords);
    };

    // Function to generate a single random password
    const generateRandomPassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

    // Function to validate password
    const validatePassword = (password) => {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*]/.test(password),
        };
        setPasswordRequirements(requirements);
        return Object.values(requirements).every((val) => val);
    };

    // Function to validate email
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Function to validate phone number
    const validatePhoneNumber = (phoneNumber) => {
        const minLength = 8;
        const numericRegex = /^[0-9]+$/;
        return (
            phoneNumber.length >= minLength &&
            numericRegex.test(phoneNumber) &&
            !/^0+$/.test(phoneNumber)
        );
    };

    // Function to handle image upload
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Function to trigger file input click
    const handleImageClick = () => {
        fileInputRef.current.click();
    };

    // Function to handle image position adjustment
    const handleImagePositionChange = (e) => {
        const { clientX, clientY, currentTarget } = e;
        const rect = currentTarget.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;
        setImagePosition({ x, y });
    };

    // Function to handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form fields
        if (!firstName || !lastName || !email || !password || !phoneNumber) {
            setError("All fields are required.");
            return;
        }

        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!validatePassword(password)) {
            setError("Password does not meet the requirements.");
            return;
        }

        if (!validatePhoneNumber(phoneNumber)) {
            setError("Please enter a valid phone number.");
            return;
        }

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('firstName', firstName);
        formData.append('lastName', lastName);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('phone_number', phoneNumber);
        if (image) {
            formData.append('image', image); // Append the image file
        }

        // Submit form data to the backend
        try {
            const response = await axios.post('http://localhost:3000/users/signup', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Required for file upload
                },
            });
            console.log(response.data);
            alert("User registered successfully. Please check your email for verification.");
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || "An error occurred during signup.");
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-4">
                    <div className="card shadow">
                        <div className="card-body">
                            <h2 className="card-title text-center mb-4">Sign Up</h2>
                            {error && <div className="alert alert-danger">{error}</div>}
                            <form onSubmit={handleSubmit}>
                                {/* Image Upload */}
                                <div className="mb-3 text-center">
                                    <div
                                        className="image-upload-container"
                                        onClick={handleImageClick}
                                        onMouseMove={handleImagePositionChange}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Profile Preview"
                                                className="profile-image"
                                                style={{
                                                    objectPosition: `${imagePosition.x}% ${imagePosition.y}%`,
                                                }}
                                            />
                                        ) : (
                                            <div className="camera-icon">
                                                <FaCamera size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        id="image"
                                        name="image"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={{ display: 'none' }}
                                    />
                                </div>

                                {/* First Name */}
                                <div className="mb-3">
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="firstName"
                                        placeholder="First Name"
                                        value={firstName}
                                        onChange={(e) => setFirst(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Last Name */}
                                <div className="mb-3">
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="lastName"
                                        placeholder="Last Name"
                                        value={lastName}
                                        onChange={(e) => setLast(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Email */}
                                <div className="mb-3">
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Password */}
                                <div className="mb-3">
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            validatePassword(e.target.value);
                                        }}
                                        required
                                    />
                                    <div className="mt-2">
                                        <p>Password must meet the following requirements:</p>
                                        <ul>
                                            <li className={passwordRequirements.length ? 'valid' : 'invalid'}>
                                                At least 8 characters long
                                            </li>
                                            <li className={passwordRequirements.uppercase ? 'valid' : 'invalid'}>
                                                At least one uppercase letter (A-Z)
                                            </li>
                                            <li className={passwordRequirements.lowercase ? 'valid' : 'invalid'}>
                                                At least one lowercase letter (a-z)
                                            </li>
                                            <li className={passwordRequirements.number ? 'valid' : 'invalid'}>
                                                At least one number (0-9)
                                            </li>
                                            <li className={passwordRequirements.special ? 'valid' : 'invalid'}>
                                                At least one special character (!@#$%^&*)
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Phone Number */}
                                <div className="mb-3">
                                    <input
                                        type="number"
                                        className="form-control"
                                        id="phoneNumber"
                                        placeholder="Phone Number"
                                        value={phoneNumber}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Submit Button */}
                                <button type="submit" className="btn btn-primary w-100 mb-3">
                                    Create Account
                                </button>

                                {/* Link to Sign In Page */}
                                <div className="text-center">
                                    <p>Already have an account? <Link to="/login">Sign In</Link></p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Signup;


