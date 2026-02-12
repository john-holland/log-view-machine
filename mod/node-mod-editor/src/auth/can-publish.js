/**
 * Pure logic: can the user publish?
 * Requires reviewed; when publishRequiresLogin is true, also requires logged-in user.
 * @param {boolean} hasReviewed
 * @param {boolean} publishRequiresLogin
 * @param {boolean} isLoggedIn
 * @returns {boolean}
 */
export function canPublish(hasReviewed, publishRequiresLogin, isLoggedIn) {
  if (!hasReviewed) return false;
  if (publishRequiresLogin && !isLoggedIn) return false;
  return true;
}
