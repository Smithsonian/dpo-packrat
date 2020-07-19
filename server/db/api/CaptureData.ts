/* eslint-disable camelcase */
import { CaptureData as CaptureDataBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { SystemObject } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class CaptureData extends DBC.DBObject<CaptureDataBase> implements CaptureDataBase {
    idCaptureData!: number;
    CameraSettingsUniform!: boolean | null;
    CaptureDatasetFieldID!: number | null;
    ClusterGeometryFieldID!: number | null;
    DateCaptured!: Date;
    Description!: string;
    idAssetThumbnail!: number | null;
    idVBackgroundRemovalMethod!: number | null;
    idVCaptureDatasetType!: number;
    idVCaptureMethod!: number;
    idVClusterType!: number | null;
    idVFocusType!: number | null;
    idVItemPositionType!: number | null;
    idVLightSourceType!: number | null;
    ItemArrangementFieldID!: number | null;
    ItemPositionFieldID!: number | null;

    private idAssetThumbnailOrig!: number | null;
    private idVBackgroundRemovalMethodOrig!: number | null;
    private idVClusterTypeOrig!: number | null;
    private idVFocusTypeOrig!: number | null;
    private idVItemPositionTypeOrig!: number | null;
    private idVLightSourceTypeOrig!: number | null;

    constructor(input: CaptureDataBase) {
        super(input);
    }

    protected updateCachedValues(): void {
        this.idAssetThumbnailOrig = this.idAssetThumbnail;
        this.idVBackgroundRemovalMethodOrig = this.idVBackgroundRemovalMethod;
        this.idVClusterTypeOrig = this.idVClusterType;
        this.idVFocusTypeOrig = this.idVFocusType;
        this.idVItemPositionTypeOrig = this.idVItemPositionType;
        this.idVLightSourceTypeOrig = this.idVLightSourceType;
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idVCaptureMethod, idVCaptureDatasetType, DateCaptured, Description, CaptureDatasetFieldID, idVItemPositionType,
                ItemPositionFieldID, ItemArrangementFieldID, idVFocusType, idVLightSourceType, idVBackgroundRemovalMethod, idVClusterType,
                ClusterGeometryFieldID, CameraSettingsUniform, idAssetThumbnail } = this;
            ({ idCaptureData: this.idCaptureData, idVCaptureMethod: this.idVCaptureMethod, idVCaptureDatasetType: this.idVCaptureDatasetType,
                DateCaptured: this.DateCaptured, Description: this.Description, CaptureDatasetFieldID: this.CaptureDatasetFieldID,
                idVItemPositionType: this.idVItemPositionType, ItemPositionFieldID: this.ItemPositionFieldID,
                ItemArrangementFieldID: this.ItemArrangementFieldID, idVFocusType: this.idVFocusType, idVLightSourceType: this.idVLightSourceType,
                idVBackgroundRemovalMethod: this.idVBackgroundRemovalMethod, idVClusterType: this.idVClusterType,
                ClusterGeometryFieldID: this.ClusterGeometryFieldID, CameraSettingsUniform: this.CameraSettingsUniform,
                idAssetThumbnail: this.idAssetThumbnail } =
                await DBC.DBConnectionFactory.prisma.captureData.create({
                    data: {
                        Vocabulary_CaptureData_idVCaptureMethodToVocabulary:            { connect: { idVocabulary: idVCaptureMethod }, },
                        Vocabulary_CaptureData_idVCaptureDatasetTypeToVocabulary:       { connect: { idVocabulary: idVCaptureDatasetType }, },
                        DateCaptured,
                        Description,
                        CaptureDatasetFieldID,
                        Vocabulary_CaptureData_idVItemPositionTypeToVocabulary:         idVItemPositionType ? { connect: { idVocabulary: idVItemPositionType }, } : undefined,
                        ItemPositionFieldID,
                        ItemArrangementFieldID,
                        Vocabulary_CaptureData_idVFocusTypeToVocabulary:                idVFocusType ? { connect: { idVocabulary: idVFocusType }, } : undefined,
                        Vocabulary_CaptureData_idVLightSourceTypeToVocabulary:          idVLightSourceType ? { connect: { idVocabulary: idVLightSourceType }, } : undefined,
                        Vocabulary_CaptureData_idVBackgroundRemovalMethodToVocabulary:  idVBackgroundRemovalMethod ? { connect: { idVocabulary: idVBackgroundRemovalMethod }, } : undefined,
                        Vocabulary_CaptureData_idVClusterTypeToVocabulary:              idVClusterType ? { connect: { idVocabulary: idVClusterType }, } : undefined,
                        ClusterGeometryFieldID,
                        CameraSettingsUniform,
                        Asset:                                                          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
                        SystemObject:                                                   { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureData.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idCaptureData, idVCaptureMethod, idVCaptureDatasetType, DateCaptured, Description, CaptureDatasetFieldID, idVItemPositionType,
                ItemPositionFieldID, ItemArrangementFieldID, idVFocusType, idVLightSourceType, idVBackgroundRemovalMethod, idVClusterType,
                ClusterGeometryFieldID, CameraSettingsUniform, idAssetThumbnail, idAssetThumbnailOrig, idVBackgroundRemovalMethodOrig,
                idVClusterTypeOrig, idVFocusTypeOrig, idVItemPositionTypeOrig, idVLightSourceTypeOrig } = this;
            const retValue: boolean = await DBC.DBConnectionFactory.prisma.captureData.update({
                where: { idCaptureData, },
                data: {
                    Vocabulary_CaptureData_idVCaptureMethodToVocabulary:            { connect: { idVocabulary: idVCaptureMethod }, },
                    Vocabulary_CaptureData_idVCaptureDatasetTypeToVocabulary:       { connect: { idVocabulary: idVCaptureDatasetType }, },
                    DateCaptured,
                    Description,
                    CaptureDatasetFieldID,
                    Vocabulary_CaptureData_idVItemPositionTypeToVocabulary:         idVItemPositionType ? { connect: { idVocabulary: idVItemPositionType }, } : idVItemPositionTypeOrig ? { disconnect: true, } : undefined,
                    ItemPositionFieldID,
                    ItemArrangementFieldID,
                    Vocabulary_CaptureData_idVFocusTypeToVocabulary:                idVFocusType ? { connect: { idVocabulary: idVFocusType }, } : idVFocusTypeOrig ? { disconnect: true, } : undefined,
                    Vocabulary_CaptureData_idVLightSourceTypeToVocabulary:          idVLightSourceType ? { connect: { idVocabulary: idVLightSourceType }, } : idVLightSourceTypeOrig ? { disconnect: true, } : undefined,
                    Vocabulary_CaptureData_idVBackgroundRemovalMethodToVocabulary:  idVBackgroundRemovalMethod ? { connect: { idVocabulary: idVBackgroundRemovalMethod }, } : idVBackgroundRemovalMethodOrig ? { disconnect: true, } : undefined,
                    Vocabulary_CaptureData_idVClusterTypeToVocabulary:              idVClusterType ? { connect: { idVocabulary: idVClusterType }, } : idVClusterTypeOrig ? { disconnect: true, } : undefined,
                    ClusterGeometryFieldID,
                    CameraSettingsUniform,
                    Asset:                                                          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : idAssetThumbnailOrig ? { disconnect: true, } : undefined,
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureData.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idCaptureData } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findOne({ where: { idCaptureData, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureData.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idCaptureData: number): Promise<CaptureData | null> {
        if (!idCaptureData)
            return null;
        try {
            return DBC.CopyObject<CaptureDataBase, CaptureData>(
                await DBC.DBConnectionFactory.prisma.captureData.findOne({ where: { idCaptureData, }, }), CaptureData);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureData.fetch', error);
            return null;
        }
    }

    static async fetchFromXref(idCaptureDataGroup: number): Promise<CaptureData[] | null> {
        if (!idCaptureDataGroup)
            return null;
        try {
            return DBC.CopyArray<CaptureDataBase, CaptureData>(
                await DBC.DBConnectionFactory.prisma.captureData.findMany({
                    where: {
                        CaptureDataGroupCaptureDataXref: {
                            some: { idCaptureDataGroup },
                        },
                    },
                }), CaptureData);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureData.fetchFromXref', error);
            return null;
        }
    }
}
