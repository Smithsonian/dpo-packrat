/* eslint-disable camelcase */
import { CookResource as CookResourceBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class CookResource extends DBC.DBObject<CookResourceBase> implements CookResourceBase {
    idCookResource!: number;
    Name!: string;
    Address!: string;
    Port!: number;
    Inspection!: number;
    SceneGeneration!: number;
    GenerateDownloads!: number;
    Photogrammetry!: number;
    LargeFiles!: number;
    MachineType!: string;

    constructor(input: CookResourceBase) {
        super(input);
    }

    public fetchTableName(): string { return 'CookResource'; }
    public fetchID(): number { return this.idCookResource; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name, Address, Port, Inspection, SceneGeneration, GenerateDownloads, Photogrammetry, LargeFiles, MachineType } = this;
            ({  idCookResource: this.idCookResource,
                Name: this.Name,
                Address: this.Address,
                Port: this.Port,
                Inspection: this.Inspection,
                SceneGeneration: this.SceneGeneration,
                GenerateDownloads: this.GenerateDownloads,
                Photogrammetry: this.Photogrammetry,
                LargeFiles: this.LargeFiles,
                MachineType: this.MachineType } =
                await DBC.DBConnection.prisma.cookResource.create({ data: { Name, Address, Port, Inspection, SceneGeneration, GenerateDownloads, Photogrammetry, LargeFiles, MachineType }, }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('create', error);
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idCookResource, Name, Address, Port, Inspection, SceneGeneration, GenerateDownloads, Photogrammetry, LargeFiles, MachineType } = this;
            return await DBC.DBConnection.prisma.cookResource.update({
                where: { idCookResource, },
                data: { Name, Address, Port, Inspection, SceneGeneration, GenerateDownloads, Photogrammetry, LargeFiles, MachineType },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('update', error);
        }
    }

    static async fetch(idCookResource: number): Promise<CookResource | null> {
        if (!idCookResource)
            return null;
        try {
            return DBC.CopyObject<CookResourceBase, CookResource>(
                await DBC.DBConnection.prisma.cookResource.findUnique({ where: { idCookResource, }, }), CookResource);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.CookResource.fetch', LOG.LS.eDB, error);
            return null;
        }
        return null;
    }

    static async fetchAll(): Promise<CookResource[] | null> {
        try {
            return DBC.CopyArray<CookResourceBase, CookResource>(
                await DBC.DBConnection.prisma.cookResource.findMany({ orderBy: { Name: 'asc' } }), CookResource);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.CookResource.fetchAll', LOG.LS.eDB, error);
            return null;
        }
    }
}