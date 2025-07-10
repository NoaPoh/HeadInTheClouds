import { useMutation, useQueryClient } from 'react-query';
import { likePost } from '../../services/postService';

const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ postId }: { postId: string; page: number }) => {
      await likePost(postId);
    },
    {
      onSettled: (data, error, variables) => {
        queryClient.invalidateQueries(['postsForFeed', variables.page]);
      },
    }
  );
};

export default useLikePost;
