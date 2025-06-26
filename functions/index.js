/**
 * Cloud Functions for logistics system
 */

const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

// Initialize Firebase Admin SDK
admin.initializeApp();

// Log startup information
logger.info('Firebase Admin SDK initialized', {
  projectId: process.env.GCLOUD_PROJECT,
  nodeMajorVersion: process.versions.node.split('.')[0]
});

// Example function - can be removed if not needed
exports.helloWorld = functions.https.onRequest((req, res) => {
  logger.info("Hello logs!", {structuredData: true});
  res.send("Hello from Firebase!");
}); 