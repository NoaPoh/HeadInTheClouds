import React from 'react';
import { IconButton } from '@mui/material';
import { ThumbUpSharp } from '@mui/icons-material';
import './PostLikes.scss';

interface PostLikesProps {
  postId: string;
  likesCount: number;
  userId: string;
  postUserId: string;
  onLike: (postId: string) => void;
}

const PostLikes: React.FC<PostLikesProps> = ({ postId, likesCount, userId, postUserId, onLike }) => {
  return (
    <div className="feed__post-likes">
      <IconButton
        onClick={() => onLike(postId)}
        className="feed__post-like"
        disabled={postUserId === userId}
      >
        <ThumbUpSharp />
      </IconButton>
      <span>{likesCount} Likes</span>
    </div>
  );
};

export default PostLikes;