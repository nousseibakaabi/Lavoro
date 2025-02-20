import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Signup from "./SignUp";
import {Routes,BrowserRouter,Route} from 'react-router-dom';
import Signin from "./Signin";

function App() {

  return (
    <>
    <BrowserRouter>
    <Routes>
      <Route path="/register" element={<Signup />} />
      <Route path="/login" element={<Signin />} />

    </Routes>
    </BrowserRouter>
   </> 
  );
}

export default App;
