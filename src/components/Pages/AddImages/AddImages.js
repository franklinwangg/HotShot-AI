<<<<<<< Updated upstream
import React, { useState, useEffect } from 'react';
=======
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
import "./AddImages.css";

import { Link } from 'react-router-dom';


function AddImages() {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [content, setcontent] = useState("");
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [uploadComplete, setUploadComplete] = useState(false);
    const apiEndpointUrl = process.env.REACT_APP_API_URL;

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
    const { username, setUsername } = useContext(UserContext); 
>>>>>>> Stashed changes
=======
    const { username, setUsername } = useContext(UserContext); 
>>>>>>> Stashed changes
=======
    const { username, setUsername } = useContext(UserContext); 
>>>>>>> Stashed changes

    useEffect(() => {
        if (images.length > 0) {
            console.log("final images : ", images);
        }
    }, [images]);

    useEffect(() => {
        if (uploadComplete) {
            const timer = setTimeout(() => {
                navigate('/');
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [uploadComplete, navigate]);

    const handleImageChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setImages(selectedFiles);
    };

    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleAddImagesButtonClick = async () => {
        if (images.length === 0) {
            console.log("No images selected");
            return;
        }

        setUploading(true);
        setUploadProgress({});

        try {
            const uploadPromises = images.map(async (image, index) => {
                const formData = new FormData();
                formData.append("image", image);

                setUploadProgress(prev => ({ ...prev, [index]: 'uploading' }));

                const response = await fetch(`${apiEndpointUrl}/api/pictures`, {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`Upload failed for ${image.name}: ${response.statusText}`);
                }

                const data = await response.json();
                setUploadProgress(prev => ({ ...prev, [index]: 'success' }));
                return data;
            });

            await Promise.all(uploadPromises);
            console.log("All images uploaded successfully");
            
            setUploadComplete(true);
            
        } catch (error) {
            console.error("Error uploading images:", error);
            setUploadProgress(prev => ({ ...prev, [Object.keys(prev).find(key => prev[key] === 'uploading')]: 'error' }));
        } finally {
            setUploading(false);
        }
    };

    const handleBackToHomepage = () => {
        navigate('/');
    };

    const changeTitle = (event) => {
        setTitle(event.target.value);
    };
    const changecontent = (event) => {
        setcontent(event.target.value);
    };

    function adjustHeight(event) {
        const textarea = event.target;
        textarea.style.height = 'auto'; 
        textarea.style.height = `${textarea.scrollHeight}px`; // 
    }


    if (uploadComplete) {
        return (
            <div className="container">
                <div className="upload-success">
                    <div className="success-icon">✓</div>
                    <h2>Upload Successful!</h2>
                    <p>Your {images.length} image{images.length !== 1 ? 's' : ''} have been uploaded to your collection.</p>
                    <p className="redirect-message">Redirecting to homepage in 3 seconds...</p>
                    <button
                        className="btn-primary"
                        onClick={handleBackToHomepage}
                    >
                        Back to Homepage Now
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <h1 className="page-title">Add Images</h1>

            <div className="form-group">
                <label className="custom-file-upload">
                    <input
                        type="file"
                        id="image-input"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        required
                    />
                    <span className="upload-label">
                        {images.length > 0 
                            ? `${images.length} image${images.length > 1 ? 's' : ''} selected`
                            : "Choose images..."
                        }
                    </span>
                    <span className="browse-button">Browse</span>
                </label>
            </div>


            {images.length > 0 && (
                <div className="selected-images">
                    <h3>Selected Images ({images.length})</h3>
                    <div className="image-grid">
                        {images.map((image, index) => (
                            <div key={index} className="image-item">
                                <img 
                                    src={URL.createObjectURL(image)} 
                                    alt={image.name}
                                    className="preview-image"
                                />
                                <div className="image-info">
                                    <span className="image-name">{image.name}</span>
                                    <span className="image-size">
                                        {(image.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                    {uploadProgress[index] && (
                                        <span className={`upload-status ${uploadProgress[index]}`}>
                                            {uploadProgress[index] === 'uploading' && 'Uploading...'}
                                            {uploadProgress[index] === 'success' && '✓ Uploaded'}
                                            {uploadProgress[index] === 'error' && '✗ Error'}
                                        </span>
                                    )}
                                </div>
                                <button 
                                    className="remove-image-btn"
                                    onClick={() => removeImage(index)}
                                    disabled={uploading}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button
                id="create-new-post-submit-button"
                className="btn-primary"
                onClick={handleAddImagesButtonClick}
                disabled={images.length === 0 || uploading}
            >
                {uploading ? 'Uploading Images...' : `Add ${images.length} Image${images.length !== 1 ? 's' : ''} To Collection`}
            </button>
        </div>
    );

}

export default AddImages;
