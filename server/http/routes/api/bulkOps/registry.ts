import { BulkOperationDef } from './BulkOpTypes';
import { fixDisplayUnits } from './fixDisplayUnits';
import { syncFromEDAN } from './syncFromEDAN';
import { rebindSceneDerivatives } from './rebindSceneDerivatives';

// Registered bulk operations. A new op = a new entry here; the route and client are generic across all.
export const OPERATIONS: Record<string, BulkOperationDef> = {
    [fixDisplayUnits.key]: fixDisplayUnits,
    [syncFromEDAN.key]: syncFromEDAN,
    [rebindSceneDerivatives.key]: rebindSceneDerivatives,
};

export const OPERATION_LIST: { key: string; label: string }[] =
    Object.values(OPERATIONS).map(op => ({ key: op.key, label: op.label }));
