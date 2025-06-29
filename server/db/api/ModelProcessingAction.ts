/* eslint-disable camelcase */
import { ModelProcessingAction as ModelProcessingActionBase } from '@prisma/client';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export class ModelProcessingAction extends DBC.DBObject<ModelProcessingActionBase> implements ModelProcessingActionBase {
    idModelProcessingAction!: number;
    idModel!: number;
    idActor!: number;
    DateProcessed!: Date;
    Description!: string;
    ToolsUsed!: string;

    constructor(input: ModelProcessingActionBase) {
        super(input);
    }

    public fetchTableName(): string { return 'ModelProcessingAction'; }
    public fetchID(): number { return this.idModelProcessingAction; }

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
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ ...this },'DB.Model.Processing.Action');
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
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ ...this },'DB.Model.Processing.Action');
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
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ ...this },'DB.Model.Processing.Action');
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
            RK.logError(RK.LogSection.eDB,'fetch from Model failed',H.Helpers.getErrorString(error),{ ...this },'DB.Model.Processing.Action');
            return null;
        }
    }
}
