import './FeedPost.scss';
import PostLikes from '../PostLikes/PostLikes';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  CircularProgress,
  IconButton,
  Popper,
  TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import { PostForFeed } from '../../../../types/post';
import SendIcon from '@mui/icons-material/Send';
import { useState } from 'react';
import { addComment } from '../../../../services/commentService';
import { makeFileUrl } from '../../../../utils/makeFileUrl';
import { toast } from 'react-toastify';

export interface FeedPostProps extends PostForFeed {
  loggedInUserId: string;
  handleDeletePost: (postId: string) => Promise<void>;
  handleLike: (postId: string) => void;
  handlePopoverClose: (event: React.MouseEvent<HTMLElement>) => void;
  anchorEl: HTMLElement | null;
  fetchBookSummary: (
    bookTitle: string,
    event: React.MouseEvent<HTMLElement>
  ) => void;
  summary: string;
  loadingSummary: boolean;
}

const FeedPost = (props: FeedPostProps) => {
  const [newComment, setNewComment] = useState<string>('');
  const navigate = useNavigate();

  const handleAddComment = async () => {
    try {
      await addComment(props._id, newComment, props.loggedInUserId);
      setNewComment('');
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div key={props._id} className="feed__post">
      <div className="feed__post__content">
        {props.imageUrl && (
          <img
            src={makeFileUrl(props.imageUrl)}
            alt={makeFileUrl(props.imageUrl)}
            className="feed__post-image"
          />
        )}
        <div>
          <h2
            className="feed__post-title"
            onMouseEnter={(event) =>
              props.fetchBookSummary(props.bookTitle, event)
            }
            onMouseLeave={props.handlePopoverClose}
          >
            {props.bookTitle}
          </h2>
          <h3>{props.content}</h3>
        </div>
      </div>
      <div className="flex-divider"></div>
      <div className="feed__post--comment-input">
        <TextField
          label="Add a comment"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          fullWidth
          multiline
        />
        <Button
          onClick={handleAddComment}
          variant="contained"
          color="primary"
          endIcon={<SendIcon />}
        >
          Add Comment
        </Button>
      </div>
      <div className="feed__post-actions">
        <PostLikes
          postId={props._id}
          likesCount={props.likesCount}
          userId={props.loggedInUserId}
          postUserId={props.userId}
          onLike={props.handleLike}
        />
        <IconButton onClick={() => navigate(`/post/${props._id}`)}>
          <VisibilityIcon fontSize="inherit" />
        </IconButton>
        {props.userId === props.loggedInUserId && (
          <IconButton onClick={() => props.handleDeletePost(props._id)}>
            <DeleteIcon fontSize="inherit" />
          </IconButton>
        )}
        <IconButton disabled>
          {props.commentsCount}
          <ChatBubbleIcon fontSize="inherit" />
        </IconButton>
      </div>
      <Popper
        open={Boolean(props.anchorEl)}
        anchorEl={props.anchorEl}
        placement="bottom"
        disablePortal={false}
        modifiers={[
          {
            name: 'preventOverflow',
            options: {
              boundary: 'window',
            },
          },
        ]}
        sx={{ zIndex: 9999, maxWidth: '300px' }}
      >
        <div
          className="summary-box"
          style={{
            background: 'white',
            padding: '10px',
            borderRadius: '5px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {props.loadingSummary ? (
            <CircularProgress size={20} />
          ) : (
            props.summary || 'Hover over a title to see the summary'
          )}
        </div>
      </Popper>
    </div>
  );
};

export default FeedPost;
