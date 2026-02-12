import * as vscode from 'vscode';
import { ActivityTracker } from './activityTracker';
import { StorageManager } from './storageManager';

/**
 * Manages the status bar item showing active time, language + time, and WPM.
 */
export class StatusBarManager implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;
    private activityTracker: ActivityTracker;
    private storageManager: StorageManager;

    /** Language ID → short abbreviation map */
    private static readonly LANG_ABBREVIATIONS: Record<string, string> = {
        'typescript': 'TS',
        'typescriptreact': 'TSX',
        'javascript': 'JS',
        'javascriptreact': 'JSX',
        'python': 'PY',
        'java': 'Java',
        'csharp': 'C#',
        'cpp': 'C++',
        'c': 'C',
        'go': 'Go',
        'rust': 'Rust',
        'ruby': 'Ruby',
        'php': 'PHP',
        'swift': 'Swift',
        'kotlin': 'Kotlin',
        'dart': 'Dart',
        'html': 'HTML',
        'css': 'CSS',
        'scss': 'SCSS',
        'less': 'LESS',
        'json': 'JSON',
        'yaml': 'YAML',
        'xml': 'XML',
        'markdown': 'MD',
        'sql': 'SQL',
        'shellscript': 'Shell',
        'powershell': 'PS',
        'lua': 'Lua',
        'perl': 'Perl',
        'r': 'R',
        'scala': 'Scala',
        'elixir': 'Elixir',
        'clojure': 'Clojure',
        'haskell': 'Haskell',
        'vue': 'Vue',
        'svelte': 'Svelte',
        'plaintext': 'Text',
    };

    /** Language ID → Codicon icon map */
    private static readonly LANG_ICONS: Record<string, string> = {
        'typescript': '$(symbol-class)',
        'typescriptreact': '$(symbol-class)',
        'javascript': '$(symbol-method)',
        'javascriptreact': '$(symbol-method)',
        'python': '$(symbol-namespace)',
        'json': '$(json)',
        'markdown': '$(markdown)',
        'html': '$(code)',
        'css': '$(paintcan)',
        'scss': '$(paintcan)',
        'xml': '$(code)',
        'yaml': '$(gear)',
        'shellscript': '$(terminal)',
        'powershell': '$(terminal)',
    };

    constructor(activityTracker: ActivityTracker, storageManager: StorageManager) {
        this.activityTracker = activityTracker;
        this.storageManager = storageManager;

        // High priority → appears center-left in the status bar
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.statusBarItem.command = 'codepulse.showStats';
        this.statusBarItem.name = 'CodePulse';
        this.statusBarItem.show();

        this.refresh();
    }

    /**
     * Refreshes the status bar text with current data.
     */
    public refresh(): void {
        const today = this.storageManager.getToday();
        const totalTime = this.formatTime(today.activeSeconds);

        const langId = this.activityTracker.getCurrentLanguageId();
        const langAbbr = this.getLanguageAbbreviation(langId);
        const langIcon = this.getIconForLanguage(langId);
        const langSeconds = today.languages[langId] ?? 0;
        const langTime = this.formatTime(langSeconds);

        const config = vscode.workspace.getConfiguration('codepulse');
        const showWpm = config.get<boolean>('showWpm', true);
        const wpm = this.activityTracker.getWpm();

        let text = `$(clock) ${totalTime} | ${langIcon} ${langAbbr} ${langTime}`;
        if (showWpm) {
            text += ` | $(dashboard) ${wpm} WPM`;
        }

        this.statusBarItem.text = text;

        // Build tooltip with language breakdown
        const tooltipLines = [`CodePulse — Today's Activity`, ``, `Total Active: ${totalTime}`];
        const sortedLangs = Object.entries(today.languages)
            .sort(([, a], [, b]) => b - a);
        if (sortedLangs.length > 0) {
            tooltipLines.push(``, `Languages:`);
            for (const [lid, secs] of sortedLangs) {
                const abbr = this.getLanguageAbbreviation(lid);
                tooltipLines.push(`  ${abbr}: ${this.formatTime(secs)}`);
            }
        }
        tooltipLines.push(``, `Keystrokes: ${today.keystrokes}`);
        if (showWpm) {
            tooltipLines.push(`WPM: ${wpm}`);
        }
        this.statusBarItem.tooltip = tooltipLines.join('\n');
    }

    /**
     * Gets the short abbreviation for a language ID.
     */
    private getLanguageAbbreviation(langId: string): string {
        return StatusBarManager.LANG_ABBREVIATIONS[langId] ?? langId.toUpperCase();
    }

    /**
     * Gets the Codicon for a language ID, falling back to $(file-code).
     */
    private getIconForLanguage(langId: string): string {
        return StatusBarManager.LANG_ICONS[langId] ?? '$(file-code)';
    }

    /**
     * Formats seconds into a human-readable string (e.g., "2h 15m" or "45m" or "30s").
     */
    private formatTime(totalSeconds: number): string {
        if (totalSeconds < 60) {
            return `${totalSeconds}s`;
        }
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        if (hours > 0) {
            return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        }
        return `${minutes}m`;
    }

    public dispose(): void {
        this.statusBarItem.dispose();
    }
}
