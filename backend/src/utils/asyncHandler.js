/**
 * Membungkus async controller agar error ditangkap & diteruskan ke error handler.
 * @param {(req: import('express').Request, res, next) => Promise<any>} fn
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
