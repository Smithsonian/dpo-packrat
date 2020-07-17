/* eslint-disable camelcase */
import { ModelProcessingAction as ModelProcessingActionBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class ModelProcessingAction extends DBO.DBObject<ModelProcessingActionBase> implements ModelProcessingActionBase {
    idModelProcessingAction!: number;
    DateProcessed!: Date;
    Description!: string;
    idActor!: number;
    idModel!: number;
    ToolsUsed!: string;

    constructor(input: ModelProcessingActionBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { idModel, idActor, DateProcessed, ToolsUsed, Description } = this;
            ({ idModelProcessingAction: this.idModelProcessingAction, idModel: this.idModel, idActor: this.idActor,
                DateProcessed: this.DateProcessed, ToolsUsed: this.ToolsUsed, Description: this.Description } =
                await DBConnectionFactory.prisma.modelProcessingAction.create({
                    data: {
                        Model:          { connect: { idModel }, },
                        Actor:          { connect: { idActor }, },
                        DateProcessed,
                        ToolsUsed,
                        Description,
                    },
                }));
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.ModelProcessingAction.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idModelProcessingAction, idModel, idActor, DateProcessed, ToolsUsed, Description } = this;
            return await DBConnectionFactory.prisma.modelProcessingAction.update({
                where: { idModelProcessingAction, },
                data: {
                    Model:          { connect: { idModel }, },
                    Actor:          { connect: { idActor }, },
                    DateProcessed,
                    ToolsUsed,
                    Description,
                },
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.ModelProcessingAction.update', error);
            return false;
        }
    }

    static async fetch(idModelProcessingAction: number): Promise<ModelProcessingAction | null> {
        if (!idModelProcessingAction)
            return null;
        try {
            return DBO.CopyObject<ModelProcessingActionBase, ModelProcessingAction>(
                await DBConnectionFactory.prisma.modelProcessingAction.findOne({ where: { idModelProcessingAction, }, }), ModelProcessingAction);
        } catch (error) {
            LOG.logger.error('DBAPI.ModelProcessingAction.fetch', error);
            return null;
        }
    }

    static async fetchFromModel(idModel: number): Promise<ModelProcessingAction[] | null> {
        if (!idModel)
            return null;
        try {
            return DBO.CopyArray<ModelProcessingActionBase, ModelProcessingAction>(
                await DBConnectionFactory.prisma.modelProcessingAction.findMany({ where: { idModel } }), ModelProcessingAction);
        } catch (error) {
            LOG.logger.error('DBAPI.ModelProcessingAction.fetchFromModel', error);
            return null;
        }
    }
}
