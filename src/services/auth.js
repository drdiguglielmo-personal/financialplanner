import Parse, { isBack4AppConfigured } from "./parseClient.js";

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function mapParseUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.get("name") || u.get("username") || "User",
    email: u.get("email") || u.get("username"),
  };
}

function toAuthError(err) {
  if (!err || typeof err !== "object") return new Error("Something went wrong. Try again.");
  const code = err.code;
  const msg = err.message || "";
  // Parse / Back4App common codes
  if (code === 101) return new Error("Invalid email or password.");
  if (code === 202) return new Error("An account with this email already exists.");
  if (code === 203) return new Error("This email is already registered.");
  if (code === 125) return new Error("Invalid email address.");
  if (code === 209) return new Error("Session expired. Please sign in again.");
  if (msg) return new Error(msg);
  return new Error("Something went wrong. Try again.");
}

function ensureConfigured() {
  if (!isBack4AppConfigured()) {
    throw new Error(
      "Back4App is not configured. Create a .env file with VITE_BACK4APP_APP_ID and VITE_BACK4APP_JS_KEY (see .env.example)."
    );
  }
}

export const AuthService = {
  /**
   * @returns {Promise<{ user: { id: string, name: string, email: string } }>}
   */
  async login(email, password) {
    ensureConfigured();
    try {
      const u = await Parse.User.logIn(normalizeEmail(email), password);
      return { user: mapParseUser(u) };
    } catch (e) {
      throw toAuthError(e);
    }
  },

  /**
   * @returns {Promise<{ user: { id: string, name: string, email: string } }>}
   */
  async register(name, email, password) {
    ensureConfigured();
    const em = normalizeEmail(email);
    const user = new Parse.User();
    user.set("username", em);
    user.set("password", password);
    user.set("email", em);
    user.set("name", name.trim());
    try {
      await user.signUp();
      return { user: mapParseUser(Parse.User.current()) };
    } catch (e) {
      throw toAuthError(e);
    }
  },

  async logout() {
    if (!isBack4AppConfigured()) return;
    try {
      await Parse.User.logOut();
    } catch {
      /* ignore */
    }
  },

  /**
   * Restore session from local storage and verify with the server.
   * @returns {Promise<{ user: { id: string, name: string, email: string } } | null>}
   */
  async getSession() {
    if (!isBack4AppConfigured()) return null;
    const u = Parse.User.current();
    if (!u) return null;
    try {
      await u.fetch();
      return { user: mapParseUser(u) };
    } catch {
      try {
        await Parse.User.logOut();
      } catch {
        /* ignore */
      }
      return null;
    }
  },
};
