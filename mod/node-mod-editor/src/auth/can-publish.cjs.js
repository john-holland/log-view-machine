/**
 * Pure logic: can the user publish? (CommonJS for Jest)
 * @param {boolean} hasReviewed
 * @param {boolean} publishRequiresLogin
 * @param {boolean} isLoggedIn
 * @returns {boolean}
 */
function canPublish(hasReviewed, publishRequiresLogin, isLoggedIn) {
  if (!hasReviewed) return false;
  if (publishRequiresLogin && !isLoggedIn) return false;
  return true;
}

module.exports = { canPublish };
