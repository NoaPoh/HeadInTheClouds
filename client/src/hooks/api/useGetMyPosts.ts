import { useQuery } from 'react-query';
import { getPostsByUserId } from '../../services/postService';
import { Post } from '../../types/post';

export const useGetMyPosts = (userId: string, page: number) => {
  return useQuery<{ posts: Post[]; totalPages: number }, Error>(
    ['userPosts', page, userId],
    () => getPostsByUserId(userId, page)
  );
};
