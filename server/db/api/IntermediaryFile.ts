/* eslint-disable camelcase */
import { IntermediaryFile as IntermediaryFileBase, SystemObject as SystemObjectBase, Prisma } from '@prisma/client';
import { SystemObject, SystemObjectBased } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class IntermediaryFile extends DBC.DBObject<IntermediaryFileBase> implements IntermediaryFileBase, SystemObjectBased {
    idIntermediaryFile!: number;
    DateCreated!: Date;
    idAsset!: number;

    constructor(input: IntermediaryFileBase) {
        super(input);
    }

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
            LOG.error('DBAPI.IntermediaryFile.create', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.IntermediaryFile.update', LOG.LS.eDB, error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idIntermediaryFile } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idIntermediaryFile, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.intermediaryFile.fetchSystemObject', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetch(idIntermediaryFile: number): Promise<IntermediaryFile | null> {
        if (!idIntermediaryFile)
            return null;
        try {
            return DBC.CopyObject<IntermediaryFileBase, IntermediaryFile>(
                await DBC.DBConnection.prisma.intermediaryFile.findUnique({ where: { idIntermediaryFile, }, }), IntermediaryFile);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.IntermediaryFile.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchAll(): Promise<IntermediaryFile[] | null> {
        try {
            return DBC.CopyArray<IntermediaryFileBase, IntermediaryFile>(
                await DBC.DBConnection.prisma.intermediaryFile.findMany(), IntermediaryFile);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.IntermediaryFile.fetchAll', LOG.LS.eDB, error);
            return null;
        }
    }

    /**
     * Computes the array of IntermediaryFiles that are connected to any of the specified items.
     * IntermediaryFiles are connected to system objects; we examine those system objects which are in a *derived* relationship
     * to system objects connected to any of the specified items.
     * @param idItem Array of Item.idItem
     */
    static async fetchDerivedFromItems(idItem: number[]): Promise<IntermediaryFile[] | null> {
        if (!idItem || idItem.length == 0)
            return null;
        try {
            return DBC.CopyArray<IntermediaryFileBase, IntermediaryFile>(
                await DBC.DBConnection.prisma.$queryRaw<IntermediaryFile[]>`
                SELECT DISTINCT I.*
                FROM IntermediaryFile AS I
                JOIN SystemObject AS SOIF ON (I.idIntermediaryFile = SOIF.idIntermediaryFile)
                JOIN SystemObjectXref AS SOX ON (SOIF.idSystemObject = SOX.idSystemObjectDerived)
                JOIN SystemObject AS SOI ON (SOX.idSystemObjectMaster = SOI.idSystemObject)
                WHERE SOI.idItem IN (${Prisma.join(idItem)})`, IntermediaryFile);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.IntermediaryFile.fetchDerivedFromItems', LOG.LS.eDB, error);
            return null;
        }
    }
}
