import { google } from "googleapis";
import { env } from "../../config/env.js";

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI
);

// Scopes we need for Calendar and Tasks
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/tasks",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

// In-memory token store (for MVP — in production you'd use a database)
const tokenStore = new Map();

export const getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
};

export const handleCallback = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Get user info to use as key
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();

  // Store tokens by user email
  tokenStore.set(data.email, {
    tokens,
    user: {
      email: data.email,
      name: data.name,
      picture: data.picture,
    },
  });

  return { user: data, tokens };
};

export const getAuthenticatedClient = (email) => {
  const stored = tokenStore.get(email);
  if (!stored) return null;

  const client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );
  client.setCredentials(stored.tokens);
  return client;
};

export const getUserByEmail = (email) => {
  const stored = tokenStore.get(email);
  return stored ? stored.user : null;
};

// Get first logged-in user (for MVP single-user mode)
export const getFirstUser = () => {
  const first = tokenStore.entries().next().value;
  return first ? { email: first[0], ...first[1] } : null;
};

// Logout — clear all stored tokens
export const logoutAll = () => {
  tokenStore.clear();
};
