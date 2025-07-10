function getStorageValue<D>(key: string, defaultValue: D): D {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

export const useLocalStorage = <T>(
  key: string,
  defaultValue: T
): [() => T, (value: T) => void] => {
  const getFromLocalStorage = () => getStorageValue(key, defaultValue);

  const setInLocalStorage = (value: T) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  return [getFromLocalStorage, setInLocalStorage];
};
