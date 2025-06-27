import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import "./Homepage.css";
import UserContext from '../../../context/UserContext';
import HeaderBar from '../../Others/HeaderBar/HeaderBar';



function Homepage() {

    const navigate = useNavigate();
    const [pictures, setpictures] = useState([]);

    const { username, setUsername } = useContext(UserContext); // Access username and setUsername from context
    const [showLogoutButton, setShowLogoutButton] = useState(false);
    // let picture1, picture2, picture3, picture4, picture5, picture6;

    const apiEndpointUrl = process.env.REACT_APP_API_URL;


    useEffect(() => {
        fetch(`${apiEndpointUrl}/api/pictures`)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                console.log("data : ", data);
                setpictures(data);
            })
    }, []);

    const openLogoutButton = () => {
        setShowLogoutButton(true);
    };

    const logOut = () => {
        setUsername(null);
    };


    // get the last 6 pictures
    return (

        <div id="rest-of-pictures">
            <div id="rest-of-pictures-dividing-line"></div>
            <div id="rest-of-pictures-pictures">
                {
                    pictures ? (
                        pictures.map((picture, index) => {
                            return (
                                <div id="remaining-picture-picture" key={index}>
                                    <img id="remaining-picture-image" src={picture} alt={picture.title} />
                                </div>
                            );
                        })
                    ) : (
                        <div>
                            Loading...
                        </div>
                    )
                }

            </div>
        </div>
    );

}

export default Homepage;