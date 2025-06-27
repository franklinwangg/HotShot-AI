import React, { useState, useEffect } from 'react';
import "./AddImages.css";

import { Link } from 'react-router-dom';


function AddImages() {

    const [title, setTitle] = useState("");
    const [content, setcontent] = useState("");
    const [image, setImage] = useState(null);
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


    // const handleAddImagesButtonClick = async () => {
    //     let postIdVar;

    //     await fetch(`${apiEndpointUrl}/api/pictures`, {
    //         method: "POST",
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify({
    //             title: title,
    //             content: content,
    //         })
    //     })
    //         .then((response) => {
    //             const jsonResponse = response.json();
    //             return jsonResponse;
    //         })
    //         .then((data) => {
    //             postIdVar = data.postId;
    //         })

    //     const formData = new FormData();

    //     if (image) {
    //         formData.append("image", image); // Append the image file
    //         formData.append("postId", postIdVar); // Append the image file            
    //     }
    //     else {
    //         console.log("4");
    //     }
    //     console.log("formData : ");
    //     for (const [key, value] of formData.entries()) {
    //         console.log(`${key}: ${value}`);
    //     }
    //     console.log("sending in formData");

    //     // second fetch method uploads the image using the multer instance
    //     await fetch(`${apiEndpointUrl}/api/AddImagesImage`, {
    //         // await fetch("https://vercel-backend-deployment-test-d24q.vercel.app/api/AddImagesImage", {
    //         method: "POST",
    //         body: formData,
    //     })
    //     console.log("finished uploading formData stuff");


    // };

    const handleAddImagesButtonClick = async () => {
        if (!image) {
            console.log("No image selected");
            return;
        }

        const formData = new FormData();
        formData.append("image", image);

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
