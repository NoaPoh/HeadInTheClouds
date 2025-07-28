const debounce = (func: Function, wait: number, leading: boolean = false) => {
  let timeout: NodeJS.Timeout | undefined = undefined;
  return (...args: any[]) => {
    clearTimeout(timeout);
    if (leading && !timeout) {
      func.apply(this, args);
    }
    timeout = setTimeout(() => {
      timeout = undefined;
      if (!leading) {
        func.apply(this, args);
      }
    }, wait);
  };
};

export default debounce;
