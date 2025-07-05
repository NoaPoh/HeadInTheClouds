import { Link } from 'react-router-dom';
import './MyPost.scss';
import { IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDeletePost } from '../../../../hooks/api/useDeletePost';
import { makeFileUrl } from '../../../../utils/makeFileUrl';

export interface MyPostProps {
  _id: string;
  bookTitle: string;
  content: string;
  imageUrl: string;
  refetchPosts?: () => void;
}

const MyPost = (props: MyPostProps) => {
  const { mutate: deletePost } = useDeletePost();

  const handleDeletePost = (postId: string) => {
    console.log(`Delete post with ID: ${postId}`);
    deletePost(postId);

    props.refetchPosts && props.refetchPosts();
  };

  return (
    <div key={props._id} className="profile__post">
      {props.imageUrl && (
        <img
          src={makeFileUrl(props.imageUrl)}
          alt="Post"
          className="profile__post-image"
        />
      )}
      <div className="profile__post-content">
        <h4>{props.bookTitle}</h4>
        <p>{props.content}</p>
        <div className="profile__post-actions">
          <Link to={`/post/${props._id}`}>
            <IconButton>
              <VisibilityIcon />
            </IconButton>
          </Link>
          <Link to={`/post/edit/${props._id}`}>
            <IconButton>
              <EditIcon />
            </IconButton>
          </Link>
          <IconButton onClick={() => handleDeletePost(props._id)}>
            <DeleteIcon />
          </IconButton>
        </div>
      </div>
    </div>
  );
};

export default MyPost;
