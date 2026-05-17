import * as COMMON from '@dpo-packrat/common';
import { JobAuditRetention } from '../../job/impl/NS/JobAuditRetention';
import { Audit } from '../../db/api/Audit';
import { AuditFactory } from '../../audit/interface/AuditFactory';
import { Workflow } from '../../db/api/Workflow';
import { WorkflowStep } from '../../db/api/WorkflowStep';
import { WorkflowReport } from '../../db/api/WorkflowReport';
import { VocabularyCache } from '../../cache/VocabularyCache';

describe('JobAuditRetention workflow wrapping', () => {
    let workflowCreateSpy: jest.SpyInstance;
    let workflowUpdateSpy: jest.SpyInstance;
    let stepCreateSpy: jest.SpyInstance;
    let stepUpdateSpy: jest.SpyInstance;
    let reportCreateSpy: jest.SpyInstance;
    let vocabSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.spyOn(Audit, 'skeletonBefore').mockResolvedValue(0);
        jest.spyOn(Audit, 'deleteBefore').mockResolvedValue(0);
        jest.spyOn(AuditFactory, 'emit').mockResolvedValue(true);

        workflowCreateSpy = jest.spyOn(Workflow.prototype, 'create').mockResolvedValue(true);
        workflowUpdateSpy = jest.spyOn(Workflow.prototype, 'update').mockResolvedValue(true);
        stepCreateSpy = jest.spyOn(WorkflowStep.prototype, 'create').mockResolvedValue(true);
        stepUpdateSpy = jest.spyOn(WorkflowStep.prototype, 'update').mockResolvedValue(true);
        reportCreateSpy = jest.spyOn(WorkflowReport.prototype, 'create').mockResolvedValue(true);

        vocabSpy = jest.spyOn(VocabularyCache, 'vocabularyEnumToId').mockImplementation(async (e) => {
            if (e === COMMON.eVocabularyID.eWorkflowTypeAuditRetention) return 7777;
            if (e === COMMON.eVocabularyID.eWorkflowStepTypeStart) return 8888;
            return undefined;
        });
    });

    afterEach(() => jest.restoreAllMocks());

    test('creates Workflow + WorkflowStep + WorkflowReport when vocab is seeded', async () => {
        await JobAuditRetention.run();
        expect(workflowCreateSpy).toHaveBeenCalledTimes(1);
        expect(stepCreateSpy).toHaveBeenCalledTimes(1);
        expect(stepUpdateSpy).toHaveBeenCalledTimes(1);
        expect(reportCreateSpy).toHaveBeenCalledTimes(1);
        expect(workflowUpdateSpy).toHaveBeenCalledTimes(1);
    });

    test('final WorkflowStep state is eDone on a clean run', async () => {
        await JobAuditRetention.run();
        const stepInstance = stepUpdateSpy.mock.instances[0] as WorkflowStep;
        expect(stepInstance.State).toBe(COMMON.eWorkflowJobRunStatus.eDone);
        expect(stepInstance.DateCompleted).toBeInstanceOf(Date);
    });

    test('skips workflow creation when vocab term is not seeded', async () => {
        vocabSpy.mockResolvedValue(undefined);
        const result = await JobAuditRetention.run();
        expect(workflowCreateSpy).not.toHaveBeenCalled();
        expect(stepCreateSpy).not.toHaveBeenCalled();
        expect(reportCreateSpy).not.toHaveBeenCalled();
        // The retention work itself still ran and returned a result.
        expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    test('WorkflowReport carries the run summary as JSON', async () => {
        await JobAuditRetention.run();
        const reportInstance = reportCreateSpy.mock.instances[0] as WorkflowReport;
        expect(reportInstance.MimeType).toBe('application/json');
        expect(reportInstance.Name).toBe('Audit Retention Run Summary');
        const parsed = JSON.parse(reportInstance.Data);
        expect(parsed).toHaveProperty('skeletoned');
        expect(parsed).toHaveProperty('transientDeleted');
        expect(parsed).toHaveProperty('durationMs');
        expect(parsed).toHaveProperty('cancelled');
    });

    test('cancellation marks WorkflowStep state as eCancelled', async () => {
        // Request cancel immediately so the pass loop short-circuits and result.cancelled=true.
        JobAuditRetention.requestCancel();
        await JobAuditRetention.run();
        const stepInstance = stepUpdateSpy.mock.instances[0] as WorkflowStep;
        expect(stepInstance.State).toBe(COMMON.eWorkflowJobRunStatus.eCancelled);
    });
});
