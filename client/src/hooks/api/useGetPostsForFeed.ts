import { useQuery } from 'react-query';
import { getPostsForFeed } from '../../services/postService';
import { PostsForFeedResponse } from '../../types/post';

const useGetPostsForFeed = (page: number) => {
  return useQuery<PostsForFeedResponse, Error>(
    ['postsForFeed', page],
    () => getPostsForFeed(page),
    {
      keepPreviousData: true,
    }
  );
};

export default useGetPostsForFeed;
