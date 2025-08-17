# Health Notifications Implementation

This document explains the implementation of the health notification system in the Simple Coding Time Tracker extension.

## Overview

The health notification system provides proactive reminders to promote healthy coding habits through:
- Eye rest reminders (20-20-20 rule)
- Stretch reminders for physical health
- Break suggestions for mental wellness
- One-click pause functionality

## Architecture

### Core Components

#### 1. HealthNotificationManager Class
Located in `src/healthNotifications.ts`

```typescript
export class HealthNotificationManager {
    private eyeRestTimer?: any;
    private stretchTimer?: any;
    private breakTimer?: any;
    private settings!: HealthNotificationSettings;
    private onPauseCallback?: () => void;
    private isActive: boolean = false;
}
```

#### 2. Configuration Interface
```typescript
export interface HealthNotificationSettings {
    eyeRestInterval: number; // minutes
    stretchInterval: number; // minutes  
    breakThreshold: number; // minutes
    enableNotifications: boolean;
}
```

### Integration Points

#### TimeTracker Integration
The health notification manager is integrated into the existing `TimeTracker` class:

```typescript
export class TimeTracker {
    private healthManager: HealthNotificationManager;
    
    constructor(database: Database) {
        // ... existing code ...
        this.healthManager = new HealthNotificationManager(() => this.pauseTimer());
    }
}
```

#### Configuration Settings
Added to `package.json` configuration:

```json
{
  "simpleCodingTimeTracker.health.enableNotifications": {
    "type": "boolean",
    "default": true,
    "description": "Enable health notifications during coding sessions"
  },
  "simpleCodingTimeTracker.health.eyeRestInterval": {
    "type": "number",
    "default": 20,
    "description": "Interval for eye rest reminders (minutes)"
  },
  "simpleCodingTimeTracker.health.stretchInterval": {
    "type": "number", 
    "default": 45,
    "description": "Interval for stretch reminders (minutes)"
  },
  "simpleCodingTimeTracker.health.breakThreshold": {
    "type": "number",
    "default": 120,
    "description": "Coding duration before suggesting a break (minutes)"
  }
}
```

## Implementation Details

### Enhanced Notification Visibility

The system uses a **three-tier notification approach** for optimal user attention:

1. **Information Level**: Not used for health notifications (too subtle)
2. **Warning Level**: Used for eye rest and stretch reminders
   - Orange/yellow color for visibility
   - Non-blocking but persistent
   - Clear action buttons for user choice
3. **Error Level Modal**: Used for break notifications
   - Red color for urgency
   - Modal behavior blocks UI until addressed
   - Multiple break duration options

### Persistence Strategy

All notifications are designed to be **persistent** rather than auto-dismissing:
- No timeout-based dismissal
- User must actively interact with notification
- Prevents accidental ignoring of health reminders
- Maintains user control through clear action buttons

### Timer Management

The system uses three independent timers:

1. **Eye Rest Timer**: Triggers every 20 minutes (configurable)
2. **Stretch Timer**: Triggers every 45 minutes (configurable)  
3. **Break Timer**: Triggers every 120 minutes (configurable)

Each timer is implemented using `setTimeout` with automatic restart:

```typescript
private startEyeRestReminder(): void {
    this.eyeRestTimer = setTimeout(() => {
        this.showEyeRestNotification();
        // Restart timer for next reminder
        if (this.isActive) {
            this.startEyeRestReminder();
        }
    }, this.settings.eyeRestInterval * 60 * 1000);
}
```

### Notification Types

#### 1. Eye Rest Notification
- Shows **warning-level message** for prominence (orange/yellow color)
- Includes "Pause Timer" and "Got it!" buttons
- **Non-blocking** but persistent until dismissed

```typescript
private async showEyeRestNotification(): Promise<void> {
    const pauseAction = 'Pause Timer';
    const dismissAction = 'Got it!';
    const result = await vscode.window.showWarningMessage(
        '👁️ EYE HEALTH REMINDER: Look at something 20 feet away for 20 seconds (20-20-20 rule)',
        { modal: false }, // Non-blocking but prominent
        pauseAction,
        dismissAction
    );

    if (result === pauseAction && this.onPauseCallback) {
        this.onPauseCallback();
    }
}
```

#### 2. Stretch Notification
- Similar pattern to eye rest with **warning-level visibility**
- **Persistent** until user interaction

#### 3. Break Notification
- **Error-level modal notification** for maximum attention (red color)
- **Blocks UI** until user responds - cannot be ignored
- Multiple break options available
- User must choose an option to proceed

```typescript
private async showBreakNotification(): Promise<void> {
    const result = await vscode.window.showErrorMessage(
        '🚨 HEALTH BREAK REQUIRED: You\'ve been coding for 2+ hours! Take a break now for your health.',
        { modal: true }, // Modal - blocks UI until dismissed
        pauseAction,
        quickStretch,
        eyeRest, 
        coffeeBreak,
        properBreak
    );
    // ... handling logic
}
```

### Lifecycle Management

#### Startup
```typescript
async startTracking(reason: string = 'manual') {
    if (!this.isTracking) {
        // ... existing tracking logic ...
        
        // Start health notifications
        this.healthManager.start();
    }
}
```

#### Shutdown
```typescript
stopTracking(reason?: string) {
    if (this.isTracking) {
        // ... existing stopping logic ...
        
        // Stop health notifications
        this.healthManager.stop();
    }
}
```

#### Pause Functionality
```typescript
pauseTimer() {
    this.stopTracking('health notification pause');
    vscode.window.showInformationMessage('Timer paused. It will resume when you start typing again.');
}
```

### Configuration Updates

The system responds to configuration changes in real-time:

```typescript
public updateConfiguration() {
    const config = vscode.workspace.getConfiguration('simpleCodingTimeTracker');
    // ... existing configuration ...
    
    // Update health notification settings
    if (this.healthManager) {
        this.healthManager.updateSettings();
    }
}
```

## Commands

### Toggle Health Notifications
Registered in `extension.ts`:

```typescript
let toggleHealthCommand = vscode.commands.registerCommand('simpleCodingTimeTracker.toggleHealthNotifications', async () => {
    const config = vscode.workspace.getConfiguration('simpleCodingTimeTracker');
    const currentEnabled = config.get('health.enableNotifications', true);
    await config.update('health.enableNotifications', !currentEnabled, vscode.ConfigurationTarget.Global);
    
    const message = !currentEnabled ? 
        'Health notifications enabled! 💡 You\'ll receive reminders for eye rest, stretching, and breaks.' :
        'Health notifications disabled.';
    vscode.window.showInformationMessage(message);
});
```

## Error Handling

The system includes robust error handling:
- Graceful timer cleanup on disposal
- Safe configuration loading with defaults
- Proper null checking for callbacks

## Performance Considerations

- **Lightweight Timers**: Uses efficient setTimeout approach
- **Minimal Resource Usage**: Only active when time tracking is active
- **Automatic Cleanup**: Properly disposes of resources when not needed
- **Strategic Notification Levels**: 
  - Warning-level for regular reminders (non-blocking)
  - Error-level modal for critical breaks (blocking but necessary)
- **Persistent Design**: Prevents notification dismissal accidents while maintaining user control

## Testing

To test the health notification system:

1. Enable notifications in settings
2. Start coding to activate time tracking
3. Wait for notifications (or temporarily reduce intervals for testing)
4. Verify pause functionality works correctly
5. Test configuration changes take effect immediately

## Future Enhancements

Potential improvements for the health notification system:
- Different notification styles (modal vs toast)
- Custom health tips rotation
- Integration with Do Not Disturb modes
- Break duration tracking
- Health statistics and insights
