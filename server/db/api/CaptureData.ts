/* eslint-disable camelcase */
import { CaptureData as CaptureDataBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { DBConnectionFactory, SystemObject } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class CaptureData extends DBO.DBObject<CaptureDataBase> implements CaptureDataBase {
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

    constructor(input: CaptureDataBase) {
        super(input);
    }

    async create(): Promise<boolean> {
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
                await DBConnectionFactory.prisma.captureData.create({
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
        } catch (error) {
            LOG.logger.error('DBAPI.CaptureData.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idCaptureData, idVCaptureMethod, idVCaptureDatasetType, DateCaptured, Description, CaptureDatasetFieldID, idVItemPositionType,
                ItemPositionFieldID, ItemArrangementFieldID, idVFocusType, idVLightSourceType, idVBackgroundRemovalMethod, idVClusterType,
                ClusterGeometryFieldID, CameraSettingsUniform, idAssetThumbnail } = this;
            return await DBConnectionFactory.prisma.captureData.update({
                where: { idCaptureData, },
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
                },
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.CaptureData.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idCaptureData } = this;
            return DBO.CopyObject<SystemObjectBase, SystemObject>(
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idCaptureData, }, }), SystemObject);
        } catch (error) {
            LOG.logger.error('DBAPI.CaptureData.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idCaptureData: number): Promise<CaptureData | null> {
        try {
            return DBO.CopyObject<CaptureDataBase, CaptureData>(
                await DBConnectionFactory.prisma.captureData.findOne({ where: { idCaptureData, }, }), CaptureData);
        } catch (error) {
            LOG.logger.error('DBAPI.CaptureData.fetch', error);
            return null;
        }
    }

    static async fetchFromXref(idCaptureDataGroup: number): Promise<CaptureData[] | null> {
        try {
            return DBO.CopyArray<CaptureDataBase, CaptureData>(
                await DBConnectionFactory.prisma.captureData.findMany({
                    where: {
                        CaptureDataGroupCaptureDataXref: {
                            some: { idCaptureDataGroup },
                        },
                    },
                }), CaptureData);
        } catch (error) {
            LOG.logger.error('DBAPI.CaptureData.fetchFromXref', error);
            return null;
        }
    }
}
