'use strict';

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let firebaseInitialized = false;

if (!admin.apps.length) {
    const serviceAccountPath = path.join(__dirname, '../ktg-live-tracking-firebase-adminsdk-fbsvc-53d1df558d.json');
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        firebaseInitialized = true;
    } else {
        console.warn(
            '[Firebase] WARNING: Service account key not found at:\n  ' + serviceAccountPath +
            '\n  Push notifications will be disabled. ' +
            'Download the key from Firebase Console → Project Settings → Service accounts.'
        );
    }
}

/**
 * Send FCM push notification to a single device token.
 * @param {string} token - FCM device token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional key-value data payload
 * @returns {Promise<string>} message ID
 */
async function sendNotification(token, title, body, data = {}) {
    if (!firebaseInitialized) {
        console.warn('[Firebase] sendNotification skipped — Firebase not initialized.');
        return null;
    }
    const message = {
        token,
        notification: { title, body },
        data: Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default' } } }
    };
    const response = await admin.messaging().send(message);
    return response;
}

/**
 * Send FCM push notification to multiple device tokens (up to 500).
 * @param {string[]} tokens - Array of FCM device tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional key-value data payload
 * @returns {Promise<admin.messaging.BatchResponse>}
 */
async function sendMulticastNotification(tokens, title, body, data = {}) {
    if (!firebaseInitialized) {
        console.warn('[Firebase] sendMulticastNotification skipped — Firebase not initialized.');
        return null;
    }
    const message = {
        tokens,
        notification: { title, body },
        data: Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default' } } }
    };
    const response = await admin.messaging().sendEachForMulticast(message);
    return response;
}

module.exports = { admin, sendNotification, sendMulticastNotification };
