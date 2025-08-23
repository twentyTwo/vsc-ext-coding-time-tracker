import * as assert from 'assert';
import { formatTime } from '../../utils';

suite('Utils Tests', () => {
    suite('formatTime', () => {
        test('should format whole hours correctly', () => {
            assert.strictEqual(formatTime(60), '1h 0m');
            assert.strictEqual(formatTime(120), '2h 0m');
            assert.strictEqual(formatTime(180), '3h 0m');
        });

        test('should format whole minutes correctly', () => {
            assert.strictEqual(formatTime(30), '0h 30m');
            assert.strictEqual(formatTime(45), '0h 45m');
            assert.strictEqual(formatTime(59), '0h 59m');
        });

        test('should format hours and minutes correctly', () => {
            assert.strictEqual(formatTime(90), '1h 30m');
            assert.strictEqual(formatTime(145), '2h 25m');
            assert.strictEqual(formatTime(195), '3h 15m');
        });

        test('should round fractional minutes', () => {
            assert.strictEqual(formatTime(30.4), '0h 30m');
            assert.strictEqual(formatTime(30.5), '0h 31m');
            assert.strictEqual(formatTime(30.6), '0h 31m');
        });

        test('should handle zero time', () => {
            assert.strictEqual(formatTime(0), '0h 0m');
        });

        test('should handle large time values', () => {
            assert.strictEqual(formatTime(1440), '24h 0m'); // 24 hours
            assert.strictEqual(formatTime(1500), '25h 0m'); // 25 hours
        });

        test('should handle fractional hours', () => {
            assert.strictEqual(formatTime(90.5), '1h 31m'); // 1.5 hours + 0.5 minutes
            assert.strictEqual(formatTime(150.7), '2h 31m'); // 2.5 hours + 0.7 minutes
        });

        test('should handle very small values', () => {
            assert.strictEqual(formatTime(0.1), '0h 0m');
            assert.strictEqual(formatTime(0.5), '0h 1m');
            assert.strictEqual(formatTime(0.9), '0h 1m');
        });

        test('should handle negative values gracefully', () => {
            // Negative values might occur due to calculation errors
            assert.strictEqual(formatTime(-10), '0h -10m');
            assert.strictEqual(formatTime(-70), '-1h -10m'); // Corrected: -70 mins = -1h -10m
        });
    });
});
