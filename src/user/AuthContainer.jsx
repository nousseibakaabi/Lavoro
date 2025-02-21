import React, { useState, useRef } from 'react';
import SignUp from './Signup';
import SignIn from './Signin';
import 'bootstrap/dist/css/bootstrap.min.css';

function AuthContainer() {
    const containerRef = useRef(null);
    const [isRightPanelActive, setIsRightPanelActive] = useState(false);

    const switchToSignUp = () => setIsRightPanelActive(true);
    const switchToSignIn = () => setIsRightPanelActive(false);

    return (
        <div className={`container ${isRightPanelActive ? 'right-panel-active' : ''}`} ref={containerRef}>
            <SignUp switchToSignIn={switchToSignIn} />
            <SignIn switchToSignUp={switchToSignUp} />
            <div className="overlay-container">
                <div className="overlay">
                    <div className="overlay-panel overlay-left">
                        <h1>Welcome Back!</h1>
                        <p>To keep connected with us please login with your personal info</p>
                        <button className="ghost" id="signIn" onClick={switchToSignIn}>Sign In</button>
                    </div>
                    <div className="overlay-panel overlay-right">
                        <h1>Hello, Friend!</h1>
                        <p>Enter your personal details and start journey with us</p>
                        <button className="ghost" id="signUp" onClick={switchToSignUp}>Sign Up</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthContainer;