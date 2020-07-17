/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import { AccessContext as AccessContextBase }from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class AccessContext extends DBO.DBObject<AccessContextBase> implements AccessContextBase {
    Authoritative!: boolean;
    CaptureData!: boolean;
    Global!: boolean;
    idAccessContext!: number;
    IntermediaryFile!: boolean;
    Model!: boolean;
    Scene!: boolean;

    constructor(input: AccessContextBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Authoritative, CaptureData, Global, IntermediaryFile, Model, Scene } = this;
            ({ idAccessContext: this.idAccessContext, Authoritative: this.Authoritative, CaptureData: this.CaptureData,
                Global: this.Global, IntermediaryFile: this.IntermediaryFile, Model: this.Model, Scene: this.Scene } =
                await DBConnectionFactory.prisma.accessContext.create({
                    data: { Authoritative, CaptureData, Global, IntermediaryFile, Model, Scene, }
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AccessContext.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idAccessContext, Authoritative, CaptureData, Global, IntermediaryFile, Model, Scene } = this;
            return await DBConnectionFactory.prisma.accessContext.update({
                where: { idAccessContext, },
                data: { Authoritative, CaptureData, Global, IntermediaryFile, Model, Scene }
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AccessContext.update', error);
            return false;
        }
    }

    static async fetch(idAccessContext: number): Promise<AccessContext | null> {
        if (!idAccessContext)
            return null;
        try {
            return DBO.CopyObject<AccessContextBase, AccessContext>(
                await DBConnectionFactory.prisma.accessContext.findOne({ where: { idAccessContext, }, }), AccessContext);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AccessContext.fetch', error);
            return null;
        }
    }
}
