import { Routes, BrowserRouter, Route, Navigate } from "react-router-dom";
import SignUp from "./user/Signup";
import SignIn from "./user/Signin";
import Home from "./Home";
import VerifyEmail from "./user/verifymail";
import ForgotPassword from "./user/ForgetPassword";
import ResetPassword from "./user/ResetPassword";
import Profile from "./profile/profile";
import UpdateProfile from "./profile/updateProfile";
import AdminDashboard from "./admin/AdminDashboard";

import ActivitiesPage from "./user/ActivitiesPage";
import { GoogleOAuthProvider } from "@react-oauth/google";
import RefreshHandler from "./user/RefreshHandler";
import { useState } from "react";
import Layout from "./partials/Layout";
import Sales from "./project/Sales";
import CreateProject from "./project/createProject";
import ListPro from "./project/ProList";
import ProjectDash from "./project/ProjectDash";


import "../public/assets/css/icons.css";
import "../public/assets/css/remixicon.css";
import 'remixicon/fonts/remixicon.css';

import ProjectOverview from "./project/ProjectOverview";
import AllProject from "./project/AllProject";
import Archieve from "./project/Archieve";
import UserActivity from "./admin/UserActivity";
import ArchiveOverview from "./project/ArchiveOverview";
import UpdateProject from "./project/updateProject";
import ProjectProgress from "./project/projetPorgress";
import CreateWithAI from "./project/CreateProjectWithAI";
import CreateProjectWithAI from "./project/CreateProjectWithAI";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <>
    <GoogleOAuthProvider clientId="893053722717-a3eudc815ujr6ne3tf5q3dlrvkbmls6d.apps.googleusercontent.com">
      <BrowserRouter>
      <RefreshHandler setIsAuthenticated={setIsAuthenticated} />
      <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/resetpassword" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            <Route path="/" element={<Navigate to="/signin" />} />
            <Route path="*" element={<Navigate to="/signin" />} />

            {/* Routes with Layout */}
            <Route element={<Layout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/user-activity/:userId" element={<UserActivity />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/update-profile" element={<UpdateProfile />} />
              <Route path="/activities" element={<ActivitiesPage />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/createPro" element ={<CreateProject />} />
              <Route path="/createProWithAI" element ={<CreateProjectWithAI />} />
              <Route path="/ProjectDash" element={<ProjectDash />} />
              <Route path="/AllProject" element={<AllProject />} />

              <Route path="/overviewPro/:id" element={<ProjectOverview />} />
              <Route path="/overviewArchive/:id" element={<ArchiveOverview />} />

              <Route path="/ListPro" element={<ListPro />} />
              <Route path="/archieve" element={< Archieve />} />
              <Route path="/updateProjects/:id" element={<UpdateProject />} />

              <Route path="/ProjectProgress" element={<ProjectProgress/>} />

            </Route>
        </Routes>
      </BrowserRouter>
      </GoogleOAuthProvider>
    </>
  );
}

export default App;