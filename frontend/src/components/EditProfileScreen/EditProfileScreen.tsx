import React, { ChangeEvent, useEffect, useState } from 'react';
import './EditProfileScreen.scss';
import { useUpdateUser } from '../../hooks/api/useUpdateUser';
import { loggedInUserAtom } from '../../context/LoggedInUserAtom';
import { useAtomValue } from 'jotai';
import { UploadImageButton } from '../UploadImageButton/UploadImageButton';
import { makeFileUrl } from '../../utils/makeFileUrl';
import { Button, TextField } from '@mui/material';

const EditProfileScreen: React.FC = () => {
  const loggedInUser = useAtomValue(loggedInUserAtom);
  const [username, setUsername] = useState<string>(
    loggedInUser?.username || ''
  );
  const [profileImageFile, setProfileImageFile] = useState<File | undefined>();

  const [previewImgSrc, setPreviewImgSrc] = useState<string>(
    loggedInUser?.profilePicture || ''
  );

  const { mutate: updateUser } = useUpdateUser();

  useEffect(() => {
    if (loggedInUser) {
      setUsername(loggedInUser.username);
      if (loggedInUser.profilePicture) {
        const loggedInUserImageUrl = makeFileUrl(loggedInUser.profilePicture);
        setPreviewImgSrc(loggedInUserImageUrl);
      }
    }
  }, [loggedInUser]);

  const handleSave = () => {
    updateUser({
      userId: loggedInUser?._id,
      profilePictureFile: profileImageFile,
      username,
    });
    // http://localhost/media/<>
  };

  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
    };

  const onUploadImage = (image: File) => {
    setProfileImageFile(image);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImgSrc(e.target?.result as string);
    };

    reader.readAsDataURL(image as Blob);
  };

  return (
    <div className="edit-profile">
      <div className="edit-profile__card">
        <h2>Edit Profile</h2>

        <TextField
          fullWidth
          label="Username"
          value={username}
          onChange={handleInputChange(setUsername)}
        />
        <UploadImageButton onUploadImage={onUploadImage} />
        <div className="profile-picture">
          <img src={previewImgSrc} alt="" />
        </div>
        <Button fullWidth variant="contained" onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
};

export default EditProfileScreen;
