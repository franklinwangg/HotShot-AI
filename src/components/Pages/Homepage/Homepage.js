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
        const userId = username; // however you get your user ID

        fetch(`${apiEndpointUrl}/api/pictures?userId=${userId}`)
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
                    return {
                        url: picture,
                        score: data.score || 0,
                        feedback: data.feedback || "Analysis failed",
                        sharpnessScore: data.sharpnessScore || 0,
                        lightingScore: data.lightingScore || 0,
                        predictedImage: data.predictedImage || "Unknown",
                        confidence: data.confidence || "Low confidence"
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

        {/* if user is logged in */}
            {username != null && (
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
                                padding: '0.6rem 1.2rem',
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
                            <div className="photos-grid ranked-photos">
                                {ranking.map((item, index) => (
                                    <div className="photo-card ranked" key={index}>
                                        <div className="photo-image-container">
                                            <img 
                                                className="photo-image" 
                                                src={item.url} 
                                                alt={`Ranked photo ${index + 1}`} 
                                            />
                                            <div className="rank-badge">#{index + 1}</div>
                                        </div>
                                        <div className="photo-details">
                                            <div className="score-header">
                                                <span className="overall-score">{item.score}%</span>
                                                <span className="rank-number">Rank #{index + 1}</span>
                                            </div>
                                            <div className="sub-scores">
                                                <span>Sharpness: {item.sharpnessScore}%</span>
                                                <span>Lighting: {item.lightingScore}%</span>
                                            </div>
                                            <div className="feedback-text">
                                                {item.feedback}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : pictures && pictures.length > 0 ? (
                            <div className="photos-grid">
                                {pictures.map((picture, index) => (
                                    <div className="photo-card" key={index}>
                                        <div className="photo-image-container">
                                            <img
                                                className="photo-image"
                                                src={picture}
                                                alt={`Photo ${index + 1}`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-photos-message">
                                <p>No photos uploaded yet. Click "Create New Album" to get started!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Homepage;