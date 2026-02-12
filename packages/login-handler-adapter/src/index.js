/**
 * LoginHandler adapter: validate username/password for /api/login.
 * Stub implementation accepts a single configured user; replace with DB or dotCMS for production.
 */

/**
 * Create a stub login handler that accepts one configured user (default admin/admin).
 * @param {{ acceptedUser?: string, acceptedPassword?: string }} [options]
 */
export function createStubLoginHandler(options = {}) {
  const acceptedUser = options.acceptedUser ?? 'admin';
  const acceptedPassword = options.acceptedPassword ?? 'admin';

  return {
    async login(credentials) {
      const { username, password } = credentials || {};
      if (!username || !password) return null;
      if (username === acceptedUser && password === acceptedPassword) {
        return {
          user: {
            id: acceptedUser,
            username: acceptedUser,
            email: undefined
          }
        };
      }
      return null;
    }
  };
}
