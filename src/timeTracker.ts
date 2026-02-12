import * as vscode from 'vscode';
import { ActivityTracker } from './activityTracker';
import { StorageManager } from './storageManager';

/**
 * Runs a 10-second interval tick that checks activity and accumulates time.
 */
export class TimeTracker implements vscode.Disposable {
    private timer: ReturnType<typeof setInterval> | undefined;
    private activityTracker: ActivityTracker;
    private storageManager: StorageManager;
    private onTickCallbacks: (() => void)[] = [];
    private lastKeystrokeCount: number = 0;

    private static readonly TICK_INTERVAL_MS = 10_000; // 10 seconds
    private static readonly TICK_SECONDS = 10;

    constructor(activityTracker: ActivityTracker, storageManager: StorageManager) {
        this.activityTracker = activityTracker;
        this.storageManager = storageManager;
    }

    /**
     * Starts the tick interval.
     */
    public start(): void {
        if (this.timer) {
            return;
        }
        this.timer = setInterval(() => this.tick(), TimeTracker.TICK_INTERVAL_MS);
    }

    /**
     * Registers a callback to be invoked on every tick (for status bar refresh).
     */
    public onTick(callback: () => void): void {
        this.onTickCallbacks.push(callback);
    }

    /**
     * Core tick logic: checks if user is active, records time.
     */
    private tick(): void {
        const config = vscode.workspace.getConfiguration('codepulse');
        const idleTimeoutSec = config.get<number>('idleTimeout', 120);
        const idleTimeoutMs = idleTimeoutSec * 1000;

        if (this.activityTracker.isActive(idleTimeoutMs)) {
            const langId = this.activityTracker.getCurrentLanguageId();
            this.storageManager.addActiveTime(TimeTracker.TICK_SECONDS, langId);
        }

        // Track keystrokes since last tick
        const currentKeystrokeCount = this.activityTracker.getSessionKeystrokes();
        const newKeystrokes = currentKeystrokeCount - this.lastKeystrokeCount;
        if (newKeystrokes > 0) {
            this.storageManager.addKeystrokes(newKeystrokes);
            this.lastKeystrokeCount = currentKeystrokeCount;
        }

        // Notify listeners (status bar, etc.)
        for (const cb of this.onTickCallbacks) {
            cb();
        }
    }

    public dispose(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
        this.onTickCallbacks = [];
    }
}
