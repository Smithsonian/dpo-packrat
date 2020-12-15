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

    private idVBackgroundRemovalMethodOrig!: number | null;
    private idVClusterTypeOrig!: number | null;
    private idVFocusTypeOrig!: number | null;
    private idVItemPositionTypeOrig!: number | null;
    private idVLightSourceTypeOrig!: number | null;

    constructor(input: CaptureDataPhotoBase) {
        super(input);
    }

    protected updateCachedValues(): void {
        this.idVBackgroundRemovalMethodOrig = this.idVBackgroundRemovalMethod;
        this.idVClusterTypeOrig = this.idVClusterType;
        this.idVFocusTypeOrig = this.idVFocusType;
        this.idVItemPositionTypeOrig = this.idVItemPositionType;
        this.idVLightSourceTypeOrig = this.idVLightSourceType;
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idCaptureData, idVCaptureDatasetType, CaptureDatasetFieldID, idVItemPositionType,
                ItemPositionFieldID, ItemArrangementFieldID, idVFocusType, idVLightSourceType, idVBackgroundRemovalMethod, idVClusterType,
                ClusterGeometryFieldID, CameraSettingsUniform } = this;
            ({ idCaptureData: this.idCaptureData, idCaptureDataPhoto: this.idCaptureDataPhoto, idVCaptureDatasetType: this.idVCaptureDatasetType,
                CaptureDatasetFieldID: this.CaptureDatasetFieldID,
                idVItemPositionType: this.idVItemPositionType, ItemPositionFieldID: this.ItemPositionFieldID,
                ItemArrangementFieldID: this.ItemArrangementFieldID, idVFocusType: this.idVFocusType, idVLightSourceType: this.idVLightSourceType,
                idVBackgroundRemovalMethod: this.idVBackgroundRemovalMethod, idVClusterType: this.idVClusterType,
                ClusterGeometryFieldID: this.ClusterGeometryFieldID, CameraSettingsUniform: this.CameraSettingsUniform } =
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
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureDataPhoto.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idCaptureData, idCaptureDataPhoto, idVCaptureDatasetType, CaptureDatasetFieldID, idVItemPositionType,
                ItemPositionFieldID, ItemArrangementFieldID, idVFocusType, idVLightSourceType, idVBackgroundRemovalMethod, idVClusterType,
                ClusterGeometryFieldID, CameraSettingsUniform, idVBackgroundRemovalMethodOrig,
                idVClusterTypeOrig, idVFocusTypeOrig, idVItemPositionTypeOrig, idVLightSourceTypeOrig } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.captureDataPhoto.update({
                where: { idCaptureDataPhoto, },
                data: {
                    CaptureData:                                                        { connect: { idCaptureData }, },
                    Vocabulary_CaptureDataPhoto_idVCaptureDatasetTypeToVocabulary:      { connect: { idVocabulary: idVCaptureDatasetType }, },
                    CaptureDatasetFieldID,
                    Vocabulary_CaptureDataPhoto_idVItemPositionTypeToVocabulary:        idVItemPositionType ? { connect: { idVocabulary: idVItemPositionType }, } : idVItemPositionTypeOrig ? { disconnect: true, } : undefined,
                    ItemPositionFieldID,
                    ItemArrangementFieldID,
                    Vocabulary_CaptureDataPhoto_idVFocusTypeToVocabulary:               idVFocusType ? { connect: { idVocabulary: idVFocusType }, } : idVFocusTypeOrig ? { disconnect: true, } : undefined,
                    Vocabulary_CaptureDataPhoto_idVLightSourceTypeToVocabulary:         idVLightSourceType ? { connect: { idVocabulary: idVLightSourceType }, } : idVLightSourceTypeOrig ? { disconnect: true, } : undefined,
                    Vocabulary_CaptureDataPhoto_idVBackgroundRemovalMethodToVocabulary: idVBackgroundRemovalMethod ? { connect: { idVocabulary: idVBackgroundRemovalMethod }, } : idVBackgroundRemovalMethodOrig ? { disconnect: true, } : undefined,
                    Vocabulary_CaptureDataPhoto_idVClusterTypeToVocabulary:             idVClusterType ? { connect: { idVocabulary: idVClusterType }, } : idVClusterTypeOrig ? { disconnect: true, } : undefined,
                    ClusterGeometryFieldID,
                    CameraSettingsUniform,
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureDataPhoto.update', error);
            return false;
        }
    }

    static async fetch(idCaptureDataPhoto: number): Promise<CaptureDataPhoto | null> {
        if (!idCaptureDataPhoto)
            return null;
        try {
            return DBC.CopyObject<CaptureDataPhotoBase, CaptureDataPhoto>(
                await DBC.DBConnection.prisma.captureDataPhoto.findOne({ where: { idCaptureDataPhoto, }, }), CaptureDataPhoto);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureDataPhoto.fetch', error);
            return null;
        }
    }

    static async fetchAll(): Promise<CaptureDataPhoto[] | null> {
        try {
            return DBC.CopyArray<CaptureDataPhotoBase, CaptureDataPhoto>(
                await DBC.DBConnection.prisma.captureDataPhoto.findMany(), CaptureDataPhoto);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureDataPhoto.fetchAll', error);
            return null;
        }
    }
}