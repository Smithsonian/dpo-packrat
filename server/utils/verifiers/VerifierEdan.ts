import * as COL from '../../collections/interface';
import * as LOG from '../logger';
import * as DBAPI from '../../db';
import * as V from './VerifierBase';
import * as COMMON from '@dpo-packrat/common';

//----------------------------------------------------------------
// EDAN VERIFIER
//----------------------------------------------------------------
// [DPO3DPKRT-698]
// TODO: ocassional failed fetch requests (ECONNRESET). make more robust
// TODO: verify EDAN scene UUID are correct
// TODO: verify EDAN 3d_package match the most recent published version
// TODO: hook to endpoint and support running on a schedule via node_scheduler*
// TODO: fix DPO subject errors
export class VerifierEdan extends V.VerifierBase {

    constructor(config: V.VerifierConfig){
        super(config);

        // this.config = verifierConfig;
        this.config.collection = config.collection;

        // if we don't have a prefix or it's assigned to the base, reset it
        if(this.config.logPrefix === undefined || this.config.logPrefix === 'Base Verifier')
            this.config.logPrefix = 'EDAN Verifier';
    }

    public async verify(): Promise<V.VerifierResult> {

        LOG.info(`${this.constructor.name} verifying...`,LOG.LS.eAUDIT);

        // our structure and header for saved output to CSV
        const output: string[] = [];
        output.push('ID,MDM,URL,SUBJECT,STATUS,TEST,DESCRIPTION,PACKRAT,EDAN,NOTES');

        // fetch all subjects from Packrat DB
        const subjects: DBAPI.Subject[] | null = await DBAPI.Subject.fetchAll(); /* istanbul ignore if */
        if (!subjects) {
            await this.setStatus(COMMON.eWorkflowJobRunStatus.eError);
            const error: string = `${this.config.logPrefix} could not get subjects from DB`;
            LOG.error(error, LOG.LS.eAUDIT);
            return { success: false, error };
        }
        if(subjects.length<=0) {
            await this.setStatus(COMMON.eWorkflowJobRunStatus.eError);
            const error: string = `${this.config.logPrefix} no subjects found in DB`;
            LOG.error(error, LOG.LS.eAUDIT);
            return { success: false, error  };
        }
        if(this.config.detailedLogs)
            LOG.info(`${this.config.logPrefix} Subjects: ${subjects.length}`, LOG.LS.eAUDIT);

        // loop through subjects, extract name, query from EDAN
        for(let i=0; i<subjects.length; i++) {

            // adjust our counter for # of subjects and bail when done
            if(this.config.subjectLimit && i>=this.config.subjectLimit) break;

            // create our stats object and helper variable
            const subject = subjects[i];

            // get our system object for the subject to help with logging and identification
            const systemObject: DBAPI.SystemObject | null = await subject.fetchSystemObject();
            if(!systemObject){
                LOG.error(`could not get SystemObject from subject. (id: ${subject.idSubject} | subject: ${subject.Name})`, LOG.LS.eAUDIT);
                continue;
            }
            if(this.config.detailedLogs)
                LOG.info(`${this.config.logPrefix} SystemObject: ${JSON.stringify(systemObject)}`, LOG.LS.eAUDIT);

            // (debug) if not the desired subject id skip
            if(this.config.systemObjectId && this.config.systemObjectId>0){
                if(systemObject.idSystemObject!==this.config.systemObjectId) {
                    if(this.config.detailedLogs)
                        LOG.info(`${this.config.logPrefix} Subject skipping. IDs don not match.`, LOG.LS.eAUDIT);
                    continue;
                }
            }

            LOG.info(`${this.config.logPrefix} processing subject: ${subject.Name}`, LOG.LS.eAUDIT);
            if(this.config.detailedLogs)
                LOG.info(`${this.config.logPrefix} Subject:\t ${JSON.stringify(subject,null,0)}`, LOG.LS.eAUDIT);

            // get our subject's unit from Packrat DB
            const packratUnit: DBAPI.Unit | null = await this.getSubjectUnit(subject);
            if(!packratUnit) {
                LOG.error(`${this.config.logPrefix} could not find a unit for subject. skipping... (id: ${systemObject.idSystemObject} | subject: ${subject.Name})`, LOG.LS.eAUDIT);
                continue;
            }
            if(this.config.detailedLogs)
                LOG.info(`${this.config.logPrefix} Packrat Units: ${JSON.stringify(packratUnit,null,0)}`, LOG.LS.eAUDIT);

            // get our subject's identifiers, details, and SystemObject id
            const packratIdentifiers: V.IdentifierList | null = await this.getSubjectIdentifiers(subject,systemObject);
            if(!packratIdentifiers) {
                LOG.error(`${this.config.logPrefix} could not get identifiers for subject. skipping... (id: ${systemObject.idSystemObject} | subject: ${subject.Name})`, LOG.LS.eAUDIT);
                continue;
            }
            if(this.config.detailedLogs)
                LOG.info(`${this.config.logPrefix} Packrat Identifiers: ${JSON.stringify(packratIdentifiers,null,0)}`, LOG.LS.eAUDIT);

            // if we have an EDAN (should 100% be true) then determine if from DPO or not
            // defaults to all subjects coming from EDAN
            let isDPOSubject: boolean = false;
            if(packratIdentifiers.edan && packratIdentifiers.edan.identifier) {
                isDPOSubject = this.isIdentifierFromDPO(packratIdentifiers.edan.identifier);
            } else {
                LOG.error(`${this.config.logPrefix} could not get EDAN ID for subject. source of subject is ambiguous. (id: ${systemObject.idSystemObject} | subject: ${subject.Name})`, LOG.LS.eAUDIT);
            }

            // get our packrat name
            const packratName: string = subject.Name;

            // if we have an EDAN id we use it
            let query: string = '';
            if(packratIdentifiers.edan?.identifier)
                query = packratIdentifiers.edan.identifier.IdentifierValue;
            else if(packratIdentifiers.ark?.identifier)
                query = packratIdentifiers.ark.identifier.IdentifierValue;
            else if(packratIdentifiers.preferred?.identifier)
                query = packratIdentifiers.preferred.identifier.IdentifierValue;
            else {
                LOG.error(`${this.config.logPrefix} no good options for querying EDAN for subject. skipping... (id: ${systemObject.idSystemObject} | subject: ${subject.Name})`, LOG.LS.eAUDIT);
                continue;
            }
            if(this.config.detailedLogs)
                LOG.info(`${this.config.logPrefix} Query: ${query}`, LOG.LS.eAUDIT);

            // query EDAN with our identifier and skip if nothing returned
            const options: COL.CollectionQueryOptions | null = {
                recordType: 'edanmdm',
                // gatherRaw: true,
                gatherIDMap: true,
            };
            const results: COL.CollectionQueryResults | null = await this.config.collection.queryCollection(query, 10, 0, options);
            if(!results || results.records.length<=0) {
                LOG.error(`${this.config.logPrefix} did not receive records for subject and identifier. skipping... (id: ${systemObject.idSystemObject} | subject: ${subject.Name} | query: ${query})`, LOG.LS.eAUDIT);
                continue;
            }
            if(this.config.detailedLogs)
                LOG.info(`${this.config.logPrefix} EDAN Results: ${JSON.stringify(results,null,0)}`, LOG.LS.eAUDIT);

            // structure to hold our units/identifiers
            let edanUnit: DBAPI.Unit | null = null;
            let edanIdentifiers: V.IdentifierList | null = null;
            let edanName: string = '';

            // if we received multipled records from EDAN, complain but keep going (compares will place subject in output)
            if(results.records.length==1) {
                const record = results.records[0];

                // get our EDAN units from this record
                const unit: DBAPI.Unit | null = await this.getUnitFromEdanUnit(record.unit);
                if(!unit)
                    LOG.error(`${this.config.logPrefix} no known units found for subject (id: ${systemObject.idSystemObject} | subject: ${subject.Name}) and EDAN record name (${record.name})`, LOG.LS.eAUDIT);
                else
                    edanUnit = unit;
                if(this.config.detailedLogs)
                    LOG.info(`${this.config.logPrefix} EDAN Units: ${JSON.stringify(unit,null,0)}`, LOG.LS.eAUDIT);

                // get our EDAN identifiers from this record
                const identifiers: V.IdentifierList | null = await this.getEdanRecordIdentifiers(record);
                if(!identifiers)
                    LOG.error(`${this.config.logPrefix} no EDAN identifiers found for subject (id: ${systemObject.idSystemObject} | subject: ${subject.Name}) and EDAN record name (${record.name})`, LOG.LS.eAUDIT);
                else
                    edanIdentifiers = identifiers;
                if(this.config.detailedLogs)
                    LOG.info(`${this.config.logPrefix} EDAN Ids: ${JSON.stringify(identifiers,null,0)}`, LOG.LS.eAUDIT);

                // get our name
                edanName = record.name;

            } else {
                LOG.error(`${this.config.logPrefix} received multiple records from EDAN when expecting 1. skipping... (id: ${systemObject.idSystemObject} | subject: ${subject.Name} | query: ${query})`, LOG.LS.eAUDIT);
            }

            // a structure to hold our output
            const outputPrefix = `${systemObject.idSystemObject},${packratIdentifiers.edan?.identifier?.IdentifierValue},${this.getSystemObjectDetailsURL(systemObject)},${JSON.stringify(subject.Name)},`;

            // Compare: Name
            if(packratName!=edanName) {
                LOG.error(`${this.config.logPrefix} Subject name in Packrat and EDAN are not the same (id:${systemObject.idSystemObject} | Packrat:${packratName} | EDAN:${edanName})`, LOG.LS.eAUDIT);
                let str = outputPrefix;
                str += 'error,';
                str += 'name,';
                str += 'Subject name not the same,';
                str += '"' + packratName + '",';
                str += '"' + edanName + '",';
                str += ((isDPOSubject)?'DPO created subject. needs manual fix':'EDAN subject. needs manual fix.')+',';
                output.push(str);
            } else {
                LOG.info(`${this.config.logPrefix} name compare succeeded!`, LOG.LS.eAUDIT);
                let str = outputPrefix;
                str += 'success,';
                str += 'name,';
                str += ',';
                str += '"' + packratName + '",';
                str += '"' + edanName + '",';
                str += ',';
                output.push(str);
            }

            // Compare: Units
            if(packratUnit && edanUnit) {
                // if both present then we check the value match
                let foundUnit: boolean = false;
                if(edanUnit.idUnit===packratUnit.idUnit) {
                    foundUnit = true;
                }

                // if we couldn't find the unit, add error otherwise success
                if(!foundUnit) {
                    LOG.error(`${this.config.logPrefix} Packrat unit does not match EDAN units (id:${systemObject.idSystemObject} | subject:${subject.Name})`, LOG.LS.eAUDIT);
                    let str = outputPrefix;
                    str += 'error,';
                    str += 'units,';
                    str += 'Packrat unit does not match EDAN units,';
                    str += '"' + packratUnit.Abbreviation + ' - ' + packratUnit.Name + '",';
                    str += '"' + edanUnit.Abbreviation + ' - ' + edanUnit.Name +'",';

                    // apply edan unit packrat subject
                    if(isDPOSubject) {
                        str += 'DPO subject. needs manual fix to update EDAN unit info';
                    } else {
                        if(this.config.fixErrors) {
                            const replaceUnitResult: boolean = await this.replacePackratUnit(packratUnit,edanUnit);
                            if(!replaceUnitResult) {
                                LOG.error(`${this.config.logPrefix} failed to update Packrat unit to match EDAN (id:${systemObject.idSystemObject} | subject:${subject.Name})`, LOG.LS.eAUDIT);
                                str += 'EDAN subject. failed to automatic update. check logs or do manually';
                            } else {
                                LOG.info(`${this.config.logPrefix} successfully updated Packrat unit to match EDAN (id:${systemObject.idSystemObject} | subject:${subject.Name})`, LOG.LS.eAUDIT);
                                str += 'EDAN subject. updated Packrat unit to match EDAN';
                            }
                        } else {
                            str += 'EDAN subject. automatic updating disabled. rerun or manual fix required';
                        }
                    }

                    // store for output
                    output.push(str);
                } else {
                    LOG.info(`${this.config.logPrefix} Unit compare succeeded! (id:${systemObject.idSystemObject} | subject:${subject.Name})`, LOG.LS.eAUDIT);
                    let str = outputPrefix;
                    str += 'success,';
                    str += 'units,';
                    str += ',';
                    str += '"' + packratUnit.Abbreviation + ' - ' + packratUnit.Name + '",';
                    str += '"' + edanUnit.Abbreviation + ' - ' + edanUnit.Name + '",';
                    output.push(str);
                }
            } else if(packratUnit && !edanUnit) {
                LOG.error(`${this.config.logPrefix} Packrat unit not found in EDAN record (id:${systemObject.idSystemObject} | subject:${subject.Name} | packrat:${JSON.stringify(packratUnit)})`, LOG.LS.eAUDIT);
                let str = outputPrefix;
                str += 'error,';
                str += 'units,';
                str += 'Packrat unit not found in EDAN,';
                str += '"' + packratUnit.Abbreviation + ' - ' + packratUnit.Name + '",';
                str += 'null,';
                str += ((isDPOSubject)?'DPO created subject. needs manual fix to apply to EDAN.':'EDAN subject. needs manual fix because EDAN should have unit assigned. (todo)')+',';
                output.push(str);
            } else if(!packratUnit && edanUnit) {
                LOG.error(`${this.config.logPrefix} EDAN unit not found in Packrat (id:${systemObject.idSystemObject} | subject:${subject.Name} | EDAN:${edanUnit.Name})`, LOG.LS.eAUDIT);
                let str = outputPrefix;
                str += 'error,';
                str += 'units,';
                str += 'EDAN unit not found in Packrat,';
                str += 'null,';
                str += '"' + edanUnit.Abbreviation + ' - ' + edanUnit.Name +'",';

                // apply edan unit to packrat unit (creating new unit in process)
                if(isDPOSubject) {
                    str += 'DPO subject. needs manual fix as Packrat should have unit';
                } else {
                    if(this.config.fixErrors) {
                        const replaceUnitResult: boolean = await this.replacePackratUnit(packratUnit,edanUnit);
                        if(!replaceUnitResult) {
                            LOG.error(`${this.config.logPrefix} failed to update Packrat unit to match EDAN (id:${systemObject.idSystemObject} | subject:${subject.Name})`, LOG.LS.eAUDIT);
                            str += 'EDAN subject. failed to automatic update. check logs or do manually';
                        } else {
                            LOG.info(`${this.config.logPrefix} successfully updated Packrat unit to match EDAN (id:${systemObject.idSystemObject} | subject:${subject.Name})`, LOG.LS.eAUDIT);
                            str += 'EDAN subject. updated Packrat unit to match EDAN';
                        }
                    } else {
                        str += 'EDAN subject. automatic updating disabled. rerun or manual fix required';
                    }
                }

                // store for output
                output.push(str);

            } else {
                LOG.error(`${this.config.logPrefix} Packrat & EDAN units not found (id:${systemObject.idSystemObject} | subject:${subject.Name})`, LOG.LS.eAUDIT);
                let str = outputPrefix;
                str += 'error,';
                str += 'units,';
                str += 'Packrat and EDAN units not,';
                str += 'null,';
                str += 'null,';
                str += 'needs manual fix as neither source has a unit,';
                output.push(str);
            }

            // Compare: Identifiers
            if(packratIdentifiers && edanIdentifiers) {
                let idMismatch: boolean = false;

                // figure out how many identifiers edan has
                const edanIdCount = edanIdentifiers.details.length;

                // build our list of identifiers
                // TODO: clean strings for CSV output
                const strPackratIds: string[] = (packratIdentifiers.details)?(packratIdentifiers.details?.map(id=>{ return id.identifier?.IdentifierValue+' ('+id.identifierType?.Term+')'; })):([]);
                const strEdanIds: string[] = [];
                for(const id of edanIdentifiers.details) {
                    strEdanIds.push(id.identifier?.IdentifierValue+' ('+id.identifierType?.Term+')');
                }

                // see if we have the same count for a quick catch of difference, otherwise do deeper compare
                if(packratIdentifiers.details?.length != edanIdCount) {
                    idMismatch = true;
                } else {
                    // cycle through all edan identifiers and look for match in packrat
                    let didFindId = false;
                    for(const id of edanIdentifiers.details) {
                        for(const packratId of packratIdentifiers.details) {
                            if(packratId.identifierTypeEnum===id.identifierTypeEnum &&
                                packratId.identifier?.IdentifierValue===id.identifier?.IdentifierValue) {
                                didFindId = true;
                                break;
                            }
                        }
                    }
                    if(!didFindId) idMismatch = true;
                }

                // if we have a mismatch then output
                if(idMismatch) {
                    // log error and details
                    LOG.error(`${this.config.logPrefix} Packrat has different identifiers than EDAN (id:${systemObject.idSystemObject} | subject:${subject.Name})`, LOG.LS.eAUDIT);
                    LOG.error(`${this.config.logPrefix} \tPackrat: `+strPackratIds.sort().join(','), LOG.LS.eAUDIT);
                    LOG.error(`${this.config.logPrefix} \t   EDAN: `+strEdanIds, LOG.LS.eAUDIT);

                    // if we're an EDAN subject then we need to fix the situation
                    if(!isDPOSubject) {
                        // TODO: wipe out Packrat identifiers and replace with EDAN modifiers
                        const replaceIdsResult: boolean = await this.replacePackratIdentifiers(packratIdentifiers,edanIdentifiers,systemObject);
                        if(!replaceIdsResult)
                            LOG.error(`${this.config.logPrefix} could not replace Packrat identifiers. function not finished.`, LOG.LS.eAUDIT);
                    }

                    // build our output string
                    let str = outputPrefix;
                    str += 'error,';
                    str += 'identifiers,';
                    str += 'Packrat identifiers do not match EDAN,';
                    str += '"'+strPackratIds.sort().join('\n')+'",';
                    str += '"'+strEdanIds.sort().join('\n')+'",';

                    // apply edan unit to packrat unit (creating new unit in process)
                    if(isDPOSubject) {
                        str += 'DPO subject. needs manual fix';
                    } else {
                        if(this.config.fixErrors) {
                            const replaceUnitResult: boolean = await this.replacePackratIdentifiers(packratIdentifiers,edanIdentifiers,systemObject);
                            if(!replaceUnitResult) {
                                LOG.error(`${this.config.logPrefix} failed to update Packrat identifiers to match EDAN (id:${systemObject.idSystemObject} | subject:${subject.Name})`, LOG.LS.eAUDIT);
                                str += 'EDAN subject. failed to automatic update. check logs or do manually';
                            } else {
                                LOG.info(`${this.config.logPrefix} successfully updated Packrat identifiers to match EDAN (id:${systemObject.idSystemObject} | subject:${subject.Name})`, LOG.LS.eAUDIT);
                                str += 'EDAN subject. updated Packrat identifiers to match EDAN';
                            }
                        } else {
                            str += 'EDAN subject. automatic updating disabled. rerun or manual fix required';
                        }
                    }

                    // store for output
                    output.push(str);

                } else {
                    LOG.info(`${this.config.logPrefix} Identifier compare succeeded! (id:${systemObject.idSystemObject} | subject:${subject.Name})`, LOG.LS.eAUDIT);
                    let str = outputPrefix;
                    str += 'success,';
                    str += 'identifiers,';
                    str += ',';
                    str += '"'+strPackratIds.sort().join('\n')+'",';
                    str += '"'+strEdanIds.sort().join('\n')+'",';
                    str += ',';
                    output.push(str);
                }
            } else if(packratIdentifiers && !edanIdentifiers) {
                // TODO
            } else if(!packratIdentifiers && edanIdentifiers) {
                // TODO
            }
        }

        // HACK: dumping to local file until moved into Workflow reports.
        // if(this.config.writeToFile !== undefined) {
        //     require('fs').writeFile(this.config.writeToFile,output.join('\n'), err=>{
        //         if(err) {
        //             LOG.error(`${this.config.logPrefix}: ${err}`, LOG.LS.eAUDIT);
        //         }
        //     });
        // }

        // set our state
        LOG.info(`${this.constructor.name} completed successfully`,LOG.LS.eAUDIT);
        await this.setStatus(COMMON.eWorkflowJobRunStatus.eDone);

        // figure out our desired name
        const now: string = new Date().toISOString().split('T')[0];
        const name: string  = `${this.constructor.name}_Results_${now}`;

        // make sure we have a report to modify
        const report: DBAPI.WorkflowReport | null | undefined = await this.workflow?.getReport();
        if(!report)
            return { success: false, error: `${this.constructor.name} cannot get report.`, data: { idWorkflow: this.workflow?.getWorkflowID() } };

        // prepare our data and update the report itself in the DB
        report.MimeType = 'text/csv';
        report.Data = output.join('\n');
        report.Name = name;
        report.update();

        // return the data in case needed by other routines downstream
        return { success: true, data: { content: report.Data } };
    }
}