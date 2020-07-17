/* eslint-disable camelcase */
import { IntermediaryFile as IntermediaryFileBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { DBConnectionFactory, SystemObject } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class IntermediaryFile extends DBO.DBObject<IntermediaryFileBase> implements IntermediaryFileBase {
    idIntermediaryFile!: number;
    DateCreated!: Date;
    idAsset!: number;

    constructor(input: IntermediaryFileBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { idAsset, DateCreated } = this;
            ({ idIntermediaryFile: this.idIntermediaryFile, idAsset: this.idAsset, DateCreated: this.DateCreated } =
                await DBConnectionFactory.prisma.intermediaryFile.create({
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

    async update(): Promise<boolean> {
        try {
            const { idIntermediaryFile, idAsset, DateCreated } = this;
            return await DBConnectionFactory.prisma.intermediaryFile.update({
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
            return DBO.CopyObject<SystemObjectBase, SystemObject>(
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idIntermediaryFile, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.intermediaryFile.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idIntermediaryFile: number): Promise<IntermediaryFile | null> {
        if (!idIntermediaryFile)
            return null;
        try {
            return DBO.CopyObject<IntermediaryFileBase, IntermediaryFile>(
                await DBConnectionFactory.prisma.intermediaryFile.findOne({ where: { idIntermediaryFile, }, }), IntermediaryFile);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.IntermediaryFile.fetch', error);
            return null;
        }
    }
}
