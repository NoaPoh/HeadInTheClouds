export const makeFileUrl = (filePath: string) => {
  return filePath.charAt(0) === '/'
    ? process.env.REACT_APP_API_URL + filePath
    : filePath;
};
