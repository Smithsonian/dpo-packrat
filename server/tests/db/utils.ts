export function randomStorageKey(baseName: string): string {
    return baseName + (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
}

export function nowCleansed(): Date {
    const date: Date = new Date();
    date.setMilliseconds(0);
    return date;
}
