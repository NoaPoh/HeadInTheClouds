import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { deleteComment } from '../../services/commentService';

const useDeleteComment = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation('deleteComment', deleteComment, {
    onSuccess: () => {
      toast.success('comment deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'deleting comment failed');
    },
  });
};

export default useDeleteComment;
