/* eslint-disable camelcase */
import { IntermediaryFile as IntermediaryFileBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { SystemObject } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class IntermediaryFile extends DBC.DBObject<IntermediaryFileBase> implements IntermediaryFileBase {
    idIntermediaryFile!: number;
    DateCreated!: Date;
    idAsset!: number;

    constructor(input: IntermediaryFileBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idAsset, DateCreated } = this;
            ({ idIntermediaryFile: this.idIntermediaryFile, idAsset: this.idAsset, DateCreated: this.DateCreated } =
                await DBC.DBConnection.prisma.intermediaryFile.create({
                    data: {
                        Asset:          { connect: { idAsset }, },
                        DateCreated,
                        SystemObject:   { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.IntermediaryFile.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idIntermediaryFile, idAsset, DateCreated } = this;
            return await DBC.DBConnection.prisma.intermediaryFile.update({
                where: { idIntermediaryFile, },
                data: {
                    Asset:          { connect: { idAsset }, },
                    DateCreated,
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.IntermediaryFile.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idIntermediaryFile } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findOne({ where: { idIntermediaryFile, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.intermediaryFile.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idIntermediaryFile: number): Promise<IntermediaryFile | null> {
        if (!idIntermediaryFile)
            return null;
        try {
            return DBC.CopyObject<IntermediaryFileBase, IntermediaryFile>(
                await DBC.DBConnection.prisma.intermediaryFile.findOne({ where: { idIntermediaryFile, }, }), IntermediaryFile);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.IntermediaryFile.fetch', error);
            return null;
        }
    }
}
