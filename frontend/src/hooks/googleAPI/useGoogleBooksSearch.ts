import { useQuery } from 'react-query';
import { useState, useCallback } from 'react';
import debounce from 'lodash/debounce';
import {
  GoogleBooksRelevantBookData,
  GoogleBooksResult,
  GoogleBooksSearchParams,
} from '../../types/googleBooks';
import axios from 'axios';
import { DEFAULT_IMAGE_URL, GOOGLE_BOOKS_API_URL } from '../../utils/constants';

const fetchGoogleBooksSearch = async ({
  bookTitle,
  authorName,
}: GoogleBooksSearchParams): Promise<
  undefined | GoogleBooksRelevantBookData[]
> => {
  if (!bookTitle) return undefined;

  const { data } = await axios.get<GoogleBooksResult>(GOOGLE_BOOKS_API_URL, {
    params: {
      q: `${bookTitle}${authorName ? `+inauthor:${authorName}` : ''}`,
      printType: 'books',
    },
  });

  if (!data.items) return undefined;

  return data.items
    .filter((item) => item.id && item.volumeInfo.title)
    .map((item) => ({
      id: item.id,
      bookTitle: item.volumeInfo.title,
      authorName: item.volumeInfo.authors?.join(', ') || 'Unknown',
      pageCount: item.volumeInfo.pageCount,
      imageUrl: item.volumeInfo.imageLinks?.thumbnail
        ? item.volumeInfo.imageLinks.thumbnail + '&fife=w400'
        : DEFAULT_IMAGE_URL,
    }));
};

export const useGoogleBooksSearch = () => {
  const [queryParams, setQueryParams] = useState<GoogleBooksSearchParams>({
    bookTitle: '',
  });

  const debouncedSetQueryParams = debounce(setQueryParams, 300);

  const query = useQuery({
    queryKey: [
      'GoogleBooksSearch',
      queryParams.bookTitle,
      queryParams.authorName,
    ],
    queryFn: () => fetchGoogleBooksSearch(queryParams),
    enabled: !!queryParams.bookTitle,
  });

  return { ...query, setBooksSearchParams: debouncedSetQueryParams };
};
