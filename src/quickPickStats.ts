import * as vscode from 'vscode';
import { StorageManager } from './storageManager';
import { ActivityTracker } from './activityTracker';

/**
 * Language ID → short abbreviation (duplicated here for independence,
 * but could be refactored into a shared util).
 */
const LANG_ABBREVIATIONS: Record<string, string> = {
    'typescript': 'TypeScript',
    'typescriptreact': 'TypeScript (React)',
    'javascript': 'JavaScript',
    'javascriptreact': 'JavaScript (React)',
    'python': 'Python',
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
    'markdown': 'Markdown',
    'sql': 'SQL',
    'shellscript': 'Shell',
    'powershell': 'PowerShell',
    'plaintext': 'Plain Text',
};

/**
 * Formats seconds into human-readable time.
 */
function formatTime(totalSeconds: number): string {
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

function getLangLabel(langId: string): string {
    return LANG_ABBREVIATIONS[langId] ?? langId;
}

/**
 * Shows a Quick Pick with today's full stats and an export button.
 */
export async function showStatsQuickPick(
    storageManager: StorageManager,
    activityTracker: ActivityTracker
): Promise<void> {
    const today = storageManager.getToday();
    const wpm = activityTracker.getWpm();

    interface StatsItem extends vscode.QuickPickItem {
        action?: string;
    }

    const items: StatsItem[] = [
        {
            label: '$(clock) Total Active Time',
            description: formatTime(today.activeSeconds),
            kind: vscode.QuickPickItemKind.Default,
        },
        {
            label: '$(keyboard) Keystrokes',
            description: `${today.keystrokes}`,
        },
        {
            label: '$(dashboard) Typing Speed',
            description: `${wpm} WPM`,
        },
    ];

    // Language breakdown
    const sortedLangs = Object.entries(today.languages)
        .sort(([, a], [, b]) => b - a);

    if (sortedLangs.length > 0) {
        items.push({
            label: 'Languages',
            kind: vscode.QuickPickItemKind.Separator,
        });

        for (const [langId, secs] of sortedLangs) {
            items.push({
                label: `$(file-code) ${getLangLabel(langId)}`,
                description: formatTime(secs),
            });
        }
    }

    // Separator + Export
    items.push({
        label: 'Actions',
        kind: vscode.QuickPickItemKind.Separator,
    });
    items.push({
        label: '$(export) Export Data as JSON',
        action: 'export-json',
    });
    items.push({
        label: '$(export) Export Data as CSV',
        action: 'export-csv',
    });

    const selected = await vscode.window.showQuickPick(items, {
        title: 'CodePulse — Today\'s Stats',
        placeHolder: 'Your coding activity for today',
    });

    if (selected?.action === 'export-json') {
        await exportData(storageManager, 'json');
    } else if (selected?.action === 'export-csv') {
        await exportData(storageManager, 'csv');
    }
}

/**
 * Exports data via a save dialog.
 */
export async function exportData(
    storageManager: StorageManager,
    format?: 'json' | 'csv'
): Promise<void> {
    // If format not specified, ask
    if (!format) {
        const choice = await vscode.window.showQuickPick(['JSON', 'CSV'], {
            title: 'CodePulse: Export Format',
            placeHolder: 'Choose export format',
        });
        if (!choice) {
            return;
        }
        format = choice.toLowerCase() as 'json' | 'csv';
    }

    const content = format === 'json'
        ? storageManager.exportAsJson()
        : storageManager.exportAsCsv();

    const ext = format === 'json' ? 'json' : 'csv';

    const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(`codepulse-data.${ext}`),
        filters: {
            [format.toUpperCase()]: [ext],
        },
        title: `Export CodePulse Data as ${format.toUpperCase()}`,
    });

    if (uri) {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf-8'));
        vscode.window.showInformationMessage(`CodePulse data exported to ${uri.fsPath}`);
    }
}
