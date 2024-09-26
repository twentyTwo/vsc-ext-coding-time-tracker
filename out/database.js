"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
class Database {
    constructor(context) {
        this.context = context;
    }
    addEntry(date, project, timeSpent) {
        return __awaiter(this, void 0, void 0, function* () {
            const dateString = date.toISOString().split('T')[0];
            const entries = this.getEntries();
            const existingEntryIndex = entries.findIndex(entry => entry.date === dateString && entry.project === project);
            if (existingEntryIndex !== -1) {
                // Update existing entry
                entries[existingEntryIndex].timeSpent += timeSpent;
            }
            else {
                // Add new entry
                entries.push({ date: dateString, project, timeSpent });
            }
            yield this.context.globalState.update('timeEntries', entries);
        });
    }
    getEntries() {
        return this.context.globalState.get('timeEntries', []);
    }
    getSummaryData() {
        return __awaiter(this, void 0, void 0, function* () {
            const entries = this.getEntries();
            const dailySummary = {};
            const projectSummary = {};
            let totalTime = 0;
            for (const entry of entries) {
                dailySummary[entry.date] = (dailySummary[entry.date] || 0) + entry.timeSpent;
                projectSummary[entry.project] = (projectSummary[entry.project] || 0) + entry.timeSpent;
                totalTime += entry.timeSpent;
            }
            return {
                dailySummary,
                projectSummary,
                totalTime
            };
        });
    }
}
exports.Database = Database;
//# sourceMappingURL=database.js.map