/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import { IAuditEngine } from './IAuditEngine';
import { AuditEngine } from '../impl/AuditEngine';
import { Config, AUDIT_TYPE } from '../../config';

import { ObjectIDAndType } from '../../db/api/ObjectType';
import { eEventKey } from '../../event/interface/EventEnums';
// import * as LOG from '../../utils/logger';

export class AuditFactory {
    private static instance: IAuditEngine | null = null;

    static async getInstance(): Promise<IAuditEngine | null> {
        /* istanbul ignore else */
        if (!AuditFactory.instance) {
            switch (Config.audit.type) {
                /* istanbul ignore next */
                default:
                case AUDIT_TYPE.LOCAL: {
                    AuditFactory.instance = new AuditEngine();
                    break;
                }
            }
        }
        return AuditFactory.instance;
    }

    static async audit(obj: any, oID: ObjectIDAndType, key: eEventKey): Promise<boolean> {
        const engine: IAuditEngine | null = await this.getInstance();
        return (engine) ? engine.audit(obj, oID, key) : false;
    }
}
