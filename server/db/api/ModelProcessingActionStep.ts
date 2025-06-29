/* eslint-disable camelcase */
import { ModelProcessingActionStep as ModelProcessingActionStepBase } from '@prisma/client';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export class ModelProcessingActionStep extends DBC.DBObject<ModelProcessingActionStepBase> implements ModelProcessingActionStepBase {
    idModelProcessingActionStep!: number;
    idModelProcessingAction!: number;
    idVActionMethod!: number;
    Description!: string;

    constructor(input: ModelProcessingActionStepBase) {
        super(input);
    }

    public fetchTableName(): string { return 'ModelProcessingActionStep'; }
    public fetchID(): number { return this.idModelProcessingActionStep; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idModelProcessingAction, idVActionMethod, Description } = this;
            ({ idModelProcessingActionStep: this.idModelProcessingActionStep, idModelProcessingAction: this.idModelProcessingAction,
                idVActionMethod: this.idVActionMethod, Description: this.Description } =
                await DBC.DBConnection.prisma.modelProcessingActionStep.create({
                    data: {
                        ModelProcessingAction:  { connect: { idModelProcessingAction }, },
                        Vocabulary:             { connect: { idVocabulary: idVActionMethod }, },
                        Description,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ ...this },'DB.Model.Processing.Action.Step');
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idModelProcessingActionStep, idModelProcessingAction, idVActionMethod, Description } = this;
            return await DBC.DBConnection.prisma.modelProcessingActionStep.update({
                where: { idModelProcessingActionStep, },
                data: {
                    ModelProcessingAction:  { connect: { idModelProcessingAction }, },
                    Vocabulary:             { connect: { idVocabulary: idVActionMethod }, },
                    Description,
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ ...this },'DB.Model.Processing.Action.Step');
            return false;
        }
    }

    static async fetch(idModelProcessingActionStep: number): Promise<ModelProcessingActionStep | null> {
        if (!idModelProcessingActionStep)
            return null;
        try {
            return DBC.CopyObject<ModelProcessingActionStepBase, ModelProcessingActionStep>(
                await DBC.DBConnection.prisma.modelProcessingActionStep.findUnique({ where: { idModelProcessingActionStep, }, }), ModelProcessingActionStep);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ ...this },'DB.Model.Processing.Action.Step');
            return null;
        }
    }

    static async fetchFromModelProcessingAction(idModelProcessingAction: number): Promise<ModelProcessingActionStep[] | null> {
        if (!idModelProcessingAction)
            return null;
        try {
            return DBC.CopyArray<ModelProcessingActionStepBase, ModelProcessingActionStep>(
                await DBC.DBConnection.prisma.modelProcessingActionStep.findMany({ where: { idModelProcessingAction } }), ModelProcessingActionStep);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ ...this },'DB.Model.Processing.Action.Step');
            return null;
        }
    }
}
