import { FormEvent, FunctionComponent, useEffect, useState } from 'react';
import {
  Button,
  TextField,
  Autocomplete,
  Box,
  CircularProgress,
} from '@mui/material';
import BookIcon from '@mui/icons-material/Book';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import './CreatePostScreen.scss';
import { NewPostFormData } from '../../types/post';
import { useCreatePost } from '../../hooks/api/useCreatePost';
import { useUpdatePost } from '../../hooks/api/useUpdatePost';
import { useGetPost } from '../../hooks/api/useGetPost';
import { useAtomValue } from 'jotai';
import { loggedInUserAtom } from '../../context/LoggedInUserAtom';
import PersonIcon from '@mui/icons-material/Person';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useParams } from 'react-router-dom';
import { UploadImageButton } from '../UploadImageButton/UploadImageButton';
import { makeFileUrl } from '../../utils/makeFileUrl';
import { DEFAULT_IMAGE_URL } from '../../utils/constants';
import { useGoogleBooksSearch } from '../../hooks/googleAPI/useGoogleBooksSearch';
import { GoogleBooksRelevantBookData } from '../../types/googleBooks';

interface CreatePostScreenProps {
  edit?: boolean;
}

const CreatePostScreen: FunctionComponent<CreatePostScreenProps> = ({
  edit,
}) => {
  const { id: postId } = useParams<{ id: string }>();
  const { data: existingPost } = useGetPost(postId || '');

  const [selectedBookId, setSelectedBookId] = useState<string>();
  const [selectedBookPageCount, setSelectedBookPageCount] = useState<
    number | undefined
  >();
  const [bookTitle, setBookTitle] = useState<string>(
    existingPost?.bookTitle || ''
  );
  const [authorName, setAuthorName] = useState<string>(
    existingPost?.authorName || ''
  );
  const [content, setContent] = useState<string>(existingPost?.content || '');
  const [readingProgress, setReadingProgress] = useState<number>(
    existingPost?.readingProgress || 0
  );
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [imageURL, setImageURL] = useState<string>(
    existingPost?.imageUrl || DEFAULT_IMAGE_URL
  );

  const user = useAtomValue(loggedInUserAtom);
  const {
    data: bookSearchResults,
    isLoading: bookSearchIsLoading,
    setBooksSearchParams: setBookCoverParams,
  } = useGoogleBooksSearch();
  const { isLoading: createIsLoading, mutate: createPost } = useCreatePost();
  const { isLoading: updateIsLoading, mutate: updatePost } = useUpdatePost();

  useEffect(() => {
    console.log('bookSearchResults', bookSearchResults);
  }, [bookSearchResults]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();

    const data: NewPostFormData = {
      bookTitle,
      authorName,
      content,
      readingProgress,
    };

    console.log('data', data);
    console.log('imageFile', imageFile);
    console.log('imageURL', imageURL);

    const imageRelevantData = imageFile
      ? { imageFile }
      : { imageUrl: imageURL };

    edit && postId
      ? updatePost({ _id: postId, ...data, ...imageRelevantData })
      : createPost({
          userId: user._id,
          ...data,
          ...imageRelevantData,
        });
  };

  useEffect(() => {
    if (existingPost) {
      console.log('existingPost', existingPost);
      setBookTitle(existingPost.bookTitle);
      setAuthorName(existingPost.authorName || '');
      setContent(existingPost.content);
      setReadingProgress(existingPost.readingProgress || 0);
      setImageURL(existingPost.imageUrl || DEFAULT_IMAGE_URL);
    }
  }, [existingPost]);

  const onUploadImage = (image: File) => {
    setImageFile(image);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageURL(e.target?.result as string);
    };

    reader.readAsDataURL(image as Blob);
  };

  return (
    <div className="CreatePostScreen">
      <div className="CreatePostScreen__card">
        <form className="CreatePostScreen__form" onSubmit={onSubmit}>
          {!edit && <h2 className="title">New Post</h2>}
          <>
            <Autocomplete
              freeSolo
              disablePortal
              loading={bookSearchIsLoading}
              options={bookSearchResults || []}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              filterOptions={(x) => x}
              getOptionKey={(option) =>
                typeof option === 'string' ? option : option.id
              }
              getOptionLabel={(option) =>
                typeof option === 'string' ? option : option.bookTitle
              }
              value={
                bookSearchResults?.find((b) => b.id === selectedBookId) || null
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  className="input-field"
                  label="Search a book"
                  placeholder={bookTitle}
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {bookSearchIsLoading ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                      startAdornment: <BookIcon />,
                    },
                    htmlInput: {
                      ...params.inputProps,
                      autoComplete: 'new-password', // disable autocomplete and autofill
                    },
                  }}
                />
              )}
              renderOption={(props, option: GoogleBooksRelevantBookData) => {
                const { key, ...optionProps } = props;
                return (
                  <Box
                    key={key}
                    component="li"
                    sx={{ '& > img': { mr: 1, flexShrink: 0 } }}
                    {...optionProps}
                  >
                    <img
                      loading="lazy"
                      width="40"
                      srcSet={option.imageUrl}
                      src={option.imageUrl}
                      alt=""
                    />
                    {option.bookTitle} by {option.authorName}
                  </Box>
                );
              }}
              onInputChange={(_, value: string) => {
                console.log('onInputChange value', value);
                setBookCoverParams({ bookTitle: value });
              }}
              onChange={(_, value) => {
                console.log('onChange value', value);
                if (typeof value === 'string') {
                  return;
                }

                setSelectedBookPageCount(value?.pageCount);
                setBookTitle(value?.bookTitle || '');
                setAuthorName(value?.authorName || '');
                setSelectedBookId(value?.id);
                setImageURL(value?.imageUrl || DEFAULT_IMAGE_URL);
              }}
            />
          </>
          <TextField
            disabled
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Author name"
            className="input-field"
            type="text"
            slotProps={{
              input: {
                startAdornment: <PersonIcon />,
              },
            }}
          />
          <TextField
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input-field"
            type="text"
            placeholder="Your thoughts"
            slotProps={{
              input: {
                startAdornment: <LightbulbIcon />,
              },
            }}
          />
          <TextField
            value={readingProgress || ''}
            onChange={(e) => setReadingProgress(+e.target.value)}
            className="input-field"
            type="text"
            placeholder="Your progress (e.g. 50 pages)"
            slotProps={{
              input: {
                startAdornment: <MenuBookIcon />,
                endAdornment: (
                  <span>
                    {selectedBookPageCount ? '/' + selectedBookPageCount : ''}
                  </span>
                ),
              },
            }}
          />

          <Button
            disabled={!bookTitle}
            type="submit"
            variant="contained"
            className="button"
            loading={createIsLoading || updateIsLoading}
            loadingPosition="end"
          >
            Publish
          </Button>
        </form>
        <div className="CreatePostScreen__image-preview-container">
          <img
            src={makeFileUrl(imageURL)}
            alt="preview"
            className="CreatePostScreen__image-preview"
          />
          <div className="CreatePostScreen__image-preview-absoluted">
            <UploadImageButton onUploadImage={onUploadImage} mini />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostScreen;
