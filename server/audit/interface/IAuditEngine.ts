/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import { ObjectIDAndType } from '../../db/api/ObjectType';
import { eEventKey } from '../../event/interface/EventEnums';

export interface IAuditEngine {
    audit(obj: any, oID: ObjectIDAndType, key: eEventKey): Promise<boolean>;
}