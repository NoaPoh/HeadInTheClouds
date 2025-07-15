import React from 'react';
import './LoadingSpinner.scss';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="spinner__container">
      <div className="spinner">
        <div className="spinner__circle"></div>
        <div className="spinner__circle"></div>
        <div className="spinner__circle"></div>
        <div className="spinner__circle"></div>
      </div>
      <p className="spinner__text">Loading...</p>
    </div>
  );
};

export default LoadingSpinner;