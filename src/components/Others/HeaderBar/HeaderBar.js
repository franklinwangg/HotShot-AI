import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserContext from "../../../context/UserContext";
import personIcon from "./personicon.png";
import "./HeaderBar.css";

const HeaderBar = () => {
  const { username, setUsername } = useContext(UserContext);
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  const togglePopup = () => {
    setShowPopup(!showPopup);
  };

  const handleUserButtonClick = () => {
    if (!username) {
      navigate("/Login");
    } else {
      togglePopup();
    }
  };

  const logOut = () => {
    setUsername(null);
    togglePopup();
  };

  const handleAddPostClick = () => {
    navigate("/addImages");
  };

  return (
    <div>
      <div className="header-bar">
        <div className="header-bar-content">
          <div className="header-bar-logo">
            <div className="logo-outline">
              <Link to="/">HotShot AI</Link>
            </div>
          </div>

          <div className="header-bar-right">

            {username != null && (
              <div className="add-photos-section">
                <button id="add-post-button" onClick={handleAddPostClick}>
                  <span className="plus-sign">+</span>
                </button>
                <span className="add-photos-text">Create New Album</span>
              </div>
            )}



            {username && <div className="header-bar-username">{username}</div>}
            <button id="user-icon-button" onClick={handleUserButtonClick}>
              <img id="person-icon" src={personIcon} alt="User" className="white-profile-icon" />
            </button>
            {showPopup && (
              <button id="logout-button" onClick={logOut}>
                Log Out
              </button>
            )}
          </div>
        </div>
      </div>
      <div style={{
        textAlign: 'center',
        margin: '1rem auto',
        maxWidth: '600px',
        padding: '0 2rem',
        fontSize: '1.1rem',
        fontWeight: 500,
        color: '#6c757d',
        lineHeight: '1.5'
      }}>
        Transform your photos with AI-powered analysis and ranking. Upload, analyze, and discover your best shots.
      </div>
    </div>
  );
};

export default HeaderBar;
