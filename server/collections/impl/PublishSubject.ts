/* eslint-disable camelcase */
import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as COL from '../../collections/interface/';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';

/** This class is used to create and update EDANMDM records, translating Packrat Subject data and metadata into the EdanMDMContent format required for EDANMDM records */
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
        freeText: { },
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
        if (this.edanRecord)
            LOG.info(`PublishSubject.publish ${this.edanRecord.url} succeeded with Edan status ${this.edanRecord.status}, publicSearch ${this.edanRecord.publicSearch}`, LOG.LS.eCOLL); // : ${JSON.stringify(this.edanMDM, H.Helpers.saferStringify)}`, LOG.LS.eCOLL);
        else
            LOG.error(`PublishSubject.publish ${JSON.stringify(this.edanMDM, H.Helpers.saferStringify)} failed`, LOG.LS.eCOLL);

        return PublishSubject.returnResults(this.edanRecord !== null, this.edanRecord !== null ? undefined : 'Edan publishing failed');
    }

    private async analyze(): Promise<H.IOResults> {
        const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(this.idSystemObject);
        if (!oID)
            return PublishSubject.returnResults(false, `unable to retrieve object details from ${this.idSystemObject}`);

        if (oID.eObjectType !== DBAPI.eSystemObjectType.eSubject)
            return PublishSubject.returnResults(false, `called for non subject object ${JSON.stringify(oID, H.Helpers.saferStringify)}`);

        // fetch subject
        this.subject = oID.idObject ? await DBAPI.Subject.fetch(oID.idObject) : null;
        if (!this.subject)
            return PublishSubject.returnResults(false, `could not compute subject from ${JSON.stringify(oID, H.Helpers.saferStringify)}`);

        // fetch subject metadata
        const metadataSet: DBAPI.Metadata[] | null = await DBAPI.Metadata.fetchFromSystemObject(this.idSystemObject);
        if (!metadataSet)
            return PublishSubject.returnResults(false, `could not compute subject metadata from ${JSON.stringify(oID, H.Helpers.saferStringify)}`);
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
        return PublishSubject.returnResults(true);
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
                case 'access':                      this.edanMDM.descriptiveNonRepeating.metadata_usage!.access = values[0];    nonRepeating = true; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                case 'license text':                this.edanMDM.descriptiveNonRepeating.metadata_usage!.text   = values[0];    nonRepeating = true; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion

                case 'object type':                 this.edanMDM.indexedStructured!.object_type                 = values; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                case 'date':                        this.edanMDM.indexedStructured!.date                        = values; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                case 'place':                       this.edanMDM.indexedStructured!.place                       = values; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                case 'topic':                       this.edanMDM.indexedStructured!.topic                       = values; break; // eslint-disable-line @typescript-eslint/no-non-null-assertion

                case 'identifier (ft)':             this.edanMDM.freeText!.identifier           = PublishSubject.transformIntoLabelContent(values); break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                case 'data source (ft)':            this.edanMDM.freeText!.dataSource           = PublishSubject.transformIntoLabelContent(values); break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                case 'date (ft)':                   this.edanMDM.freeText!.date                 = PublishSubject.transformIntoLabelContent(values); break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                case 'name (ft)':                   this.edanMDM.freeText!.name                 = PublishSubject.transformIntoLabelContent(values); break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                case 'object rights (ft)':          this.edanMDM.freeText!.objectRights         = PublishSubject.transformIntoLabelContent(values); break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                case 'place (ft)':                  this.edanMDM.freeText!.place                = PublishSubject.transformIntoLabelContent(values); break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                case 'taxonomic name (ft)':         this.edanMDM.freeText!.taxonomicName        = PublishSubject.transformIntoLabelContent(values); break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                case 'notes (ft)':                  this.edanMDM.freeText!.notes                = PublishSubject.transformIntoLabelContent(values); break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                case 'physical description (ft)':   this.edanMDM.freeText!.physicalDescription  = PublishSubject.transformIntoLabelContent(values); break; // eslint-disable-line @typescript-eslint/no-non-null-assertion
            }

            if (nonRepeating && values.length > 1)
                LOG.error(`PublishSubject.transform encountered non-repeating element ${metadataName} with multiple value ${JSON.stringify(metadataList)}`, LOG.LS.eCOLL);
        }

        if (!this.edanMDM.descriptiveNonRepeating.title.label)
            return PublishSubject.returnResults(false, 'descriptiveNonRepeating.title.label missing');
        if (!this.edanMDM.descriptiveNonRepeating.title.content)
            return PublishSubject.returnResults(false, 'descriptiveNonRepeating.title.content missing');
        if (!this.edanMDM.descriptiveNonRepeating.record_ID)
            return PublishSubject.returnResults(false, 'descriptiveNonRepeating.record_ID missing');
        if (!this.edanMDM.descriptiveNonRepeating.data_source)
            return PublishSubject.returnResults(false, 'descriptiveNonRepeating.data_source missing');
        if (!this.edanMDM.descriptiveNonRepeating.unit_code)
            return PublishSubject.returnResults(false, 'descriptiveNonRepeating.unit_code missing');
        if (!this.edanMDM.descriptiveNonRepeating.metadata_usage)
            return PublishSubject.returnResults(false, 'descriptiveNonRepeating.metadata_usage missing');
        if (!this.edanMDM.descriptiveNonRepeating.metadata_usage.access)
            return PublishSubject.returnResults(false, 'descriptiveNonRepeating.metadata_usage.access missing');
        return PublishSubject.returnResults(true);
    }

    private static returnResults(success: boolean, message?: string): H.IOResults {
        if (!success)
            LOG.error(`PublishSubject.fetchSubject ${message}`, LOG.LS.eCOLL);
        return { success, error: message ?? '' };
    }

    private async handleUnit(unitMetadata: string): Promise<H.IOResults> {
        // first search by unit name or abbreviation
        let unitDB: DBAPI.Unit | null = null;
        const unitDBs: DBAPI.Unit[] | null = await DBAPI.Unit.fetchFromNameSearch(unitMetadata);
        if (unitDBs != null && unitDBs.length > 0)
            unitDB = unitDBs[0];
        else {
            // next, treat input as a numeric ID
            const idUnit: number = parseInt(unitMetadata);
            if (!isNaN(idUnit))
                unitDB = await DBAPI.Unit.fetch(idUnit);
        }

        if (!unitDB)
            return PublishSubject.returnResults(false, 'Unable to compute Unit');

        this.edanMDM.descriptiveNonRepeating.data_source = unitDB.Name;
        this.edanMDM.descriptiveNonRepeating.unit_code = unitDB.Abbreviation ?? '';
        return PublishSubject.returnResults(true);
    }

    private static transformIntoLabelContent(metadataList: string[]): COL.EdanLabelContent[] {
        const retValue: COL.EdanLabelContent[] = [];
        for (const metadata of metadataList) {
            retValue.push(COL.parseEdanMetadata(metadata));
        }
        return retValue;
    }
}