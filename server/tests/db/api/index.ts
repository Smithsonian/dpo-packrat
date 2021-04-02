export * from './Actor.util';
export * from './Asset.util';
export * from './AssetVersion.util';
export * from './CaptureData.util';
export * from './Identifier.util';
export * from './IntermediaryFile.util';
export * from './Item.util';
export * from './Job.util';
export * from './Model.util';
export * from './Project.util';
export * from './ProjectDocumentation.util';
export * from './Scene.util';
export * from './Stakeholder.util';
export * from './Subject.util';
export * from './SystemObjectXref.util';
export * from './Unit.util';
export * from './UnitEdan.util';
export * from './User.util';
export * from './Workflow.util';
export * from './WorkflowStep.util';

export function randomStorageKey(baseName: string): string {
    return baseName + (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
}

export function nowCleansed(): Date {
    const date: Date = new Date();
    date.setMilliseconds(0);
    return date;
}