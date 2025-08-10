import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import './PostDetailScreen.scss';
import { useAtomValue } from 'jotai';
import { loggedInUserAtom } from '../../context/LoggedInUserAtom';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import { makeFileUrl } from '../../utils/makeFileUrl';
import { useGetComments } from '../../hooks/api/useGetComments';
import useAddComment from '../../hooks/api/useAddComment';
import useDeleteComment from '../../hooks/api/useDeleteComment';
import { useGetPost } from '../../hooks/api/useGetPost';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import ListItemText from '@mui/material/ListItemText';
import ListItem from '@mui/material/ListItem';
import List from '@mui/material/List';

const PostDetailScreen: React.FC = () => {
  const { id: postId } = useParams<{ id: string }>();
  const { id: userId } = useAtomValue(loggedInUserAtom);
  const { data: post, isLoading } = useGetPost(postId || '');
  const { data: comments } = useGetComments(postId || '');
  const { mutate: addNewComment } = useAddComment(postId || '', userId, () => {
    setNewComment('');
  });
  const { mutate: deleteComment } = useDeleteComment(postId || '');

  const navigate = useNavigate();

  const [newComment, setNewComment] = useState<string>('');

  const handleEditClick = () => {
    navigate('/post/edit/' + postId);
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  if (!post) {
    return <p>Post not found</p>;
  }

  return (
    <div className="post-detail">
      <div className="post-detail__card">
        {post.userId === userId && (
          <Button
            variant="contained"
            className="edit-button"
            onClick={handleEditClick}
            startIcon={<EditIcon />}
          >
            Edit
          </Button>
        )}
        <div className="post-detail__left">
          {post.imageUrl && (
            <img src={makeFileUrl(post.imageUrl)} alt={post.bookTitle} />
          )}
        </div>
        <div className="post-detail__right">
          <h1>{post.bookTitle}</h1>
          {post.authorName && <h3>by {post.authorName}</h3>}
          {post.readingProgress && (
            <p>Reading Progress: {post.readingProgress}</p>
          )}
          <p>{post.content}</p>
        </div>
      </div>
      <div className="post-detail__comments-section">
        <div className="comment-input">
          <TextField
            label="Add a comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            fullWidth
            multiline
          />
          <Button
            onClick={() => addNewComment(newComment)}
            variant="contained"
            color="primary"
            endIcon={<SendIcon />}
          >
            Add Comment
          </Button>
        </div>
        {comments && (
          <List className="comment-list">
            {comments.map((comment) => (
              <ListItem key={comment.id} className="comment-item">
                <ListItemText
                  primary={comment.content}
                  secondary={
                    ' by ' + comment.username
                    // + comment.createdAt
                  }
                />
                {comment.userId === userId && (
                  <IconButton
                    onClick={() => deleteComment(comment.id)}
                    className="delete-button"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </div>
    </div>
  );
};

export default PostDetailScreen;
