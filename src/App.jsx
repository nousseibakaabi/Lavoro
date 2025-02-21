import "./App.css";
import { Routes, BrowserRouter, Route, Navigate } from 'react-router-dom';
import SignUp from "./user/Signup"; // Ensure the correct file name
import SignIn from "./user/Signin"; // Ensure the correct file name
import AuthContainer from './user/AuthContainer';
import Home from "./Home";
import VerifyEmail from "./user/verifymail";
import './styles.css'; // Assuming this is where your styles are located

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/register" element={<SignUp />} />

          <Route
            path="/auth/*"
            element={
              <div className="App">
                <AuthContainer />
              </div>
            }
          />
          <Route path="/" element={<Navigate to="/auth" />} />

          <Route path="*" element={<Navigate to="/auth" />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;