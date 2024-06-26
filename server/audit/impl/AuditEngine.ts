/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import { IAuditEngine } from '../interface';
import { ObjectIDAndType } from '../../db/api/ObjectType';
import { eEventKey } from '../../event/interface/EventEnums';
import { AuditEventGenerator } from './AuditEventGenerator';

export class AuditEngine implements IAuditEngine {
    async audit(obj: any, oID: ObjectIDAndType, key: eEventKey): Promise<boolean> {
        return AuditEventGenerator.singleton.audit(obj, oID, key);
    }
}