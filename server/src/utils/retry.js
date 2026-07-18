export const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const retry = async (fn, retries = 3, delay = 1000) => {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      console.log(`Retry ${attempt}/${retries}`);

      if (attempt < retries) {
        await sleep(delay);
      }
    }
  }

  throw lastError;
};