/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
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

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
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
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelProcessingAction.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
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
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
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
        } catch (error) /* istanbul ignore next */ {
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
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ModelProcessingAction.fetchFromModel', error);
            return null;
        }
    }
}
