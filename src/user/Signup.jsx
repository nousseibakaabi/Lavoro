import React, { useState, useRef } from 'react';
import { FaCamera, FaEye, FaEyeSlash } from 'react-icons/fa'; // Import eye icons
import axios from 'axios';

// Import validation functions
import { validatePhoneNumber, validateFirstName, validateLastName, validateEmail } from './validate';

function SignUp() {
    const [firstName, setFirst] = useState("");
    const [lastName, setLast] = useState("");
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [emailAvailable, setEmailAvailable] = useState(null);
    const [password, setPassword] = useState("");
    const [phoneNumber, setPhone] = useState("");
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [error, setError] = useState("");
    const [showRequirements, setShowRequirements] = useState(false);
    const [passwordSuggestions, setPasswordSuggestions] = useState([]);
    const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

    const [fieldErrors, setFieldErrors] = useState({
        firstNameError: "",
        lastNameError: "",
        phoneError: "",
    });

    const fileInputRef = useRef(null);

    const passwordRequirements = [
        { text: "At least 8 characters", regex: /.{8,}/ },
        { text: "At least one uppercase letter", regex: /[A-Z]/ },
        { text: "At least one lowercase letter", regex: /[a-z]/ },
        { text: "At least one number", regex: /[0-9]/ },
        { text: "At least one special character", regex: /[!@#$%^&*(),.?":{}|<>]/ },
    ];

    const [visibleRequirements, setVisibleRequirements] = useState(passwordRequirements);

    const generatePassword = () => {
        const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
        const numberChars = "0123456789";
        const specialChars = "!@#$%^&*()";

        // Ensure at least one character from each category
        const randomUppercase = uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
        const randomLowercase = lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
        const randomNumber = numberChars[Math.floor(Math.random() * numberChars.length)];
        const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)];

        // Combine all characters
        const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;

        // Generate the remaining characters
        let remainingChars = "";
        for (let i = 0; i < 4; i++) {
            remainingChars += allChars[Math.floor(Math.random() * allChars.length)];
        }

        // Combine all parts
        let suggestedPassword = randomUppercase + randomLowercase + randomNumber + randomSpecial + remainingChars;

        // Shuffle the password to avoid predictable patterns
        suggestedPassword = suggestedPassword
            .split('')
            .sort(() => Math.random() - 0.5)
            .join('');

        return suggestedPassword;
    };

    const generatePasswordSuggestions = () => {
        const suggestions = [generatePassword(), generatePassword(), generatePassword()];
        setPasswordSuggestions(suggestions);
    };

    const handlePasswordSuggestionClick = (suggestedPassword) => {
        setPassword(suggestedPassword);
        setVisibleRequirements(passwordRequirements.filter(req => !req.regex.test(suggestedPassword)));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handlePasswordChange = (e) => {
        const input = e.target.value;
        setPassword(input);
        setVisibleRequirements(passwordRequirements.filter(req => !req.regex.test(input)));
    };

    const handleFirstNameChange = (e) => {
        const value = e.target.value;
        setFirst(value);
        setFieldErrors((prev) => ({ ...prev, firstNameError: validateFirstName(value) }));
    };

    const handleLastNameChange = (e) => {
        const value = e.target.value;
        setLast(value);
        setFieldErrors((prev) => ({ ...prev, lastNameError: validateLastName(value) }));
    };

    const handlePhoneNumberChange = (e) => {
        const value = e.target.value;
        setPhone(value);
        setFieldErrors((prev) => ({ ...prev, phoneError: validatePhoneNumber(value) }));
    };

    const checkEmailAvailability = async (email) => {
        if (!email) {
            setEmailAvailable(null);
            return;
        }
        try {
            const response = await axios.get(`http://localhost:3000/users/check-email?email=${email}`);
            setEmailAvailable(!response.data.exists);
        } catch (error) {
            console.error("Error checking email availability:", error);
            setEmailAvailable(null);
        }
    };

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);

        // Validate email before checking availability
        const validationError = validateEmail(value);
        setEmailError(validationError);

        if (!validationError) {
            checkEmailAvailability(value);
        } else {
            setEmailAvailable(null); // Reset availability if email is invalid
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate email before submission
        const emailValidationError = validateEmail(email);
        setEmailError(emailValidationError);

        if (emailValidationError || !emailAvailable) {
            setError("Please enter a valid and available email.");
            return;
        }

        const firstNameError = validateFirstName(firstName);
        const lastNameError = validateLastName(lastName);
        const phoneError = validatePhoneNumber(phoneNumber);

        if (firstNameError || lastNameError || phoneError) {
            setFieldErrors({
                firstNameError,
                lastNameError,
                phoneError,
            });
            return;
        }

        const formData = new FormData();
        formData.append("firstName", firstName);
        formData.append("lastName", lastName);
        formData.append("email", email);
        formData.append("password", password);
        formData.append("phone_number", phoneNumber);
        if (image) formData.append("image", image);

        try {
            await axios.post("http://localhost:3000/users/signup", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            alert("User registered successfully. Please check your email for verification.");
        } catch (err) {
            setError(err.response?.data?.error || "An error occurred during signup.");
        }
    };

    return (
        <div className="form-container sign-up-container">
            <form onSubmit={handleSubmit}>
                <h1>Create Account</h1>
                <div className="social-container">
                    <a href="#" className="social"><i className="fab fa-facebook-f"></i></a>
                    <a href="#" className="social"><i className="fab fa-google-plus-g"></i></a>
                    <a href="#" className="social"><i className="fab fa-linkedin-in"></i></a>
                </div>
                <span>or use your email for registration</span>
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="mb-3 text-center">
                    <div className="image-upload-container" onClick={() => fileInputRef.current.click()}>
                        {imagePreview ? <img src={imagePreview} alt="Profile Preview" className="profile-image" /> : <FaCamera size={24} />}
                    </div>
                    <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                </div>

                <input type="text" placeholder="First Name" value={firstName} onChange={handleFirstNameChange} required />
                {fieldErrors.firstNameError && <div className="error">{fieldErrors.firstNameError}</div>}

                <input type="text" placeholder="Last Name" value={lastName} onChange={handleLastNameChange} required />
                {fieldErrors.lastNameError && <div className="error">{fieldErrors.lastNameError}</div>}

                <input type="email" placeholder="Email" value={email} onChange={handleEmailChange} required />
                {emailError && <div className="error">{emailError}</div>}
                {emailAvailable === false && <div className="error">Email is already taken</div>}

                <div className="password-container">
                    <input
                        type={showPassword ? "text" : "password"} // Toggle between text and password
                        placeholder="Password"
                        value={password}
                        onFocus={() => {
                            setShowRequirements(true);
                            generatePasswordSuggestions();
                        }}
                        onBlur={() => setTimeout(() => setShowRequirements(false), 200)}
                        onChange={handlePasswordChange}
                        required
                    />
                    <span
                        className="eye-icon"
                        onClick={() => setShowPassword(!showPassword)} // Toggle password visibility
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />} {/* Toggle between eye and eye-slash icons */}
                    </span>
                </div>

                {showRequirements && (
                    <div className="password-hints">
                        {visibleRequirements.map((req, index) => (
                            <div key={index} className="error">{req.text}</div>
                        ))}
                    </div>
                )}
                {showRequirements && (
                    <div className="password-suggestions">
                        {passwordSuggestions.map((suggestion, index) => (
                            <span
                                key={index}
                                className="suggestion"
                                onMouseDown={() => handlePasswordSuggestionClick(suggestion)}
                            >
                                {suggestion}
                            </span>
                        ))}
                    </div>
                )}

                <input type="text" placeholder="Phone Number" value={phoneNumber} onChange={handlePhoneNumberChange} required />
                {fieldErrors.phoneError && <div className="error">{fieldErrors.phoneError}</div>}

                <button type="submit">Sign Up</button>
            </form>
        </div>
    );
}

export default SignUp;