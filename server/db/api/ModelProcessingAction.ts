/* eslint-disable camelcase */
import { ModelProcessingAction as ModelProcessingActionBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class ModelProcessingAction extends DBC.DBObject<ModelProcessingActionBase> implements ModelProcessingActionBase {
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
                await DBC.DBConnection.prisma.modelProcessingAction.create({
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
            LOG.error('DBAPI.ModelProcessingAction.create', LOG.LS.eDB, error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idModelProcessingAction, idModel, idActor, DateProcessed, ToolsUsed, Description } = this;
            return await DBC.DBConnection.prisma.modelProcessingAction.update({
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
            LOG.error('DBAPI.ModelProcessingAction.update', LOG.LS.eDB, error);
            return false;
        }
    }

    static async fetch(idModelProcessingAction: number): Promise<ModelProcessingAction | null> {
        if (!idModelProcessingAction)
            return null;
        try {
            return DBC.CopyObject<ModelProcessingActionBase, ModelProcessingAction>(
                await DBC.DBConnection.prisma.modelProcessingAction.findUnique({ where: { idModelProcessingAction, }, }), ModelProcessingAction);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelProcessingAction.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromModel(idModel: number): Promise<ModelProcessingAction[] | null> {
        if (!idModel)
            return null;
        try {
            return DBC.CopyArray<ModelProcessingActionBase, ModelProcessingAction>(
                await DBC.DBConnection.prisma.modelProcessingAction.findMany({ where: { idModel } }), ModelProcessingAction);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.ModelProcessingAction.fetchFromModel', LOG.LS.eDB, error);
            return null;
        }
    }
}
