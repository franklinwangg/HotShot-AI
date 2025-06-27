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
    // navigate("/createPost");
    navigate("/addImages");
  };

  return (
    <div className="header-bar">
      <div className="header-bar-content">
        <div className="header-bar-logo">
          <div className="logo-outline">
            <Link to="/">BOXHUB</Link>
          </div>
        </div>

        <div className="header-bar-right">
          <button id="add-post-button" onClick={handleAddPostClick}>
            Add Pictures
          </button>
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
  );
};

export default HeaderBar;
