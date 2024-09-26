"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTime = void 0;
function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
}
exports.formatTime = formatTime;
// Add other utility functions as needed
//# sourceMappingURL=utils.js.map