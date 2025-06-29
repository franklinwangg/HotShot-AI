import React, { useState, useEffect, useContext } from 'react';
import "./AddImages.css";
import UserContext from '../../../context/UserContext';

function AddImages() {

    const [image, setImage] = useState(null);
    const { username, setUsername } = useContext(UserContext); // Access username and setUsername from context

    const apiEndpointUrl = process.env.REACT_APP_API_URL;


    useEffect(() => {
        // This will run every time `image` is updated
        if (image) {
            console.log("final image : ", image);
        }
    }, [image]);

    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
    };

    const handleAddImagesButtonClick = async () => {
        if (!image) {
            console.log("No image selected");
            return;
        }

        const formData = new FormData();
        formData.append("image", image);
        formData.append("username", username); 

        // If you still want to send a postId or something else, append it here
        // formData.append("postId", somePostId);
        console.log("formData : ", formData);

        try {
            const response = await fetch(`${apiEndpointUrl}/api/pictures`, {
                method: "POST",
                body: formData, // no Content-Type header! Let browser set it (multipart/form-data)
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Upload success:", data);
        } catch (error) {
            console.error("Error uploading image:", error);
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
                        onChange={handleImageChange}
                        required
                    />
                    <span className="upload-label">
                        {image ? image.name : "Choose an image..."}
                    </span>
                    <span className="browse-button">Browse</span>
                </label>
            </div>

            <button
                id="create-new-post-submit-button"
                className="btn-primary"
                onClick={handleAddImagesButtonClick}
            >
                Add Image To Collection
            </button>
        </div>
    );

}

export default AddImages;
