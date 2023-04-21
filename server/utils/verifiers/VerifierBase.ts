/* eslint-disable @typescript-eslint/no-explicit-any */
import * as COL from '../../collections/interface';
import * as LOG from '../logger';
import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as COMMON from '@dpo-packrat/common';
import * as WF from '../../workflow/interface';
import * as H from '../../utils/helpers';
// import * as REP from '../../report/interface';
import { ASL, LocalStore } from '../localStore';
import { RouteBuilder, eHrefMode } from '../../http/routes/routeBuilder';
import { WorkflowVerifier } from '../../workflow/impl/Packrat/WorkflowVerifier';

export type VerifierConfig = {
    collection: COL.ICollection;            // what collection to operate on. mostly used for EDAN
    detailedLogs?: boolean | undefined;     // do we want to output detailed debug logs
    logPrefix?: string | undefined;         // what should logs be prefixed with
    fixErrors?: boolean | undefined;        // do we try to fix errors (todo)
    subjectLimit?: number | undefined;      // total number of subjects to process
    systemObjectId?: number | undefined;    // limit execution to this specific SystemObject
    writeToFile?: string | undefined;       // should we dump the output to a specific path
};
export type VerifierResult = {
    success: boolean;
    error?: string;
    data?: any | undefined;
    // csvOutput?: string | undefined;
};
export type IdentifierDetails = {
    identifier: DBAPI.Identifier | null;
    identifierType: DBAPI.Vocabulary | null;
    identifierTypeEnum: COMMON.eVocabularyID | null;
};

export type IdentifierList = {
    preferred: IdentifierDetails | null;
    edan: IdentifierDetails | null;
    ark: IdentifierDetails | null;
    details: IdentifierDetails[];  // complete list of all identifiers
};

export class VerifierBase {

    protected config: VerifierConfig;
    // protected idReport: number | undefined = -1;
    // protected reportData: string | undefined; // stores the report data when done (todo: add to report itself)
    private LS: LocalStore | undefined;
    protected workflow: WorkflowVerifier | null;

    constructor(config: VerifierConfig) {
        this.config = config;
        this.workflow = null;

        // defaults if undefined
        if(this.config.detailedLogs === undefined)
            this.config.detailedLogs = false;
        if(this.config.logPrefix === undefined)
            this.config.logPrefix = 'Base Verifier';
        if(this.config.fixErrors === undefined)
            this.config.fixErrors = false;
        if(this.config.subjectLimit === undefined)
            this.config.subjectLimit = 10000; // total number of subjects to process
        if(this.config.systemObjectId === undefined)
            this.config.systemObjectId = -1; // limit execution to this specific SystemObject
    }

    public async init(): Promise<VerifierResult> {
        // This routine creates a workflow for the validator and starts it
        // clear any existing report data
        await this.setStatus(COMMON.eWorkflowJobRunStatus.eUnitialized);
        LOG.info(`${this.constructor.name} starting...`,LOG.LS.eAUDIT);
        // if(this.reportData != undefined && this.reportData.length > 0) {
        //     LOG.info('clearing existing report data.',LOG.LS.eAUDIT);
        //     this.reportData = undefined;
        // }

        // grab an instance of our engine so we can create workflows
        const workflowEngine: WF.IWorkflowEngine | null = await WF.WorkflowFactory.getInstance();
        if (!workflowEngine) {
            const error: string = 'verifiers createWorkflow could not load WorkflowEngine';
            return { success: false, error };
        }

        // get our local store for global values (e.g. user id)
        this.LS = ASL.getStore();
        const idUser: number | undefined | null = this.LS?.idUser;

        // define our workflow parameters
        const wfParams: WF.WorkflowParameters = {
            eWorkflowType: COMMON.eVocabularyID.eWorkflowTypeVerifier,
            //idSystemObject: undefined, // not operating on SystemObjects
            //idProject: TODO: populate with idProject
            idUserInitiator: idUser ?? undefined,   // not getting user at this point (but should when behind wall)
            autoStart: true,   // if not set to true (default), then need to manually call 'start()' on workflow
            parameters: {
                verifier: this  // reference to this identifier so it can be called on by the Engine
            }
        };

        // todo: test failed creation to see if cast works
        this.workflow = await workflowEngine.create(wfParams) as WorkflowVerifier;
        if (!this.workflow) {
            const error: string = `${this.constructor.name} unable to create Verifier workflow: ${H.Helpers.JSONStringify(wfParams)}`;
            return { success: false, error };
        }

        // grab our workflow and report ids
        const idWorkflow: number | undefined = this.workflow.getWorkflowID();
        const idWorkflowReport: number | undefined = this.workflow.getReportID();
        const workflowReportUrl: string = idWorkflowReport?RouteBuilder.DownloadWorkflowReport(idWorkflowReport,eHrefMode.ePrependServerURL):'null';

        // set our status
        await this.setStatus(COMMON.eWorkflowJobRunStatus.eCreated);
        LOG.info(`${this.constructor.name} started`,LOG.LS.eAUDIT);

        // LOG.info('creating workflow from route...',LOG.LS.eWF);
        //LOG.info(H.Helpers.JSONStringify(this.workflow),LOG.LS.eWF);

        //
        // const iReport: REP.IReport | null = await REP.ReportFactory.getReport();
        // if(!iReport) {
        //     const error: string = 'EDAN Verifier workflow failed to get report.';
        //     return { success: false, message: error };
        // }
        // console.log(iReport);

        // ...
        // const workflowResult: H.IOResults = await workflow.start();
        // if(!workflowResult || workflowResult.success===false) {
        //     const error: string = 'EDAN Verifier workflow failed to start. '+workflowResult?.error;
        //     sendResponseMessage(response,false,error);
        //     return;
        // }

        // // grab our report from the factory
        // const iReport: REP.IReport | null = await REP.ReportFactory.getReport();
        // if(!iReport) {
        //     const error: string = `${this.constructor.name} failed to get workflow report.`;
        //     return { success: false, message: error };
        // }

        // console.log(iReport);

        // // get our report ID
        // this.idReport = this.LS?.getWorkflowReportID();
        // if (!this.idReport) {
        //     const error: string = `${this.constructor.name} could not get workflow report ID`;
        //     return { success: false, message: error };
        // }

        // console.log('report id: '+this.idReport);

        // return success and our id to keep check on it's completeness
        return { success: true, data: { isDone: false, idWorkflow, idWorkflowReport, workflowReportUrl } };
    }
    public stop(): VerifierResult | null {
        return null;
    }

    public async getReport(allowPartial: boolean = false): Promise<VerifierResult> {

        // see if we're done
        if(!this.workflow)
            return { success: false, error: `${this.constructor.name} cannot get report. workflow is null.` };

        // if we're running return so caller can keep polling
        const status: COMMON.eWorkflowJobRunStatus = this.getStatus();
        if(allowPartial===false) {
            if(status === COMMON.eWorkflowJobRunStatus.eRunning || status === COMMON.eWorkflowJobRunStatus.eWaiting) {
                return { success: false, error: `${this.constructor.name} workflow is still running`, data: { status } };
            }
        }

        // grab the report itself from our workflow
        const report: DBAPI.WorkflowReport | null = await this.workflow.getReport();
        if(!report)
            return { success: false, error: `${this.constructor.name} cannot get report.`, data: { idWorkflow: this.workflow.getWorkflowID() } };

        // send the report contents back
        LOG.info(`${this.constructor.name} returned report (length: ${report.Data.length})`,LOG.LS.eAUDIT);
        return {
            success: true,
            data: {
                idWorkflow: this.workflow.getWorkflowID(),
                idReport: this.workflow.getReportID,
                content: report.Data
            } };
    }

    public async verify(): Promise<VerifierResult> {
        return { success: true };
    }

    public isDone(): boolean {

        // get our status and then see if it's in a completed state
        const status: COMMON.eWorkflowJobRunStatus = this.getStatus();

        const workflowComplete: boolean = (status === COMMON.eWorkflowJobRunStatus.eDone
            || status === COMMON.eWorkflowJobRunStatus.eError
            || status === COMMON.eWorkflowJobRunStatus.eCancelled);

        return workflowComplete;
    }
    public getStatus(): COMMON.eWorkflowJobRunStatus {
        if(this.workflow === null) {
            LOG.error(`${this.constructor.name} cannot get status. no workflow set.`,LOG.LS.eAUDIT);
            return COMMON.eWorkflowJobRunStatus.eUnitialized;
        }

        return (this.workflow as WorkflowVerifier).getStatus();
    }
    protected async setStatus(status: COMMON.eWorkflowJobRunStatus ): Promise<boolean> {
        // set the status of our workflow to reflect the current state of operations
        const result: WF.WorkflowUpdateResults | undefined = await this.workflow?.updateStatus(status);
        if(result?.success === false){
            LOG.error(`Cannot set workflow status in ${this.constructor.name}. ${result.error??'unknown error'}`,LOG.LS.eAUDIT);
            return false;
        }
        return true;
    }

    protected async getIdentifierType(identifier: DBAPI.Identifier): Promise<IdentifierDetails | null> {

        // grab the identifier type object from the Packrat DB
        // TODO: use Vocabulary.CACHE to reduce DB hits
        const identifierType: DBAPI.Vocabulary | null = await DBAPI.Vocabulary.fetch(identifier.idVIdentifierType);
        if(!identifierType){
            LOG.error(`could not find identifier type in DB (identifier: ${identifier.idVIdentifierType} )`, LOG.LS.eAUDIT);
            return null;
        }

        // pull from enumeration from the CACHE (vocabulary id -> enum)
        const identifierTypeEnum: COMMON.eVocabularyID | undefined = await CACHE.VocabularyCache.vocabularyIdToEnum(identifier.idVIdentifierType);
        if(identifierTypeEnum===undefined){
            LOG.error(`could not find enumerator for identifier type (${identifier.idVIdentifierType}) in Cache`, LOG.LS.eAUDIT);
            return null;
        }

        return { identifier, identifierType, identifierTypeEnum };
    }

    protected async getSubjectIdentifiers(subject: DBAPI.Subject, systemObject: DBAPI.SystemObject): Promise<IdentifierList | null> {

        // structure to hold our results
        const result: IdentifierList = { preferred: null, edan: null, ark: null, details: [] };

        // grab the preferred identifier, if nothing then leave null so calling can decide action
        if(subject.idIdentifierPreferred) {
            const preferredIdentifier: DBAPI.Identifier | null = await DBAPI.Identifier.fetch(subject.idIdentifierPreferred);
            if(!preferredIdentifier){
                LOG.error(`subject's preferredId not found in the DB (id: ${subject.idSubject} | subject: ${subject.Name})`, LOG.LS.eAUDIT);
                // subjectStats[i].isValid = false;
            } else {
                // grab our identifier details (type) and store it
                const preferredIdentifierDetails: IdentifierDetails | null = await this.getIdentifierType(preferredIdentifier);
                if(preferredIdentifierDetails) {
                    result.preferred = preferredIdentifierDetails;
                    result.details.push(preferredIdentifierDetails);
                }

                // check for edan/ark and store as appropriate because the preferred id may be ARK too
                switch(preferredIdentifierDetails?.identifierTypeEnum){
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeEdanRecordID: {
                        if(!result.edan) result.edan = preferredIdentifierDetails;
                    } break;

                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeARK: {
                        if(!result.ark) result.ark = preferredIdentifierDetails;
                    } break;
                }
            }
        }

        // grab our list of identifiers from the SystemObject id
        const identifiers: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromSystemObject(systemObject.idSystemObject);
        if(!identifiers){
            LOG.error(`could not get identifiers from subject (id: ${subject.idSubject} | subject: ${subject.Name})`, LOG.LS.eAUDIT);
            return null;
        }
        if(identifiers.length<=0){
            LOG.info(`(WARNING) no identifiers assigned to subject (id: ${subject.idSubject} | subject: ${subject.Name})`, LOG.LS.eAUDIT);
            return result;
        }

        // cycle through all identifiers, find EDAN/ARK, and push to list
        for(const identifier of identifiers) {

            // get our details for this identifier, skip if error, store if valid
            const details: IdentifierDetails | null = await this.getIdentifierType(identifier);
            if(!details) {
                LOG.error(`could not get identifier details from subject (identifier: ${identifier.IdentifierValue} | id: ${subject.idSubject} | subject: ${subject.Name})`, LOG.LS.eAUDIT);
                continue;
            }

            // make sure it doesn't already exist before pushing it
            // TODO: revisit test in case of 'undefines'
            let idExists: boolean = false;
            for(const id of result.details){
                if(details.identifierTypeEnum===id.identifierTypeEnum &&
                    details.identifier?.IdentifierValue==id.identifier?.IdentifierValue) {
                    idExists = true;
                    break;
                }
            }
            if(idExists) continue;

            // if not found push it and categorize it
            result.details?.push(details);

            // check the enumeration type to see if it's an edan or ark type
            switch(details.identifierTypeEnum){
                case COMMON.eVocabularyID.eIdentifierIdentifierTypeEdanRecordID: {
                    if(!result.edan) result.edan = details;
                } break;

                case COMMON.eVocabularyID.eIdentifierIdentifierTypeARK: {
                    if(!result.ark) result.ark = details;
                } break;
            }
        }

        return result;
    }

    protected async getSubjectUnit(subject: DBAPI.Subject): Promise<DBAPI.Unit | null> {

        const packratUnit = await DBAPI.Unit.fetch(subject.idUnit);
        if(!packratUnit) {
            LOG.error(`Packrat DB did not return a unit for subject. (id: ${subject.idSubject} | subject: ${subject.Name})`, LOG.LS.eAUDIT);
            return null;
        }

        // Todo: any additional verification or handling?

        return packratUnit;
    }

    protected async getUnitFromEdanUnit(edanUnit: string): Promise<DBAPI.Unit | null> {

        // TODO: relocate logic to central/shared location to benefit ingestion

        // see if Packrat's UnitEdan table has a direct match for this unit.
        const edanUnits: DBAPI.UnitEdan | null = await DBAPI.UnitEdan.fetchFromAbbreviation(edanUnit);
        if(edanUnits && edanUnits.idUnit) { // && edanUnits.length==1 && edanUnits[0].idUnit) {
            const result = DBAPI.Unit.fetch(edanUnits.idUnit);
            if(result) return result;
        }

        LOG.error(`did not find EDAN unit in the UnitEdan DB. investigate adding it... (${edanUnit}) `, LOG.LS.eAUDIT);
        return null;
    }

    protected async getEdanRecordIdentifiers(record: COL.CollectionQueryResultRecord): Promise<IdentifierList | null> {

        // structure to hold our results
        const result: IdentifierList = { preferred: null, edan: null, ark: null, details: [] };

        // see if we have an EDAN id stored
        if(record.identifierCollection) {
            // get the identifier if it exists
            // HACK: prefixing identifier with 'edanmdm' to match Packrat's records
            const edanIdentifiers: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromIdentifierValue('edanmdm:'+record.identifierCollection);
            if(edanIdentifiers) {

                // cycle through and get our type and details
                for(const identifier of edanIdentifiers) {
                    const details: IdentifierDetails | null = await this.getIdentifierType(identifier);
                    if(!details) {
                        LOG.error(`could not get details for EDAN identifier (type: ${identifier.idVIdentifierType} | value:${identifier.IdentifierValue})`, LOG.LS.eAUDIT);
                        continue;
                    }

                    // if we have an identifier that is of the same type then store
                    if(details.identifierTypeEnum===COMMON.eVocabularyID.eIdentifierIdentifierTypeEdanRecordID) {
                        result.edan = details;
                        result.details?.push(details);
                        break;
                    }
                }
            } else {
                // TODO: create new identifier, type, and of EDAN Record ID type
            }
        }

        // see if we have an ARK id stored
        if(record.identifierPublic) {
            // get the identifier if it exists
            const arkIdentifiers: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromIdentifierValue(record.identifierPublic);
            if(arkIdentifiers) {
                // cycle through and get our type and details
                for(const identifier of arkIdentifiers) {
                    const details: IdentifierDetails | null = await this.getIdentifierType(identifier);
                    if(!details) {
                        LOG.error(`could not get details for ARK identifier (type: ${identifier.idVIdentifierType} | value:${identifier.IdentifierValue})`, LOG.LS.eAUDIT);
                        continue;
                    }

                    // if we have an identifier that is of the same type then store
                    // todo: verify it's an actual ARK id
                    if(details.identifierTypeEnum===COMMON.eVocabularyID.eIdentifierIdentifierTypeARK) {
                        result.ark = details;
                        result.details?.push(details);
                        break;
                    }
                }
            } else {
                // todo: create new identifier, type, and of ARK type
            }
        }

        // handle identifiers by checking if any returned by EDAN
        if(record.identifierMap) {
            for (const [ label, content ] of record.identifierMap) {

                // get our type for this identifier
                const identifierType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.mapIdentifierType(label);
                if (!identifierType) {
                    LOG.error(`\tencountered unknown identifier type ${label} for EDAN record ${record.name}`, LOG.LS.eAUDIT);
                    continue;
                }

                // pull enumeration from the CACHE (vocabulary id -> enum)
                const identifierTypeEnum: COMMON.eVocabularyID | undefined = await CACHE.VocabularyCache.vocabularyIdToEnum(identifierType.idVocabulary);
                if(identifierTypeEnum===undefined){
                    LOG.error(`\tcould not find enumerator for identifier type (${identifierType.Term}) in Cache`, LOG.LS.eAUDIT);
                    continue;
                }

                // if identifier exists in our database (value & type) then store it
                const identifiers: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromIdentifierValue(content);
                if(identifiers) {
                    for(const identifier of identifiers) {
                        const details: IdentifierDetails | null = await this.getIdentifierType(identifier);
                        if(!details) {
                            LOG.error(`could not get details for EDAN identifier (type: ${identifier.idVIdentifierType} | value:${identifier.IdentifierValue})`, LOG.LS.eAUDIT);
                            continue;
                        }

                        // if we have an identifier that is of the same type then store
                        if(details.identifierTypeEnum===identifierTypeEnum) {
                            result.details?.push(details);
                            break;
                        }
                    }
                } else {
                    // didn't find the identifier in our database so create one
                    // TODO: make DBAPI.Identifier object
                    const details: IdentifierDetails = { identifier: null, identifierType, identifierTypeEnum };
                    result.details?.push(details);
                }

                // console.log('EDAN: '+label+'|'+content+'|'+JSON.stringify(vIdentifierType));
            }
        }

        return result;
    }

    protected async replacePackratUnit(_packratUnit: DBAPI.Unit | null, _edanUnit: DBAPI.Unit): Promise<boolean> {
        // TODO: update the Subject record, and point it at the correct idUnit for the Edan Unit
        return true;
    }

    protected async replacePackratIdentifiers(_packratIdentifiers: IdentifierList, _edanIdentifiers: IdentifierList, _systemObject: DBAPI.SystemObject): Promise<boolean> {

        // [?] do we remove previous identifiers?
        // [?] do we repurpose them by reassign new values keeping ids (still need to add/remove if count mismatch)?
        // cycle through edan identifiers creating new entries in the DB for each attached to the same SystemObject

        return true;
    }

    protected isIdentifierFromDPO(identifier: DBAPI.Identifier): boolean {
        // simply check if the EDAN id starts with the DPO prefix.
        // TODO: make more robust with additional checks(?)
        return (identifier.IdentifierValue.startsWith('dpo_3d') || identifier.IdentifierValue.startsWith('edanmdm:dpo_3d'));
    }

    protected getSystemObjectDetailsURL(systemObject: DBAPI.SystemObject): string {
        return '=HYPERLINK("https://packrat-test.si.edu:8443/repository/details/'+systemObject.idSystemObject+'")';
    }

}
