import React, { useState, useEffect, useContext } from 'react';
import "./AddImages.css";
import UserContext from '../../../context/UserContext';

function AddImages() {

    const [title, setTitle] = useState("");
    const [content, setcontent] = useState("");
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const apiEndpointUrl = process.env.REACT_APP_API_URL;

    const { username, setUsername } = useContext(UserContext); // Access username and setUsername from context

    useEffect(() => {
        // This will run every time `images` is updated
        if (images.length > 0) {
            console.log("final images : ", images);
        }
    }, [images]);

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
            // Upload each image individually
            const uploadPromises = images.map(async (image, index) => {
                const formData = new FormData();
                formData.append("image", image);
                formData.append("username", username);

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
            
            // Clear the form after successful upload
            setImages([]);
            setUploadProgress({});
            
        } catch (error) {
            console.error("Error uploading images:", error);
            setUploadProgress(prev => ({ ...prev, [Object.keys(prev).find(key => prev[key] === 'uploading')]: 'error' }));
        } finally {
            setUploading(false);
        }
    };

    const changeTitle = (event) => {
        setTitle(event.target.value);
    };
    const changecontent = (event) => {
        setcontent(event.target.value);
    };

    function adjustHeight(event) {
        const textarea = event.target;
        textarea.style.height = 'auto'; // Reset height
        textarea.style.height = `${textarea.scrollHeight}px`; // Set height to scrollHeight
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

            {/* Display selected images */}
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
