
import React, { useState, createContext } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/UserAuthentification/Login/Login'; // Adjust path as necessary
import Register from './components/UserAuthentification/Register/Register'; // Adjust path as necessary
import Homepage from './components/Pages/Homepage/Homepage';
import AddImages from './components/Pages/AddImages/AddImages';
import HeaderBar from './components/Others/HeaderBar/HeaderBar';

// import {UserProvider } from './context/UserContext';
import UserProvider from './context/UserProvider';

const LayoutWithHeader = ({ children }) => (
  <>
    <HeaderBar /> {/* This will render above the specific routes */}
    {children}
  </>
);

function App() {

  return (
    <Router>
      <UserProvider>
        <Routes>
          {/* <Route path="/" element={<Login />} /> */}

          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/addImages" element={<AddImages />} />

          {/* Routes with HeaderBar */}
          <Route
            path="/"
            element={
              <LayoutWithHeader>
                <Homepage />
              </LayoutWithHeader>
            }
          />

        </Routes>
      </UserProvider>
    </Router>



  );
}

export default App;
