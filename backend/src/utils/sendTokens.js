/**
 * Hapus field sensitif dari object user sebelum dikirim ke client.
 */
const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, refresh_token, refreshToken, ...safe } = user;
  return safe;
};

module.exports = { sanitizeUser };
