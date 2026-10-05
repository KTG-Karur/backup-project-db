'use strict';

const { sendNotification, sendMulticastNotification } = require('../helpers/firebase');

/**
 * Send a push notification to one device token via FCM V1 API.
 *
 * @param {string} fcmToken
 * @param {string} title
 * @param {string} body
 * @param {object} data   - optional key-value data payload
 * @returns {Promise<{success: boolean, messageId?: string, reason?: string}>}
 */
async function sendFCMNotification(fcmToken, title, body, data = {}) {
    if (!fcmToken) return { success: false, reason: 'FCM token not provided' };

    try {
        const messageId = await sendNotification(fcmToken, title, body, data);
        return { success: true, messageId };
    } catch (err) {
        console.error(`[FCM] Single send failed: ${err.message}`);
        return { success: false, reason: err.message };
    }
}

/**
 * Send the same push notification to multiple device tokens via FCM V1 API.
 *
 * @param {string[]} tokens
 * @param {string}   title
 * @param {string}   body
 * @param {object}   data    - optional key-value data payload
 * @returns {Promise<{success: boolean, successCount: number, failureCount: number, results: object[]}>}
 */
async function sendFCMToMany(tokens, title, body, data = {}) {
    const validTokens = (tokens || []).filter(Boolean);
    if (validTokens.length === 0) {
        return { success: false, successCount: 0, failureCount: 0, reason: 'No valid tokens provided' };
    }

    try {
        const batchResponse = await sendMulticastNotification(validTokens, title, body, data);
        const successCount = batchResponse.successCount || 0;
        const failureCount = batchResponse.failureCount || 0;

        if (successCount === 0) {
            console.error(`[FCM] Multicast failed — all ${failureCount} sends failed`);
        }

        return {
            success: successCount > 0,
            successCount,
            failureCount,
            results: batchResponse.responses || []
        };
    } catch (err) {
        console.error(`[FCM] Multicast error: ${err.message}`);
        return { success: false, successCount: 0, failureCount: validTokens.length, reason: err.message };
    }
}

module.exports = { sendFCMNotification, sendFCMToMany };
