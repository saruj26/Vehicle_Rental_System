import Notification from '../models/Notification.js';

/**
 * Create an in-app notification. Fire-and-forget friendly: never throws into
 * the request path (logs and swallows errors).
 */
export async function notify({ user, type, title, message, link, meta }) {
  try {
    return await Notification.create({ user, type, title, message, link, meta });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('notify() failed:', err.message);
    return null;
  }
}

export default notify;
