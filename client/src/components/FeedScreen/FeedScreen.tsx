import React, { useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { deletePost } from '../../services/postService';
import './FeedScreen.scss';
import { useAtomValue } from 'jotai/index';
import { loggedInUserAtom } from '../../context/LoggedInUserAtom';
import useLikePost from '../../hooks/api/useLikePost';
import { PostForFeed } from '../../types/post';
import PaginationControls from '../PaginationControls/PaginationControls';
import debounce from 'lodash/debounce';
import { GoogleGenerativeAI } from '@google/generative-ai';
import FeedPost from './components/FeedPost/FeedPost';
import useGetPostsForFeed from '../../hooks/api/useGetPostsForFeed';

const FeedScreen: React.FC = () => {
  const [page, setPage] = useState(1);
  let [posts, setPosts] = useState<PostForFeed[]>([]);
  const { _id: userId } = useAtomValue(loggedInUserAtom);
  const { mutate: likePost } = useLikePost();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);

  const { data, isLoading } = useGetPostsForFeed(page);

  useEffect(() => {
    if (data) {
      setPosts(data.posts);
    }
  }, [data]);

  const totalPages = data?.totalPages || 1;

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      setPosts(posts.filter((post) => post._id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleLike = (postId: string) => {
    likePost({ postId, page });
  };

  const fetchBookSummary = debounce(
    async (bookTitle: string, event: React.MouseEvent<HTMLElement>) => {
      if (!summary || summary === '') {
        setAnchorEl(event.target as HTMLElement);
        setLoadingSummary(true);
        const genAI = new GoogleGenerativeAI(
          process.env.REACT_APP_GEMINI_API_KEY || ''
        );
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        try {
          const response = await model.generateContent(
            `What is the book "${bookTitle}" about? in about 100 words`
          );
          const summary = response.response.text();
          setSummary(summary as string);
        } catch (error) {
          console.error('Error fetching book summary:', error);
          setSummary('Failed to fetch summary.');
        } finally {
          setLoadingSummary(false);
        }
      }
    },
    500
  );

  const handlePopoverClose = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(null);
    setSummary('');
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      const newPage = page + 1;
      setPage(newPage);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      const newPage = page - 1;
      setPage(newPage);
    }
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <div className="feed">
      <PaginationControls
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        handleNextPage={handleNextPage}
        handlePreviousPage={handlePreviousPage}
      />
      {posts.length > 0 ? (
        posts.map((post: PostForFeed) => (
          <FeedPost
            key={post._id}
            loggedInUserId={userId}
            _id={post._id}
            userId={post.userId}
            content={post.content}
            imageUrl={post.imageUrl}
            bookTitle={post.bookTitle}
            likesCount={post.likesCount}
            commentsCount={post.commentsCount}
            handleDeletePost={handleDeletePost}
            handleLike={handleLike}
            handlePopoverClose={handlePopoverClose}
            anchorEl={anchorEl}
            fetchBookSummary={fetchBookSummary}
            summary={summary}
            loadingSummary={loadingSummary}
          />
        ))
      ) : (
        <p>No posts available</p>
      )}
    </div>
  );
};

export default FeedScreen;
