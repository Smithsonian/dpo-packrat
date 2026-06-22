/**
 * Section-aware INI reader for vendor sidecar files.
 *
 * Parses INI-style text — `[Section]` headers and `key=value` / `key:value` lines — into a
 * section-scoped lookup. Each line is split on its first separator only, so values that
 * themselves contain `:` (e.g. `ImageString=359:718:1077`) survive intact. Inline `;` and `#`
 * comments are stripped, section names and keys are matched case-insensitively (via
 * `normalizeKey`), and a duplicate key within a section keeps the last value.
 *
 * Sidecar files are commonly latin1 / cp1252 (e.g. the `µ` in "µCT"). Read the file with
 * latin1 encoding before passing the text here so those bytes are preserved.
 */

/** Lowercase and strip every non-alphanumeric character, so `Volume_SizeX` and `volume size x` match. */
export function normalizeKey(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export interface IniEntry {
    section: string;        // normalized section name ('' for keys before the first header)
    key: string;            // normalized key
    value: string;          // trimmed raw value
}

export class IniDoc {
    private readonly _sections: Map<string, Map<string, string>>;

    constructor(sections: Map<string, Map<string, string>>) {
        this._sections = sections;
    }

    hasSection(section: string): boolean {
        return this._sections.has(normalizeKey(section));
    }

    getSection(section: string): Map<string, string> | undefined {
        return this._sections.get(normalizeKey(section));
    }

    /** Value of a key within a section, or undefined when either is absent. */
    get(section: string, key: string): string | undefined {
        return this._sections.get(normalizeKey(section))?.get(normalizeKey(key));
    }

    sections(): string[] {
        return [...this._sections.keys()];
    }

    /** Every (section, key, value) triple, for parsers that scan all keys rather than named ones. */
    entries(): IniEntry[] {
        const out: IniEntry[] = [];
        for (const [section, keys] of this._sections)
            for (const [key, value] of keys)
                out.push({ section, key, value });
        return out;
    }
}

export function parseIni(raw: string): IniDoc {
    const sections = new Map<string, Map<string, string>>();
    let current = '';                       // keys appearing before the first [Section]
    sections.set(current, new Map());

    for (const rawLine of raw.split(/\r?\n/)) {
        const line: string = stripInlineComment(rawLine).trim();
        if (!line) continue;

        if (line.startsWith('[')) {
            const end: number = line.indexOf(']');
            current = normalizeKey(end > 1 ? line.slice(1, end) : line.slice(1));
            if (!sections.has(current)) sections.set(current, new Map());
            continue;
        }

        const sep: number = indexOfSeparator(line);
        if (sep < 0) continue;
        const key: string = normalizeKey(line.slice(0, sep));
        if (!key) continue;
        const value: string = line.slice(sep + 1).trim();
        sections.get(current)?.set(key, value);     // last value wins for a duplicate key
    }

    return new IniDoc(sections);
}

function stripInlineComment(line: string): string {
    // Trim comments starting with `;` or `#` (INI convention).
    const idxSemi: number = line.indexOf(';');
    const idxHash: number = line.indexOf('#');
    let idx: number = -1;
    if (idxSemi >= 0) idx = idxSemi;
    if (idxHash >= 0 && (idx < 0 || idxHash < idx)) idx = idxHash;
    return idx >= 0 ? line.slice(0, idx) : line;
}

function indexOfSeparator(line: string): number {
    const a: number = line.indexOf('=');
    const b: number = line.indexOf(':');
    if (a < 0) return b;
    if (b < 0) return a;
    return Math.min(a, b);
}
