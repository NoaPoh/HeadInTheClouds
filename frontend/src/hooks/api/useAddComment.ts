import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { addComment } from '../../services/commentService';

const useAddComment = (
  postId: string,
  userId: string,
  onSuccess: () => void
) => {
  const queryClient = useQueryClient();

  return useMutation(
    'addComment',
    (content: string) => addComment(postId, content, userId),
    {
      onSuccess: () => {
        onSuccess();
        toast.success('comment added successfully');
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'adding comment failed');
      },
    }
  );
};

export default useAddComment;
