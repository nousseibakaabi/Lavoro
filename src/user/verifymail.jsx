import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const isRequestSent = useRef(false); // Use useRef to prevent re-renders

    useEffect(() => {
        if (!token || isRequestSent.current) return; // Prevent duplicate execution

        const verifyEmail = async () => {
            isRequestSent.current = true; // Prevent duplicate API calls
            try {
                console.log('Verification token:', token);
                const response = await axios.get(`http://localhost:3000/users/verify-email?token=${token}`);
                console.log('Backend response:', response.data);
                
                if (response.status === 200) {
                    alert('Email verified successfully!');
                    navigate('/auth'); // Redirect after successful verification
                }
            } catch (error) {
                console.error('Error verifying email:', error);
                alert(error.response?.data?.error || 'Failed to verify email. Please try again.');
                navigate('/signup');
            }
        };

        verifyEmail();
    }, [token, navigate]); // useRef prevents extra calls

    return null;
}

export default VerifyEmail;
