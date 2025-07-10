import React, { useEffect } from 'react';
import './ProfileScreen.scss';
import { useFetchUser } from '../../hooks/api/useFetchUser';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import { loggedInUserAtom } from '../../context/LoggedInUserAtom';
import { useAtom } from 'jotai';
import MyPostList from './components/MyPostsList/MyPostsList';
import { makeFileUrl } from '../../utils/makeFileUrl';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';

const ProfileScreen: React.FC = () => {
  const [user, setUser] = useAtom(loggedInUserAtom);
  const {
    data: fetchedUser,
    isSuccess: fetchSucceeded,
    isLoading,
  } = useFetchUser(user._id);

  const navigate = useNavigate();

  const navigateToEditProfile = () => {
    navigate('/profile/edit');
  };

  useEffect(() => {
    if (fetchSucceeded && fetchedUser) {
      setUser({
        _id: user._id,
        ...fetchedUser,
      });
    }
  }, [fetchSucceeded, fetchedUser, setUser, user._id]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="profile__container">
      <div className="profile__area1">
        <h2 className="profile__title">Profile</h2>
        {user && (
          <div className="profile__details">
            {user.profilePicture && (
              <img
                src={makeFileUrl(user.profilePicture)}
                alt="Profile"
                className="profile__picture"
              />
            )}
            <p className="profile__detail">
              <strong>Username:</strong> {user.username}
            </p>
            <p className="profile__detail">
              <strong>Email:</strong> {user.email}
            </p>
            <Button
              variant="contained"
              onClick={navigateToEditProfile}
              endIcon={<EditIcon />}
            >
              Edit Profile
            </Button>
          </div>
        )}
      </div>
      <MyPostList />
    </div>
  );
};

export default ProfileScreen;
