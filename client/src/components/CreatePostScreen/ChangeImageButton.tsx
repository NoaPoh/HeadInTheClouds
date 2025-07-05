import { Button, styled } from '@mui/material';
import PhotoCameraBackIcon from '@mui/icons-material/PhotoCameraBack';
import { ChangeEvent, FunctionComponent } from 'react';

interface ChangeImageButtonProps {
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const ChangeImageButton: FunctionComponent<ChangeImageButtonProps> = (
  props
) => {
  return (
    <Button
      className="CreatePostScreen__image-preview-change"
      component="label"
      variant="contained"
      startIcon={<PhotoCameraBackIcon />}
    >
      change image
      <VisuallyHiddenInput
        type="file"
        accept="image/*"
        onChange={props.onChange}
        // multiple
      />
    </Button>
  );
};

export default ChangeImageButton;
