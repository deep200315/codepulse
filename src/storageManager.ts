import * as vscode from 'vscode';

/** Shape of a single day's data record. */
export interface DayRecord {
    activeSeconds: number;
    keystrokes: number;
    languages: Record<string, number>;
}

/** The full data store: a map of ISO date strings to day records. */
export type DataStore = Record<string, DayRecord>;

const STORAGE_KEY = 'codepulse.data';
const PRUNE_DAYS = 90;

/**
 * Manages reading/writing CodePulse data to VS Code globalState.
 * Handles auto-pruning of records older than 90 days.
 */
export class StorageManager implements vscode.Disposable {
    private data: DataStore = {};
    private context: vscode.ExtensionContext;
    private saveTimer: ReturnType<typeof setInterval> | undefined;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.load();
        this.prune();

        // Auto-save every 60 seconds
        this.saveTimer = setInterval(() => this.save(), 60_000);
    }

    /**
     * Loads data from globalState.
     */
    private load(): void {
        const stored = this.context.globalState.get<DataStore>(STORAGE_KEY);
        this.data = stored ?? {};
    }

    /**
     * Persists data to globalState.
     */
    public async save(): Promise<void> {
        await this.context.globalState.update(STORAGE_KEY, this.data);
    }

    /**
     * Removes entries older than 90 days.
     */
    private prune(): void {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - PRUNE_DAYS);
        const cutoffStr = this.toDateKey(cutoff);

        for (const key of Object.keys(this.data)) {
            if (key < cutoffStr) {
                delete this.data[key];
            }
        }
    }

    /**
     * Returns today's date key in YYYY-MM-DD format.
     */
    public getTodayKey(): string {
        return this.toDateKey(new Date());
    }

    private toDateKey(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    /**
     * Gets or creates today's record.
     */
    public getToday(): DayRecord {
        const key = this.getTodayKey();
        if (!this.data[key]) {
            this.data[key] = { activeSeconds: 0, keystrokes: 0, languages: {} };
        }
        return this.data[key];
    }

    /**
     * Adds active seconds to today and to a specific language.
     */
    public addActiveTime(seconds: number, languageId: string): void {
        const today = this.getToday();
        today.activeSeconds += seconds;
        today.languages[languageId] = (today.languages[languageId] ?? 0) + seconds;
    }

    /**
     * Records keystrokes for today.
     */
    public addKeystrokes(count: number): void {
        const today = this.getToday();
        today.keystrokes += count;
    }

    /**
     * Returns all stored data (for export).
     */
    public getAllData(): DataStore {
        return { ...this.data };
    }

    /**
     * Exports data as JSON string.
     */
    public exportAsJson(): string {
        return JSON.stringify(this.data, null, 2);
    }

    /**
     * Exports data as CSV string.
     */
    public exportAsCsv(): string {
        const lines: string[] = ['Date,ActiveSeconds,Keystrokes,Language,LanguageSeconds'];
        for (const [date, record] of Object.entries(this.data)) {
            if (Object.keys(record.languages).length === 0) {
                lines.push(`${date},${record.activeSeconds},${record.keystrokes},,`);
            } else {
                for (const [lang, secs] of Object.entries(record.languages)) {
                    lines.push(`${date},${record.activeSeconds},${record.keystrokes},${lang},${secs}`);
                }
            }
        }
        return lines.join('\n');
    }

    public dispose(): void {
        if (this.saveTimer) {
            clearInterval(this.saveTimer);
            this.saveTimer = undefined;
        }
        // Final save on dispose
        this.save();
    }
}
