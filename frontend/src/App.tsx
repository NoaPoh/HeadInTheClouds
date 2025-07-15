import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import RegistrationScreen from './components/RegistrationScreen/RegistrationScreen';
import LoginScreen from './components/LoginScreen/LoginScreen';
import ProfileScreen from './components/ProfileScreen/ProfileScreen';
import Navbar from './components/Navbar/Navbar';
import EditProfileScreen from './components/EditProfileScreen/EditProfileScreen';
import FeedScreen from './components/FeedScreen/FeedScreen';
import CreatePostScreen from './components/CreatePostScreen/CreatePostScreen';
import LoggedInUserGuard from './components/LoggedInUserGuard/LoggedInUserGuard';
import { createStore, Provider } from 'jotai';
import PostDetailScreen from './components/PostDetailScreen/PostDetailScreen';
import { GoogleOAuthProvider } from '@react-oauth/google';

const customStore = createStore();

function App() {
  console.log(process.env);
  return (
    <GoogleOAuthProvider
      clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ''}
    >
      <Provider store={customStore}>
        <LoggedInUserGuard>
          <Navbar />
          <Suspense fallback={<div>Loading...</div>}>
            <div className="app">
              <Routes>
                <Route path="/" element={<FeedScreen />} />
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/register" element={<RegistrationScreen />} />
                <Route path="/profile" element={<ProfileScreen />} />
                <Route path="/post/create" element={<CreatePostScreen />} />
                <Route
                  path="/post/edit/:id"
                  element={<CreatePostScreen edit />}
                />
                <Route path="/profile/edit" element={<EditProfileScreen />} />
                <Route path="/post/:id" element={<PostDetailScreen />} />
              </Routes>
            </div>
          </Suspense>
        </LoggedInUserGuard>
      </Provider>
    </GoogleOAuthProvider>
  );
}

export default App;
