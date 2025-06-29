/* eslint-disable camelcase */
import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as COL from '../../collections/interface/';
import * as H from '../../utils/helpers';
import * as COMMON from '@dpo-packrat/common';
import { RecordKeeper as RK } from '../../records/recordKeeper';

/** This class is used to create and update EDANMDM records, translating Packrat Subject data and metadata into the EdanMDMContent format required for EDANMDM records
 * TODO: pass data contextual data into response routine
*/
export class PublishSubject {
    private idSystemObject: number;
    private subject?: DBAPI.Subject | null;
    private metadataMap: Map<string, DBAPI.Metadata[]> = new Map<string, DBAPI.Metadata[]>();
    private edanMDM: COL.EdanMDMContent = {
        descriptiveNonRepeating: {
            title: { label: '', content: '' },
            data_source: '',
            record_ID: '',
            unit_code: '',
            metadata_usage: { },
        },
        indexedStructured: { },
        freetext: { },
    };

    public edanRecord: COL.EdanRecord | null = null;

    constructor(idSystemObject: number) {
        this.idSystemObject = idSystemObject;
    }

    async publish(ICol: COL.ICollection): Promise<H.IOResults> {
        let res: H.IOResults = await this.analyze();
        if (!res.success)
            return res;

        res = await this.transform();
        if (!res.success)
            return res;

        this.edanRecord = await ICol.createEdanMDM(this.edanMDM, 0, true);
        if (!this.edanRecord) {
            RK.logError(RK.LogSection.eCOLL,'publish failed','cannot create EDAN MDM record',{ edanMDM: this.edanMDM },'Publish.Subject');
            return this.returnResults(false, 'Edan publishing failed');
        }

        // update SystemObjectVersion.PublishedState
        res = await this.updatePublishedState(COMMON.ePublishedState.ePublished);
        if (!res.success)
            return res;
        return this.returnResults(true);
    }

    private async analyze(): Promise<H.IOResults> {
        const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(this.idSystemObject);
        if (!oID)
            return this.returnResults(false, `unable to retrieve object details from ${this.idSystemObject}`);

        if (oID.eObjectType !== COMMON.eSystemObjectType.eSubject)
            return this.returnResults(false, `called for non subject object ${JSON.stringify(oID, H.Helpers.saferStringify)}`);

        // fetch subject
        this.subject = oID.idObject ? await DBAPI.Subject.fetch(oID.idObject) : null;
        if (!this.subject)
            return this.returnResults(false, `could not compute subject from ${JSON.stringify(oID, H.Helpers.saferStringify)}`);

        // fetch subject metadata
        const metadataSet: DBAPI.Metadata[] | null = await DBAPI.Metadata.fetchFromSystemObject(this.idSystemObject);
        if (!metadataSet)
            return this.returnResults(false, `could not compute subject metadata from ${JSON.stringify(oID, H.Helpers.saferStringify)}`);
        for (const metadata of metadataSet) {
            const nameNormalized: string = metadata.Name.toLowerCase();
            let metadataList: DBAPI.Metadata[] | undefined = this.metadataMap.get(nameNormalized);
            if (!metadataList) {
                metadataList = [];
                this.metadataMap.set(nameNormalized, metadataList);
            }
            metadataList.push(metadata);
        }
        // LOG.info(`PublishSubject.analyze() metadataMap: ${JSON.stringify(this.metadataMap, H.Helpers.saferStringify)}`, LOG.LS.eCOLL);
        return this.returnResults(true);
    }

    private async transform(): Promise<H.IOResults> {
        for (const [metadataName, metadataList] of this.metadataMap) {
            if (metadataList.length === 0)
                continue;
            const values: string[] = [];
            for (const metadata of metadataList)
                values.push(metadata.ValueShort ?? metadata.ValueExtended ?? '');

            let nonRepeating: boolean = false;
            switch (metadataName) {
                case 'label':                       this.edanMDM.descriptiveNonRepeating.title.label            = values[0];    nonRepeating = true; break;
                case 'title':                       this.edanMDM.descriptiveNonRepeating.title.content          = values[0];    nonRepeating = true; break;
                case 'record id':                   this.edanMDM.descriptiveNonRepeating.record_ID              = values[0];    nonRepeating = true; break;
                case 'unit':                        await this.handleUnit(values[0]);                                           nonRepeating = true; break;
                case 'license':                     await this.handleLicense(values[0]);                                        nonRepeating = true; break;
                case 'license text':                this.edanMDM.descriptiveNonRepeating.metadata_usage!.content = values[0];   nonRepeating = true; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion

                case 'object type':                 this.edanMDM.indexedStructured!.object_type                 = values; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                case 'date':                        this.edanMDM.indexedStructured!.date                        = values; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                case 'place':                       this.edanMDM.indexedStructured!.place                       = values; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                case 'topic':                       this.edanMDM.indexedStructured!.topic                       = values; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion

                case 'identifier (ft)':             this.edanMDM.freetext!.identifier           = PublishSubject.transformIntoLabelContent(values); break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                case 'data source (ft)':            this.edanMDM.freetext!.dataSource           = PublishSubject.transformIntoLabelContent(values); break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                case 'date (ft)':                   this.edanMDM.freetext!.date                 = PublishSubject.transformIntoLabelContent(values); break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                case 'name (ft)':                   this.edanMDM.freetext!.name                 = PublishSubject.transformIntoLabelContent(values); break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                case 'object rights (ft)':          this.edanMDM.freetext!.objectRights         = PublishSubject.transformIntoLabelContent(values); break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                case 'place (ft)':                  this.edanMDM.freetext!.place                = PublishSubject.transformIntoLabelContent(values); break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                case 'taxonomic name (ft)':         this.edanMDM.freetext!.taxonomicName        = PublishSubject.transformIntoLabelContent(values); break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                case 'notes (ft)':                  this.edanMDM.freetext!.notes                = PublishSubject.transformIntoLabelContent(values); break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                case 'physical description (ft)':   this.edanMDM.freetext!.physicalDescription  = PublishSubject.transformIntoLabelContent(values); break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
            }

            if (nonRepeating && values.length > 1)
                RK.logError(RK.LogSection.eCOLL,'publish failed','encountered non-repeating element wih multiple value',{ metadataName, metadataList },'Publish.Subject');
        }

        if (!this.edanMDM.descriptiveNonRepeating.title.label)
            return this.returnResults(false, 'descriptiveNonRepeating.title.label missing');
        if (!this.edanMDM.descriptiveNonRepeating.title.content)
            return this.returnResults(false, 'descriptiveNonRepeating.title.content missing');
        if (!this.edanMDM.descriptiveNonRepeating.record_ID)
            return this.returnResults(false, 'descriptiveNonRepeating.record_ID missing');
        if (!this.edanMDM.descriptiveNonRepeating.data_source)
            return this.returnResults(false, 'descriptiveNonRepeating.data_source missing');
        if (!this.edanMDM.descriptiveNonRepeating.unit_code)
            return this.returnResults(false, 'descriptiveNonRepeating.unit_code missing');
        if (!this.edanMDM.descriptiveNonRepeating.metadata_usage)
            return this.returnResults(false, 'descriptiveNonRepeating.metadata_usage missing');
        if (!this.edanMDM.descriptiveNonRepeating.metadata_usage.access)
            return this.returnResults(false, 'descriptiveNonRepeating.metadata_usage.access missing');
        return this.returnResults(true);
    }

    private returnResults(success: boolean, message?: string): H.IOResults {
        if (!success)
            RK.logError(RK.LogSection.eCOLL,'publish failed',message,{ edanMDM: this.edanMDM },'Publish.Subject');
        return { success, error: message ?? '' };
    }

    private async handleUnit(unitMetadata: string): Promise<H.IOResults> {
        // first search by unit name or abbreviation
        let unitDB: DBAPI.UnitEdan | null = null;
        const unitDBs: DBAPI.UnitEdan[] | null = await DBAPI.UnitEdan.fetchFromName(unitMetadata);
        if (unitDBs != null && unitDBs.length > 0)
            unitDB = unitDBs[0];
        if (!unitDB)
            return this.returnResults(false, 'Unable to compute Unit');

        this.edanMDM.descriptiveNonRepeating.data_source = unitDB.Name ?? '';
        this.edanMDM.descriptiveNonRepeating.unit_code = unitDB.Abbreviation ?? '';
        return this.returnResults(true);
    }

    private async handleLicense(licenseText: string): Promise<H.IOResults> {
        const access: string = (licenseText.toLowerCase() === 'cc0, publishable w/ downloads') ? 'CC0' : 'Usage conditions apply';
        this.edanMDM.descriptiveNonRepeating.metadata_usage!.access = access; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        return this.returnResults(true);
    }

    private static transformIntoLabelContent(metadataList: string[]): COL.EdanLabelContent[] {
        const retValue: COL.EdanLabelContent[] = [];
        for (const metadata of metadataList) {
            retValue.push(COL.parseEdanMetadata(metadata));
        }
        return retValue;
    }

    private async updatePublishedState(ePublishedStateIntended: COMMON.ePublishedState): Promise<H.IOResults> {
        let systemObjectVersion: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.fetchLatestFromSystemObject(this.idSystemObject);
        if (systemObjectVersion) {
            if (systemObjectVersion.publishedStateEnum() !== ePublishedStateIntended) {
                systemObjectVersion.setPublishedState(ePublishedStateIntended);
                if (!await systemObjectVersion.update()) {
                    const error: string = `PublishSubject.updatePublishedState unable to update published state for ${JSON.stringify(systemObjectVersion, H.Helpers.saferStringify)}`;
                    RK.logError(RK.LogSection.eCOLL,'update publish state failed','unable to update published state',{ systemObjectVersion },'Publish.Subject');
                    return { success: false, error };
                }
            }

            return { success: true };
        }

        systemObjectVersion = new DBAPI.SystemObjectVersion({
            idSystemObject: this.idSystemObject,
            PublishedState: ePublishedStateIntended,
            DateCreated: new Date(),
            Comment: 'Created by Packrat',
            idSystemObjectVersion: 0
        });

        if (!await systemObjectVersion.create()) {
            const error: string = `PublishSubject.updatePublishedState could not create SystemObjectVersion for idSystemObject ${this.idSystemObject}`;
            RK.logError(RK.LogSection.eCOLL,'update publish state failed','could not create SystemObjectVersion for idSystemObject',{ idSystemObjects: this.idSystemObject },'Publish.Subject');
            return { success: false, error };
        }

        return { success: true };
    }
}