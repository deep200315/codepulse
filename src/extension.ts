import * as vscode from 'vscode';
import { ActivityTracker } from './activityTracker';
import { TimeTracker } from './timeTracker';
import { StorageManager } from './storageManager';
import { StatusBarManager } from './statusBarManager';
import { showStatsQuickPick, exportData } from './quickPickStats';

/**
 * Called when the extension is activated (onStartupFinished).
 */
export function activate(context: vscode.ExtensionContext): void {
    // Initialize managers
    const activityTracker = new ActivityTracker();
    const storageManager = new StorageManager(context);
    const statusBarManager = new StatusBarManager(activityTracker, storageManager);
    const timeTracker = new TimeTracker(activityTracker, storageManager);

    // Refresh status bar on every tick
    timeTracker.onTick(() => {
        statusBarManager.refresh();
    });

    // Start the 10s tick
    timeTracker.start();

    // Register commands
    const showStatsCmd = vscode.commands.registerCommand('codepulse.showStats', () => {
        showStatsQuickPick(storageManager, activityTracker);
    });

    const exportCmd = vscode.commands.registerCommand('codepulse.exportData', () => {
        exportData(storageManager);
    });

    // Register disposables
    context.subscriptions.push(
        activityTracker,
        storageManager,
        statusBarManager,
        timeTracker,
        showStatsCmd,
        exportCmd
    );
}

/**
 * Called when the extension is deactivated.
 */
export function deactivate(): void {
    // All cleanup is handled by disposables registered in context.subscriptions
}
