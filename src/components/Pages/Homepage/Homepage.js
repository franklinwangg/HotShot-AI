import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import "./Homepage.css";
import UserContext from '../../../context/UserContext';
import HeaderBar from '../../Others/HeaderBar/HeaderBar';

function Homepage() {
    const navigate = useNavigate();
    const [pictures, setpictures] = useState([]);
    const [ranking, setRanking] = useState([]); // [{url, score, feedback}]
    const [loading, setLoading] = useState(false);
    const [ranked, setRanked] = useState(false);
    const { username, setUsername } = useContext(UserContext);
    const [showLogoutButton, setShowLogoutButton] = useState(false);
    const apiEndpointUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        fetch(`${apiEndpointUrl}/api/pictures`)
            .then((response) => response.json())
            .then((data) => {
                setpictures(data);
            });
    }, []);

    const handlePhotoRanker = async () => {
        setLoading(true);
        setRanked(false);
        try {
            // Run analysis for all photos in parallel
            const results = await Promise.all(
                pictures.map(async (picture) => {
                    const res = await fetch(`${apiEndpointUrl}/api/analyze`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ imageUrl: picture }),
                    });
                    const data = await res.json();
                    // Assume data.score and data.feedback (adjust if needed)
                    return {
                        url: picture,
                        score: data.score ?? 0,
                        feedback: data.feedback ?? (data.message || "No feedback returned."),
                    };
                })
            );
            // Sort by score descending
            results.sort((a, b) => b.score - a.score);
            setRanking(results);
            setRanked(true);
        } catch (err) {
            alert("Error ranking photos. Please try again.");
        }
        setLoading(false);
    };

    const openLogoutButton = () => {
        setShowLogoutButton(true);
    };

    const logOut = () => {
        setUsername(null);
    };

    return (
        <div>
            <div className="chatgpt-powered-box">
                <div className="chatgpt-powered-text">
                    Powered by <strong>ChatGPT</strong>
                </div>
            </div>
            
            <div id="rest-of-pictures">
                <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
                    <button
                        className="btn-primary"
                        style={{ 
                            maxWidth: 150, 
                            fontWeight: 500, 
                            fontSize: '0.9rem',
                            backgroundColor: '#b330ff',
                            borderColor: '#b330ff',
                            padding: '0.6rem 1.2rem'
                        }}
                        onClick={handlePhotoRanker}
                        disabled={loading || pictures.length === 0}
                    >
                        {loading ? 'Ranking Photos...' : 'Photo Ranker'}
                    </button>
                </div>
                {loading && (
                    <div style={{ textAlign: 'center', margin: '1rem' }}>
                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                        <div style={{ marginTop: 8 }}>Analyzing your photos...</div>
                    </div>
                )}
                <div id="rest-of-pictures-dividing-line"></div>
                <div id="rest-of-pictures-pictures">
                    {ranked && ranking.length > 0 ? (
                        ranking.map((item, index) => (
                            <div id="remaining-picture-picture" key={index} style={{ marginBottom: '2rem' }}>
                                <img id="remaining-picture-image" src={item.url} alt={item.url} style={{ maxWidth: 400, width: '100%', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }} />
                                <div style={{ marginTop: 12, background: '#f3f0fa', borderRadius: 8, padding: 16, color: '#333', boxShadow: '0 1px 4px rgba(179,48,255,0.07)' }}>
                                    <div style={{ fontWeight: 700, color: '#b330ff', marginBottom: 4 }}>Rank #{index + 1} &nbsp;|&nbsp; Score: {item.score}</div>
                                    <div style={{ fontSize: '1rem', whiteSpace: 'pre-line' }}>{item.feedback}</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        pictures && pictures.length > 0 ? (
                            pictures.map((picture, index) => (
                                <div id="remaining-picture-picture" key={index}>
                                    <img id="remaining-picture-image" src={picture} alt={picture.title} />
                                </div>
                            ))
                        ) : (
                            <div>Loading...</div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

export default Homepage;