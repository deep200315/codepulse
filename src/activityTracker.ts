import * as vscode from 'vscode';

/**
 * Tracks user activity events (keystrokes, selections, focus) and calculates WPM.
 * Uses 1-second buckets for efficient keystroke tracking.
 */
export class ActivityTracker implements vscode.Disposable {
    private lastActivityTimestamp: number = Date.now();
    private windowFocused: boolean = true;
    private currentLanguageId: string = 'plaintext';
    private disposables: vscode.Disposable[] = [];

    // WPM tracking: use 1-second buckets instead of individual timestamps
    private keystrokeBuckets: Map<number, number> = new Map();
    private totalSessionKeystrokes: number = 0;

    // Batching: accumulate keystrokes and flush periodically
    private pendingKeystrokes: number = 0;
    private flushTimer: ReturnType<typeof setTimeout> | undefined;

    // Throttle selection changes (fires on EVERY cursor move)
    private lastSelectionUpdate: number = 0;

    private static readonly WPM_WINDOW_SECONDS = 30;
    private static readonly CHARS_PER_WORD = 5;
    private static readonly BATCH_DELAY_MS = 100; // Batch keystrokes every 100ms
    private static readonly SELECTION_THROTTLE_MS = 500; // Only process selection changes every 500ms

    constructor() {
        // Track text document changes (typing)
        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument((e) => {
                if (e.contentChanges.length > 0) {
                    this.onActivity();
                    // Count actual characters changed
                    const charCount = e.contentChanges.reduce((sum, change) => sum + change.text.length, 0);
                    this.recordKeystrokes(charCount);
                }
            })
        );

        // Track window focus
        this.disposables.push(
            vscode.window.onDidChangeWindowState((state) => {
                this.windowFocused = state.focused;
                if (state.focused) {
                    this.onActivity();
                }
            })
        );

        // Track active editor changes (language detection)
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (editor) {
                    this.currentLanguageId = editor.document.languageId;
                    this.onActivity();
                }
            })
        );

        // Set initial language from current editor
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            this.currentLanguageId = activeEditor.document.languageId;
        }
    }

    /**
     * Updates the last activity timestamp.
     */
    private onActivity(): void {
        this.lastActivityTimestamp = Date.now();
    }

    /**
     * Records keystrokes in 1-second buckets (much more efficient than individual timestamps).
     * Uses batching to avoid excessive Map operations.
     */
    private recordKeystrokes(charCount: number): void {
        if (charCount <= 0) {
            return;
        }

        // Accumulate in pending buffer
        this.pendingKeystrokes += charCount;
        this.totalSessionKeystrokes += charCount;

        // Schedule flush if not already scheduled
        if (!this.flushTimer) {
            this.flushTimer = setTimeout(() => this.flushKeystrokes(), ActivityTracker.BATCH_DELAY_MS);
        }
    }

    /**
     * Flushes pending keystrokes to the bucket map.
     */
    private flushKeystrokes(): void {
        if (this.pendingKeystrokes > 0) {
            const bucketKey = Math.floor(Date.now() / 1000);
            const current = this.keystrokeBuckets.get(bucketKey) ?? 0;
            this.keystrokeBuckets.set(bucketKey, current + this.pendingKeystrokes);
            this.pendingKeystrokes = 0;
        }
        this.flushTimer = undefined;
    }

    /**
     * Removes buckets older than the WPM window.
     */
    private pruneBuckets(): void {
        const cutoffTime = Math.floor(Date.now() / 1000) - ActivityTracker.WPM_WINDOW_SECONDS;
        for (const [bucket, _] of this.keystrokeBuckets) {
            if (bucket < cutoffTime) {
                this.keystrokeBuckets.delete(bucket);
            }
        }
    }

    /**
     * Returns true if the user is currently active (not idle, window focused).
     */
    public isActive(idleTimeoutMs: number): boolean {
        if (!this.windowFocused) {
            return false;
        }
        return (Date.now() - this.lastActivityTimestamp) < idleTimeoutMs;
    }

    /**
     * Calculates current WPM using the 30-second sliding window.
     * Returns 0 if no recent keystrokes.
     */
    public getWpm(): number {
        this.pruneBuckets(); // Clean up old data

        if (this.keystrokeBuckets.size === 0) {
            return 0;
        }

        // Sum all characters in the window
        let totalChars = 0;
        for (const count of this.keystrokeBuckets.values()) {
            totalChars += count;
        }

        if (totalChars === 0) {
            return 0;
        }

        // Calculate WPM: (chars / CHARS_PER_WORD) / (window_seconds / 60)
        const words = totalChars / ActivityTracker.CHARS_PER_WORD;
        const minutes = ActivityTracker.WPM_WINDOW_SECONDS / 60;
        return Math.round(words / minutes);
    }

    /**
     * Returns the total keystroke count in the current session.
     */
    public getSessionKeystrokes(): number {
        return this.totalSessionKeystrokes;
    }

    /**
     * Returns the current active editor's language ID.
     */
    public getCurrentLanguageId(): string {
        return this.currentLanguageId;
    }

    public dispose(): void {
        // Flush any pending keystrokes
        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = undefined;
        }
        this.flushKeystrokes();

        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
        this.keystrokeBuckets.clear();
    }
}
