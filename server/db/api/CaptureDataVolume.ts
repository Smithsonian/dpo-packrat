/* eslint-disable camelcase */
import { CaptureDataVolume as CaptureDataVolumeBase } from '@prisma/client';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export class CaptureDataVolume extends DBC.DBObject<CaptureDataVolumeBase> implements CaptureDataVolumeBase {
    idCaptureDataVolume!: number;
    idCaptureData!: number;
    idVModality!: number;
    idVScanType!: number;
    idVContentType!: number;
    ScannerMakeModel!: string | null;
    VoltageKV!: number | null;
    AmperageUA!: number | null;
    SpecimenPreparation!: string | null;
    VoxelSizeX!: number;
    VoxelSizeY!: number;
    VoxelSizeZ!: number;
    idVVoxelSizeUnit!: number;
    DimensionsX!: number | null;
    DimensionsY!: number | null;
    DimensionsZ!: number | null;
    BitDepth!: number | null;
    FileCount!: number;
    SliceCount!: number | null;
    idVFilterLocation!: number | null;

    idVModalityOrig!: number;
    idVScanTypeOrig!: number;
    idVContentTypeOrig!: number;
    ScannerMakeModelOrig!: string | null;
    VoltageKVOrig!: number | null;
    AmperageUAOrig!: number | null;
    SpecimenPreparationOrig!: string | null;
    VoxelSizeXOrig!: number;
    VoxelSizeYOrig!: number;
    VoxelSizeZOrig!: number;
    idVVoxelSizeUnitOrig!: number;
    DimensionsXOrig!: number | null;
    DimensionsYOrig!: number | null;
    DimensionsZOrig!: number | null;
    BitDepthOrig!: number | null;
    FileCountOrig!: number;
    SliceCountOrig!: number | null;
    idVFilterLocationOrig!: number | null;

    constructor(input: CaptureDataVolumeBase) {
        super(input);
    }

    protected updateCachedValues(): void {
        this.snapshotTrackedFields([
            'idVModality', 'idVScanType', 'idVContentType',
            'ScannerMakeModel', 'VoltageKV', 'AmperageUA', 'SpecimenPreparation',
            'VoxelSizeX', 'VoxelSizeY', 'VoxelSizeZ', 'idVVoxelSizeUnit',
            'DimensionsX', 'DimensionsY', 'DimensionsZ', 'BitDepth',
            'FileCount', 'SliceCount', 'idVFilterLocation',
        ]);
    }

    public fetchTableName(): string { return 'CaptureDataVolume'; }
    public fetchID(): number { return this.idCaptureDataVolume; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idCaptureData, idVModality, idVScanType, idVContentType,
                ScannerMakeModel, VoltageKV, AmperageUA, SpecimenPreparation,
                VoxelSizeX, VoxelSizeY, VoxelSizeZ, idVVoxelSizeUnit,
                DimensionsX, DimensionsY, DimensionsZ, BitDepth,
                FileCount, SliceCount, idVFilterLocation } = this;
            ({ idCaptureDataVolume: this.idCaptureDataVolume, idCaptureData: this.idCaptureData,
                idVModality: this.idVModality, idVScanType: this.idVScanType, idVContentType: this.idVContentType,
                ScannerMakeModel: this.ScannerMakeModel, VoltageKV: this.VoltageKV,
                AmperageUA: this.AmperageUA, SpecimenPreparation: this.SpecimenPreparation,
                VoxelSizeX: this.VoxelSizeX, VoxelSizeY: this.VoxelSizeY, VoxelSizeZ: this.VoxelSizeZ,
                idVVoxelSizeUnit: this.idVVoxelSizeUnit,
                DimensionsX: this.DimensionsX, DimensionsY: this.DimensionsY, DimensionsZ: this.DimensionsZ,
                BitDepth: this.BitDepth, FileCount: this.FileCount, SliceCount: this.SliceCount,
                idVFilterLocation: this.idVFilterLocation } =
                await DBC.DBConnection.prisma.captureDataVolume.create({
                    data: {
                        CaptureData:                                                 { connect: { idCaptureData }, },
                        Vocabulary_CaptureDataVolume_idVModalityToVocabulary:        { connect: { idVocabulary: idVModality }, },
                        Vocabulary_CaptureDataVolume_idVScanTypeToVocabulary:        { connect: { idVocabulary: idVScanType }, },
                        Vocabulary_CaptureDataVolume_idVContentTypeToVocabulary:     { connect: { idVocabulary: idVContentType }, },
                        Vocabulary_CaptureDataVolume_idVVoxelSizeUnitToVocabulary:   { connect: { idVocabulary: idVVoxelSizeUnit }, },
                        Vocabulary_CaptureDataVolume_idVFilterLocationToVocabulary:  idVFilterLocation ? { connect: { idVocabulary: idVFilterLocation }, } : undefined,
                        ScannerMakeModel, VoltageKV, AmperageUA, SpecimenPreparation,
                        VoxelSizeX, VoxelSizeY, VoxelSizeZ,
                        DimensionsX, DimensionsY, DimensionsZ,
                        BitDepth, FileCount, SliceCount,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ id: this.fetchID() },'DB.CaptureData.Volume');
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idCaptureData, idCaptureDataVolume, idVModality, idVScanType, idVContentType,
                ScannerMakeModel, VoltageKV, AmperageUA, SpecimenPreparation,
                VoxelSizeX, VoxelSizeY, VoxelSizeZ, idVVoxelSizeUnit,
                DimensionsX, DimensionsY, DimensionsZ, BitDepth,
                FileCount, SliceCount, idVFilterLocation } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.captureDataVolume.update({
                where: { idCaptureDataVolume, },
                data: {
                    CaptureData:                                                 { connect: { idCaptureData }, },
                    Vocabulary_CaptureDataVolume_idVModalityToVocabulary:        { connect: { idVocabulary: idVModality }, },
                    Vocabulary_CaptureDataVolume_idVScanTypeToVocabulary:        { connect: { idVocabulary: idVScanType }, },
                    Vocabulary_CaptureDataVolume_idVContentTypeToVocabulary:     { connect: { idVocabulary: idVContentType }, },
                    Vocabulary_CaptureDataVolume_idVVoxelSizeUnitToVocabulary:   { connect: { idVocabulary: idVVoxelSizeUnit }, },
                    Vocabulary_CaptureDataVolume_idVFilterLocationToVocabulary:  idVFilterLocation ? { connect: { idVocabulary: idVFilterLocation }, } : { disconnect: true, },
                    ScannerMakeModel, VoltageKV, AmperageUA, SpecimenPreparation,
                    VoxelSizeX, VoxelSizeY, VoxelSizeZ,
                    DimensionsX, DimensionsY, DimensionsZ,
                    BitDepth, FileCount, SliceCount,
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ id: this.fetchID() },'DB.CaptureData.Volume');
            return false;
        }
    }

    static async fetch(idCaptureDataVolume: number): Promise<CaptureDataVolume | null> {
        if (!idCaptureDataVolume)
            return null;
        try {
            return DBC.CopyObject<CaptureDataVolumeBase, CaptureDataVolume>(
                await DBC.DBConnection.prisma.captureDataVolume.findUnique({ where: { idCaptureDataVolume, }, }), CaptureDataVolume);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ idCaptureDataVolume },'DB.CaptureData.Volume');
            return null;
        }
    }

    static async fetchAll(): Promise<CaptureDataVolume[] | null> {
        try {
            return DBC.CopyArray<CaptureDataVolumeBase, CaptureDataVolume>(
                await DBC.DBConnection.prisma.captureDataVolume.findMany(), CaptureDataVolume);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch all failed',H.Helpers.getErrorString(error),undefined,'DB.CaptureData.Volume');
            return null;
        }
    }

    // 1:1 via UNIQUE(idCaptureData) — returns a single record, not an array.
    static async fetchFromCaptureData(idCaptureData: number): Promise<CaptureDataVolume | null> {
        if (!idCaptureData)
            return null;
        try {
            return DBC.CopyObject<CaptureDataVolumeBase, CaptureDataVolume>(
                await DBC.DBConnection.prisma.captureDataVolume.findUnique({ where: { idCaptureData, }, }), CaptureDataVolume);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch from CaptureData failed',H.Helpers.getErrorString(error),{ idCaptureData },'DB.CaptureData.Volume');
            return null;
        }
    }
}
