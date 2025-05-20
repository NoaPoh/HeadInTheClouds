import { updatePost } from '../../services/postService';
import { toast } from 'react-toastify';
import { Post, UpdatePostData } from '../../types/post';
import { useMutation } from 'react-query';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';

export const useUpdatePost = () => {
  const navigate = useNavigate();

  return useMutation<Post, any, UpdatePostData>('updatePost', updatePost, {
    onSuccess: () => {
      toast.success('Post has updated');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      navigate(-1);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update post.');
    },
  });
};
