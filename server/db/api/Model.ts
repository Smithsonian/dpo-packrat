/* eslint-disable camelcase */
import { Model as ModelBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { SystemObject } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Model extends DBC.DBObject<ModelBase> implements ModelBase {
    idModel!: number;
    Authoritative!: boolean;
    DateCreated!: Date;
    idAssetThumbnail!: number | null;
    idVCreationMethod!: number;
    idVModality!: number;
    idVPurpose!: number;
    idVUnits!: number;
    Master!: boolean;

    private idAssetThumbnailOrig!: number | null;

    constructor(input: ModelBase) {
        super(input);
    }

    protected updateCachedValues(): void {
        this.idAssetThumbnailOrig = this.idAssetThumbnail;
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { DateCreated, idVCreationMethod, Master, Authoritative, idVModality, idVUnits, idVPurpose, idAssetThumbnail } = this;
            ({ idModel: this.idModel, DateCreated: this.DateCreated, idVCreationMethod: this.idVCreationMethod,
                Master: this.Master, Authoritative: this.Authoritative, idVModality: this.idVModality,
                idVUnits: this.idVUnits, idVPurpose: this.idVPurpose, idAssetThumbnail: this.idAssetThumbnail } =
                await DBC.DBConnectionFactory.prisma.model.create({
                    data: {
                        DateCreated,
                        Vocabulary_Model_idVCreationMethodToVocabulary: { connect: { idVocabulary: idVCreationMethod }, },
                        Master,
                        Authoritative,
                        Vocabulary_Model_idVModalityToVocabulary:       { connect: { idVocabulary: idVModality }, },
                        Vocabulary_Model_idVUnitsToVocabulary:          { connect: { idVocabulary: idVUnits }, },
                        Vocabulary_Model_idVPurposeToVocabulary:        { connect: { idVocabulary: idVPurpose }, },
                        Asset:                                          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
                        SystemObject:   { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Model.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idModel, DateCreated, idVCreationMethod, Master, Authoritative, idVModality, idVUnits,
                idVPurpose, idAssetThumbnail, idAssetThumbnailOrig } = this;
            const retValue: boolean = await DBC.DBConnectionFactory.prisma.model.update({
                where: { idModel, },
                data: {
                    DateCreated,
                    Vocabulary_Model_idVCreationMethodToVocabulary: { connect: { idVocabulary: idVCreationMethod }, },
                    Master,
                    Authoritative,
                    Vocabulary_Model_idVModalityToVocabulary:       { connect: { idVocabulary: idVModality }, },
                    Vocabulary_Model_idVUnitsToVocabulary:          { connect: { idVocabulary: idVUnits }, },
                    Vocabulary_Model_idVPurposeToVocabulary:        { connect: { idVocabulary: idVPurpose }, },
                    Asset:                                          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : idAssetThumbnailOrig ? { disconnect: true, } : undefined,
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Model.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idModel } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findOne({ where: { idModel, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.model.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idModel: number): Promise<Model | null> {
        if (!idModel)
            return null;
        try {
            return DBC.CopyObject<ModelBase, Model>(
                await DBC.DBConnectionFactory.prisma.model.findOne({ where: { idModel, }, }), Model);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Model.fetch', error);
            return null;
        }
    }

    static async fetchFromXref(idScene: number): Promise<Model[] | null> {
        if (!idScene)
            return null;
        try {
            return DBC.CopyArray<ModelBase, Model>(
                await DBC.DBConnectionFactory.prisma.model.findMany({ where: { ModelSceneXref: { some: { idScene }, }, }, }), Model);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.fetchModelFromXref', error);
            return null;
        }
    }
}
