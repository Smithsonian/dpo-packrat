/* eslint-disable camelcase */
import { CaptureDataPhoto as CaptureDataPhotoBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class CaptureDataPhoto extends DBC.DBObject<CaptureDataPhotoBase> implements CaptureDataPhotoBase {
    idCaptureDataPhoto!: number;
    idCaptureData!: number;
    idVCaptureDatasetType!: number;
    CaptureDatasetFieldID!: number | null;
    idVItemPositionType!: number | null;
    ItemPositionFieldID!: number | null;
    ItemArrangementFieldID!: number | null;
    idVFocusType!: number | null;
    idVLightSourceType!: number | null;
    idVBackgroundRemovalMethod!: number | null;
    idVClusterType!: number | null;
    ClusterGeometryFieldID!: number | null;
    CameraSettingsUniform!: boolean | null;
    CaptureDatasetUse!: string;             // JSON field, stored as a string

    constructor(input: CaptureDataPhotoBase) {
        super(input);
    }

    public fetchTableName(): string { return 'CaptureDataPhoto'; }
    public fetchID(): number { return this.idCaptureDataPhoto; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idCaptureData, idVCaptureDatasetType, CaptureDatasetFieldID, idVItemPositionType,
                ItemPositionFieldID, ItemArrangementFieldID, idVFocusType, idVLightSourceType, idVBackgroundRemovalMethod, idVClusterType,
                ClusterGeometryFieldID, CameraSettingsUniform, CaptureDatasetUse } = this;
            ({ idCaptureData: this.idCaptureData, idCaptureDataPhoto: this.idCaptureDataPhoto, idVCaptureDatasetType: this.idVCaptureDatasetType,
                CaptureDatasetFieldID: this.CaptureDatasetFieldID,
                idVItemPositionType: this.idVItemPositionType, ItemPositionFieldID: this.ItemPositionFieldID,
                ItemArrangementFieldID: this.ItemArrangementFieldID, idVFocusType: this.idVFocusType, idVLightSourceType: this.idVLightSourceType,
                idVBackgroundRemovalMethod: this.idVBackgroundRemovalMethod, idVClusterType: this.idVClusterType,
                ClusterGeometryFieldID: this.ClusterGeometryFieldID, CameraSettingsUniform: this.CameraSettingsUniform, CaptureDatasetUse: this.CaptureDatasetUse } =
                await DBC.DBConnection.prisma.captureDataPhoto.create({
                    data: {
                        CaptureData:                                                        { connect: { idCaptureData }, },
                        Vocabulary_CaptureDataPhoto_idVCaptureDatasetTypeToVocabulary:      { connect: { idVocabulary: idVCaptureDatasetType }, },
                        CaptureDatasetFieldID,
                        Vocabulary_CaptureDataPhoto_idVItemPositionTypeToVocabulary:        idVItemPositionType ? { connect: { idVocabulary: idVItemPositionType }, } : undefined,
                        ItemPositionFieldID,
                        ItemArrangementFieldID,
                        Vocabulary_CaptureDataPhoto_idVFocusTypeToVocabulary:               idVFocusType ? { connect: { idVocabulary: idVFocusType }, } : undefined,
                        Vocabulary_CaptureDataPhoto_idVLightSourceTypeToVocabulary:         idVLightSourceType ? { connect: { idVocabulary: idVLightSourceType }, } : undefined,
                        Vocabulary_CaptureDataPhoto_idVBackgroundRemovalMethodToVocabulary: idVBackgroundRemovalMethod ? { connect: { idVocabulary: idVBackgroundRemovalMethod }, } : undefined,
                        Vocabulary_CaptureDataPhoto_idVClusterTypeToVocabulary:             idVClusterType ? { connect: { idVocabulary: idVClusterType }, } : undefined,
                        ClusterGeometryFieldID,
                        CameraSettingsUniform,
                        CaptureDatasetUse,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('create', error);
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idCaptureData, idCaptureDataPhoto, idVCaptureDatasetType, CaptureDatasetFieldID, idVItemPositionType,
                ItemPositionFieldID, ItemArrangementFieldID, idVFocusType, idVLightSourceType, idVBackgroundRemovalMethod, idVClusterType,
                ClusterGeometryFieldID, CameraSettingsUniform, CaptureDatasetUse } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.captureDataPhoto.update({
                where: { idCaptureDataPhoto, },
                data: {
                    CaptureData:                                                        { connect: { idCaptureData }, },
                    Vocabulary_CaptureDataPhoto_idVCaptureDatasetTypeToVocabulary:      { connect: { idVocabulary: idVCaptureDatasetType }, },
                    CaptureDatasetFieldID,
                    Vocabulary_CaptureDataPhoto_idVItemPositionTypeToVocabulary:        idVItemPositionType ? { connect: { idVocabulary: idVItemPositionType }, } : { disconnect: true, },
                    ItemPositionFieldID,
                    ItemArrangementFieldID,
                    Vocabulary_CaptureDataPhoto_idVFocusTypeToVocabulary:               idVFocusType ? { connect: { idVocabulary: idVFocusType }, } : { disconnect: true, },
                    Vocabulary_CaptureDataPhoto_idVLightSourceTypeToVocabulary:         idVLightSourceType ? { connect: { idVocabulary: idVLightSourceType }, } : { disconnect: true, },
                    Vocabulary_CaptureDataPhoto_idVBackgroundRemovalMethodToVocabulary: idVBackgroundRemovalMethod ? { connect: { idVocabulary: idVBackgroundRemovalMethod }, } : { disconnect: true, },
                    Vocabulary_CaptureDataPhoto_idVClusterTypeToVocabulary:             idVClusterType ? { connect: { idVocabulary: idVClusterType }, } : { disconnect: true, },
                    ClusterGeometryFieldID,
                    CameraSettingsUniform,
                    CaptureDatasetUse,
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('update', error);
        }
    }

    static async fetch(idCaptureDataPhoto: number): Promise<CaptureDataPhoto | null> {
        if (!idCaptureDataPhoto)
            return null;
        try {
            return DBC.CopyObject<CaptureDataPhotoBase, CaptureDataPhoto>(
                await DBC.DBConnection.prisma.captureDataPhoto.findUnique({ where: { idCaptureDataPhoto, }, }), CaptureDataPhoto);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.CaptureDataPhoto.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchAll(): Promise<CaptureDataPhoto[] | null> {
        try {
            return DBC.CopyArray<CaptureDataPhotoBase, CaptureDataPhoto>(
                await DBC.DBConnection.prisma.captureDataPhoto.findMany(), CaptureDataPhoto);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.CaptureDataPhoto.fetchAll', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromCaptureData(idCaptureData: number): Promise<CaptureDataPhoto[] | null> {
        if (!idCaptureData)
            return null;
        try {
            return DBC.CopyArray<CaptureDataPhotoBase, CaptureDataPhoto>(await DBC.DBConnection.prisma.captureDataPhoto.findMany({ where: { idCaptureData, }, }), CaptureDataPhoto);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.CaptureDataPhoto.fetchFromCaptureData', LOG.LS.eDB, error);
            return null;
        }
    }
}