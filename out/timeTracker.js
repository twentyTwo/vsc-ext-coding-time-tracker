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
exports.TimeTracker = void 0;
const vscode = require("vscode");
class TimeTracker {
    constructor(database) {
        this.isTracking = false;
        this.startTime = 0;
        this.currentProject = '';
        this.updateInterval = null;
        this.saveInterval = null;
        this.database = database;
    }
    startTracking() {
        if (!this.isTracking) {
            this.isTracking = true;
            this.startTime = Date.now();
            this.currentProject = this.getCurrentProject();
            this.updateInterval = setInterval(() => this.updateCurrentSession(), 1000);
            this.saveInterval = setInterval(() => this.saveCurrentSession(), 60000); // Save every minute
        }
    }
    stopTracking() {
        if (this.isTracking) {
            this.isTracking = false;
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
            if (this.saveInterval) {
                clearInterval(this.saveInterval);
                this.saveInterval = null;
            }
            this.saveCurrentSession();
        }
    }
    updateCurrentSession() {
        // This method will be called every second when tracking is active
        // You can emit an event here if you want to update the UI more frequently
    }
    saveCurrentSession() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isTracking) {
                const duration = (Date.now() - this.startTime) / 60000; // Convert to minutes
                yield this.database.addEntry(new Date(), this.currentProject, duration);
                this.startTime = Date.now(); // Reset the start time for the next interval
            }
        });
    }
    getCurrentProject() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        return workspaceFolders ? workspaceFolders[0].name : 'Unknown Project';
    }
    getTodayTotal() {
        const today = new Date().toISOString().split('T')[0];
        const entries = this.database.getEntries();
        const todayTotal = entries
            .filter((entry) => entry.date === today)
            .reduce((sum, entry) => sum + entry.timeSpent, 0);
        // Add the current session time if tracking is active
        if (this.isTracking) {
            const currentSessionTime = (Date.now() - this.startTime) / 60000;
            return todayTotal + currentSessionTime;
        }
        return todayTotal;
    }
    getCurrentProjectTime() {
        const today = new Date().toISOString().split('T')[0];
        const currentProject = this.getCurrentProject();
        const entries = this.database.getEntries();
        const currentProjectTime = entries
            .filter((entry) => entry.date === today && entry.project === currentProject)
            .reduce((sum, entry) => sum + entry.timeSpent, 0);
        // Add the current session time if tracking is active
        if (this.isTracking && this.currentProject === currentProject) {
            const currentSessionTime = (Date.now() - this.startTime) / 60000;
            return currentProjectTime + currentSessionTime;
        }
        return currentProjectTime;
    }
    getWeeklyTotal() {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return this.getTotalSince(oneWeekAgo);
    }
    getMonthlyTotal() {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return this.getTotalSince(oneMonthAgo);
    }
    getAllTimeTotal() {
        return this.database.getEntries()
            .reduce((sum, entry) => sum + entry.timeSpent, 0);
    }
    getTotalSince(date) {
        const dateString = date.toISOString().split('T')[0];
        return this.database.getEntries()
            .filter(entry => entry.date >= dateString)
            .reduce((sum, entry) => sum + entry.timeSpent, 0);
    }
    dispose() {
        this.stopTracking();
    }
}
exports.TimeTracker = TimeTracker;
//# sourceMappingURL=timeTracker.js.map