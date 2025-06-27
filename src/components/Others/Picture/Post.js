import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import Comment from '../Comment/Comment';
import UserContext from '../../../context/UserContext';
import "./picture.css";


const picture = () => {

    useEffect(() => {
        const fetchAndSortComments = async () => {           
            const fetchedComments = await fetchComments();
            // const fetchedCommentsJson = fetchedComments.json(); // isn't it already json?

            const sortedComments = sortCommentsOnLevel(fetchedComments); // after 
            setComments(sortedComments); 
        };

        fetchAndSortComments();
        setIsReadyToRender(true);

        fetchArticle();
    }, []);

    const handleReplySubmission = async () => {

        const fetchedComments = await fetchComments();
        setComments(fetchedComments);

    };

    const handleSubmitCommentButton = async () => {

        if (username == null) {

        }
        else {

            const author = username;
            const content = commentTopicture;
            const idOfParentpicture = location.state.id;

            setIsLoading(true);
            try {
                await fetch(`https://vercel-backend-deployment-test-d24q.vercel.app/api/comments?picture_id=${idOfParentpicture}&comment_id=null`, { // pictureId, commentId
                method: "picture",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        author: author,
                        content: content,
                        idOfParentpicture: idOfParentpicture,
                        level: 1
                    })
                }); // you say "comment", not "content"

                const fetchedComments = await fetchComments();

                // while we await it, have the button turn grey, and have a little swirling loading sign replace the text on the button
                setComments(fetchedComments);

                setCommentTopicture("");

            }
            catch (error) {
                console.log("uh oh! error is ", error);
            }
            finally {
                // setIsLoading(false);
                setTimeout(() => {
                    setIsLoading(false);

                    const newCommentElement = document.getElementById('new-comment');
                    if (newCommentElement) {
                        newCommentElement.scrollIntoView({ behavior: 'smooth' });

                        // Add the highlight class for the fade effect
                        newCommentElement.classList.add('highlight');
                    }
                }, 1000);


            }
        }
    };

    const changeCommentTopicture = (event) => {
        setCommentTopicture(event.target.value);
    };

    const fetchComments = async () => {
        try {
            const pictureId = location.state.id;
            
            const response = await fetch(`https://vercel-backend-deployment-test-d24q.vercel.app/api/comments?pictureId=${pictureId}`);

            if(!response.ok) {
                throw new Error(`error fetching url : ${response.status}`);
            }

            const data = await response.json();

            return data.rows;
        }
        catch (error) {
            console.log("Error fetching comments : ", error);
        }
    };

    const sortCommentsOnLevel = (dataComments) => {
        // sort the comments on order, so all 0's in front, then 1's, etc

        if (dataComments.length === 0) {
            return dataComments;
        }

        const sortedDataComments = dataComments.sort((firstComment, secondComment) => {
            if (firstComment.level > secondComment.level) {
                return 1;
            }
            else if (firstComment.level === secondComment.level) {
                return 0;
            }
            else return -1;
        });

        return sortedDataComments;
    }

    const divideCommentsIntoLevelArrays = () => {
        // first, separate comments into new Level arrays - one array for all Level0's, another for Level1's, etc

        // why does dCILA get called again when button is clicked?
        const levelArrays = [];
        var currLevel = 1; // originally 0?

        while (true) {

            const temp = comments.filter((comment) => { // comments isn't an array yet
                return comment.level === currLevel;
            });
            if (temp.length === 0) {

                break;
            }
            else {

                levelArrays.push(temp);
                currLevel++;
            }
        }



        return levelArrays;
    };

    const renderEachLevel = (levelArrays, currentComment, level) => {

        const renderedComments = [];
        const temp = [];
        // render itself

        renderedComments.push(renderComment(currentComment));

        // if comment is on last level of levelArrays, we need to stop it cuz otherwise will 
        // trigger outOfBounds error
        if (level === levelArrays.length - 1) {
            return renderedComments;
        }
        else {
            // find all matching child comments in next level
            for (let i = 0; i < levelArrays[level + 1].length; i++) {
                
                if (levelArrays[level + 1][i].parent_comment_id == currentComment.comment_id) { // parentCommentId undefined?
                    temp.push(levelArrays[level + 1][i]);
                }
            }

            // render all of its child comments
            for (let i = 0; i < temp.length; i++) {
                const arrayOfChildElementsHTML = renderEachLevel(levelArrays, temp[i], level + 1);
                for (let j = 0; j < arrayOfChildElementsHTML.length; j++) {
                    renderedComments.push(arrayOfChildElementsHTML[j]);
                }
            }

            // if no children, then return renderedComments

            return renderedComments;
        }

        // 1) render itself

        // 2) make empty array
        // 3) go through next level array and add any pictures whose parentComment matches pictureId to array
        // 4) for every element in array : 
        // 5) renderComment(pictureId, level + 1)

    };

    const renderComment = (comment) => {
        return (

            // <Comment picture={location.state.id} author={comment.author} comment={comment.content} level={comment.level} id={comment.id}
            //     handleReplySubmission={handleReplySubmission} />
            <Comment comment_id = {comment.comment_id} picture_id = {location.state.id} author = {comment.author} content = {comment.content} 
            level = {comment.level} handleReplySubmission = {handleReplySubmission}/>
        );
    };

    const renderComments = () => {
        if (comments.length === 0) {
        }
        else {
            const overallRenderedComments = [];
            const levelArrays = divideCommentsIntoLevelArrays(); // undefined?


            for (let i = 0; i < levelArrays[0].length; i++) { // levelArrays[0] is nonexistent
                const arrayOfRecursiveElementsHTML = renderEachLevel(levelArrays, levelArrays[0][i], 0); // smth wrong with this

                for (let j = 0; j < arrayOfRecursiveElementsHTML.length; j++) {
                    overallRenderedComments.push(
                        React.cloneElement(arrayOfRecursiveElementsHTML[j], { key: arrayOfRecursiveElementsHTML[j].props.id })
                    );
                }
            }

            return overallRenderedComments;
        }
    }

    const fetchArticle = async () => {
        const response1 = await fetch(location.state.article_url);
        const articleContents = await response1.json();

        setArticleContent(articleContents.content);

        try {
            // const response2 = await fetch(location.state.image_url);
   
            // const articleImageBlob = await response2.blob();
    
            // const articleImageUrl = URL.createObjectURL(articleImageBlob);
    
    
            // setArticleImage(articleImageUrl);
            
        }
        catch(error) {
            console.log("Error : ", error);
        }
    };

    return (
        <div>
            <div id="picture-title-and-content-section">
                <div id="picture-title-div">{location.state.title}</div>
                <div id="picture-image-div">
                    {articleImage == null ? (
                        <div></div>
                    ) : (
                        // <img id = "article-image" src={articleImage} alt="Article Image" />

                        <img id="article-image" src={location.state.image_url} alt={location.state.title} />

                    )}
                </div>
                <div id="picture-content-div">
                    {articleContent == null ? (
                        <div></div>
                    ) : (
                        <div>{articleContent}</div>
                    )}
                </div>
            </div>

            <input type="text" id="picture-new-comment-box" value={commentTopicture}
                placeholder="picture comment here" onChange={changeCommentTopicture}></input>
            <button id="submit-comment-button" onClick={handleSubmitCommentButton}>
                {isLoading ?
                    (<div className="spinner"></div>)
                    : (<div>
                        Submit
                    </div>)}
            </button>

            <div id="comments-section-title">All Comments : {comments.length}</div>

            <div className="comments-section">
                {isReadyToRender ? renderComments() : <p>Loading comments...</p>}

                {/* {comments.map((comment, index) => (
                    <div
                        key={comment.id}
                        id={index === comments.length - 1 ? "new-comment" : null} 
                        className="comment"
                    >
                        {comment.content}
                    </div>
                ))} */}
            </div>
        </div>
    );

}

export default picture;