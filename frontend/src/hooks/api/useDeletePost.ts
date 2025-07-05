import { deletePost } from '../../services/postService';
import { toast } from 'react-toastify';
import { useMutation, useQueryClient } from 'react-query';

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  const { data: newPost, ...rest } = useMutation<void, any, string, unknown>(
    'delete',
    deletePost,
    {
      onSuccess: () => {
        toast.success('Post deleted');
        queryClient.invalidateQueries({
          queryKey: ['userPosts'],
        });
        queryClient.invalidateQueries({ queryKey: ['postsForFeed'] });
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Failed to delete post.');
      },
    }
  );

  return { newPost, ...rest };
};
