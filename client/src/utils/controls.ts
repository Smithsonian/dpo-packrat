/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Details utilities
 *
 * Utilities for components associated with details control UI in Repository and Ingestion.
 */
interface SelectOption {
    value: string | number;
    label: string | number;
}

// NOTE: This set is an aggregate of the properties that are allowed to have a null field passed to object update/ingestion
export const nullableSelectFields = new Set<string>(['itemPositionType', 'focusType', 'lightsourceType', 'backgroundRemovalMethod', 'clusterType']);

export function getNullableSelectEntries(entries: any[], valueName: string, labelName: string): SelectOption[] {
    const result = entries.map((entry) => ({ value: entry[valueName], label: entry[labelName] }));
    result.unshift({ value: -1, label: '(No Selection)' });

    return result;
}
