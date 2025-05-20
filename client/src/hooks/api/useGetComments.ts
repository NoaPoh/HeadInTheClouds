import { useQuery } from 'react-query';
import { getComments } from '../../services/commentService';

export const useGetComments = (postId: string) => {
  return useQuery(['comments', postId], () => getComments(postId));
};
