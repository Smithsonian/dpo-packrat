/* eslint-disable camelcase */
import { CookResource as CookResourceBase } from '@prisma/client';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

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
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ ...this },'DB.CookResource');
            return false;
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
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ ...this },'DB.CookResource');
            return false;
        }
    }

    static async fetch(idCookResource: number): Promise<CookResource | null> {
        if (!idCookResource)
            return null;
        try {
            return DBC.CopyObject<CookResourceBase, CookResource>(
                await DBC.DBConnection.prisma.cookResource.findUnique({ where: { idCookResource, }, }), CookResource);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ ...this },'DB.CookResource');
            return null;
        }
    }

    static async fetchAll(): Promise<CookResource[] | null> {
        try {
            return DBC.CopyArray<CookResourceBase, CookResource>(
                await DBC.DBConnection.prisma.cookResource.findMany({ orderBy: { Name: 'asc' } }), CookResource);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch all failed',H.Helpers.getErrorString(error),{ ...this },'DB.CookResource');
            return null;
        }
    }
}