/**
 * cloudinary.js — Cloudinary v2 SDK initialisation
 *
 * Credentials are loaded from environment variables.
 * The application starts cleanly even when Cloudinary keys are absent —
 * upload endpoints will return a 503 if the config is missing, rather than
 * crashing the process on startup.
 */

const cloudinary = require('cloudinary').v2;

let configured = false;

function configureCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn(
      '[Cloudinary] Credentials not fully set — upload features will be unavailable.'
    );
    configured = false;
    return;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });

  configured = true;
  console.log('[Cloudinary] Configured successfully.');
}

/**
 * Returns true if Cloudinary was successfully configured.
 * Use this guard in upload middleware to return a clean error instead of
 * crashing when credentials are missing.
 */
function isCloudinaryConfigured() {
  return configured;
}

module.exports = { configureCloudinary, isCloudinaryConfigured, cloudinary };
