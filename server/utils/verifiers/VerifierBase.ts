import * as COL from '../../collections/interface';
import * as LOG from '../logger';
import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as COMMON from '@dpo-packrat/common';
// import * as H from '../helpers';

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

    constructor() {}

    protected async getIdentifierType(identifier: DBAPI.Identifier): Promise<IdentifierDetails | null> {

        // grab the identifier type object from the Packrat DB
        // TODO: use Vocabulary.CACHE to reduce DB hits
        const identifierType: DBAPI.Vocabulary | null = await DBAPI.Vocabulary.fetch(identifier.idVIdentifierType);
        if(!identifierType){
            LOG.error(`could not find identifier type in DB (identifier: ${identifier.idVIdentifierType} )`, LOG.LS.eSYS);
            return null;
        }

        // pull from enumeration from the CACHE (vocabulary id -> enum)
        const identifierTypeEnum: COMMON.eVocabularyID | undefined = await CACHE.VocabularyCache.vocabularyIdToEnum(identifier.idVIdentifierType);
        if(identifierTypeEnum===undefined){
            LOG.error(`could not find enumerator for identifier type (${identifier.idVIdentifierType}) in Cache`, LOG.LS.eSYS);
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
                LOG.error(`subject's preferredId not found in the DB (id: ${subject.idSubject} | subject: ${subject.Name})`, LOG.LS.eSYS);
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
            LOG.error(`could not get identifiers from subject (id: ${subject.idSubject} | subject: ${subject.Name})`, LOG.LS.eSYS);
            return null;
        }
        if(identifiers.length<=0){
            LOG.info(`(WARNING) no identifiers assigned to subject (id: ${subject.idSubject} | subject: ${subject.Name})`, LOG.LS.eSYS);
            return result;
        }

        // cycle through all identifiers, find EDAN/ARK, and push to list
        for(const identifier of identifiers) {

            // get our details for this identifier, skip if error, store if valid
            const details: IdentifierDetails | null = await this.getIdentifierType(identifier);
            if(!details) {
                LOG.error(`could not get identifier details from subject (identifier: ${identifier.IdentifierValue} | id: ${subject.idSubject} | subject: ${subject.Name})`, LOG.LS.eSYS);
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
            LOG.error(`Packrat DB did not return a unit for subject. (id: ${subject.idSubject} | subject: ${subject.Name})`, LOG.LS.eSYS);
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

        LOG.error(`did not find EDAN unit in the UnitEdan DB. investigate adding it... (${edanUnit}) `, LOG.LS.eSYS);
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
                        LOG.error(`could not get details for EDAN identifier (type: ${identifier.idVIdentifierType} | value:${identifier.IdentifierValue})`, LOG.LS.eSYS);
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
                        LOG.error(`could not get details for ARK identifier (type: ${identifier.idVIdentifierType} | value:${identifier.IdentifierValue})`, LOG.LS.eSYS);
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
                    LOG.error(`\tencountered unknown identifier type ${label} for EDAN record ${record.name}`, LOG.LS.eSYS);
                    continue;
                }

                // pull enumeration from the CACHE (vocabulary id -> enum)
                const identifierTypeEnum: COMMON.eVocabularyID | undefined = await CACHE.VocabularyCache.vocabularyIdToEnum(identifierType.idVocabulary);
                if(identifierTypeEnum===undefined){
                    LOG.error(`\tcould not find enumerator for identifier type (${identifierType.Term}) in Cache`, LOG.LS.eSYS);
                    continue;
                }

                // if identifier exists in our database (value & type) then store it
                const identifiers: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromIdentifierValue(content);
                if(identifiers) {
                    for(const identifier of identifiers) {
                        const details: IdentifierDetails | null = await this.getIdentifierType(identifier);
                        if(!details) {
                            LOG.error(`could not get details for EDAN identifier (type: ${identifier.idVIdentifierType} | value:${identifier.IdentifierValue})`, LOG.LS.eSYS);
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
