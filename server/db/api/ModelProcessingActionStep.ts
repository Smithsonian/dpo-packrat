/* eslint-disable camelcase */
import { ModelProcessingActionStep as ModelProcessingActionStepBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class ModelProcessingActionStep extends DBO.DBObject<ModelProcessingActionStepBase> implements ModelProcessingActionStepBase {
    idModelProcessingActionStep!: number;
    Description!: string;
    idModelProcessingAction!: number;
    idVActionMethod!: number;

    constructor(input: ModelProcessingActionStepBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { idModelProcessingAction, idVActionMethod, Description } = this;
            ({ idModelProcessingActionStep: this.idModelProcessingActionStep, idModelProcessingAction: this.idModelProcessingAction,
                idVActionMethod: this.idVActionMethod, Description: this.Description } =
                await DBConnectionFactory.prisma.modelProcessingActionStep.create({
                    data: {
                        ModelProcessingAction:  { connect: { idModelProcessingAction }, },
                        Vocabulary:             { connect: { idVocabulary: idVActionMethod }, },
                        Description,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelProcessingActionStep.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idModelProcessingActionStep, idModelProcessingAction, idVActionMethod, Description } = this;
            return await DBConnectionFactory.prisma.modelProcessingActionStep.update({
                where: { idModelProcessingActionStep, },
                data: {
                    ModelProcessingAction:  { connect: { idModelProcessingAction }, },
                    Vocabulary:             { connect: { idVocabulary: idVActionMethod }, },
                    Description,
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelProcessingActionStep.update', error);
            return false;
        }
    }

    static async fetch(idModelProcessingActionStep: number): Promise<ModelProcessingActionStep | null> {
        if (!idModelProcessingActionStep)
            return null;
        try {
            return DBO.CopyObject<ModelProcessingActionStepBase, ModelProcessingActionStep>(
                await DBConnectionFactory.prisma.modelProcessingActionStep.findOne({ where: { idModelProcessingActionStep, }, }), ModelProcessingActionStep);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelProcessingActionStep.fetch', error);
            return null;
        }
    }

    static async fetchFromModelProcessingAction(idModelProcessingAction: number): Promise<ModelProcessingActionStep[] | null> {
        if (!idModelProcessingAction)
            return null;
        try {
            return DBO.CopyArray<ModelProcessingActionStepBase, ModelProcessingActionStep>(
                await DBConnectionFactory.prisma.modelProcessingActionStep.findMany({ where: { idModelProcessingAction } }), ModelProcessingActionStep);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelProcessingActionStep.fetchFromModelProcessingAction', error);
            return null;
        }
    }
}
