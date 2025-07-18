export const makeFileUrl = (filePath: string) => {
  return filePath.charAt(0) === '/'
    ? import.meta.env.VITE_API_URL + filePath
    : filePath;
};
