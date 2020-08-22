export * from './Asset.util';
export * from './AssetVersion.util';
export * from './CaptureData.util';
export * from './Item.util';
export * from './Model.util';
export * from './Project.util';
export * from './ProjectDocumentation.util';
export * from './Scene.util';
export * from './SystemObjectXref.util';
export * from './Subject.util';
export * from './Unit.util';
export * from './User.util';

export function randomStorageKey(baseName: string): string {
    return baseName + (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
}

export function nowCleansed(): Date {
    const date: Date = new Date();
    date.setMilliseconds(0);
    return date;
}