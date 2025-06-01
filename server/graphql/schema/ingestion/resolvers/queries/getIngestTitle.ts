import { GetIngestTitleResult, QueryGetIngestTitleArgs, IngestTitle } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import { NameHelpers, ModelHierarchy } from '../../../../../utils/nameHelpers';
import * as DBAPI from '../../../../../db';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';

export default async function getIngestTitle(_: Parent, args: QueryGetIngestTitleArgs, _context: Context): Promise<GetIngestTitleResult> {

    // The ingest title is tied to the MediaGroup's (item) name and is pulled from EDAN
    // when first ingesting. Here we build our title and sanitize it as needed.

    const { item, sourceObjects } = args.input;
    if (item) {
        let itemDB: DBAPI.Item | null = null;
        if (item.id) {
            itemDB = await DBAPI.Item.fetch(item.id);
            if (!itemDB)
                RK.logError(RK.LogSection.eRPT,'get ingest title failed',`unable to load Item from ${item.id}`,{ args },'GraphQL.Schema.Ingestion');

        }

        if (!itemDB) {
            itemDB = new DBAPI.Item({
                idItem: 0,
                idAssetThumbnail: null,
                idGeoLocation: null,
                Name: item.name + ((item.subtitle) ? `: ${item.subtitle}` : ''),
                EntireSubject: item.entireSubject,
                Title: item.subtitle,
            });
        }
        const ingestTitle: IngestTitle = NameHelpers.modelTitleOptions(itemDB);
        return { ingestTitle };
    }

    if (sourceObjects) {
        const MHs: ModelHierarchy[] | null = await NameHelpers.computeModelHierarchiesFromSourceObjects(sourceObjects);
        if (!MHs)
            return { };
        const ingestTitle: IngestTitle = NameHelpers.sceneTitleOptions(MHs);
        return { ingestTitle };
    }

    return { };
}
