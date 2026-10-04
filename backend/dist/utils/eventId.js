import crypto from 'crypto';
/**
 * Generates unique non-sequential event IDs.
 * Format: ATT-<timestamp>-<random>
 */
export function generateEventId() {
    const timestamp = Date.now();
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let random = '';
    const bytes = crypto.randomBytes(5);
    for (let i = 0; i < 5; i++) {
        random += chars[bytes[i] % chars.length];
    }
    return `ATT-${timestamp}-${random}`;
}
