export const removeDuplicate = (arr = []) => {
  const seen = new Set();
  return arr.filter((item) => {
    const key = item.tempId || item.id;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export function debounce(fn, delay) {
  let timer = null;

  const debounced = (...args) => {
    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };

  // Optional cancel method
  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced;
}

export const getStorage = (key) => {
  const data = localStorage.getItem(key);

  if (data) {
    return JSON.parse(data);
  }

  return null;
};

export const safelyBind = (socket, event, handler) => {
  socket.off(event, handler);
  socket.on(event, handler);
};
