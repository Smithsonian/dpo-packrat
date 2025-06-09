import { IWorkflowEngine } from './IWorkflowEngine';
import { WorkflowEngine } from '../impl/Packrat';
import { Config, WORKFLOW_TYPE } from '../../config';

export class WorkflowFactory {
    private static instance: IWorkflowEngine | null = null;

    static async getInstance(): Promise<IWorkflowEngine | null> {
        /* istanbul ignore else */
        if (!WorkflowFactory.instance) {
            switch (Config.workflow.type) {
                /* istanbul ignore next */
                default:
                case WORKFLOW_TYPE.PACKRAT: {
                    WorkflowFactory.instance = new WorkflowEngine();
                    break;
                }
            }
        }
        return WorkflowFactory.instance;
    }
}
