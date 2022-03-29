import { GetIngestTitleResult, QueryGetIngestTitleArgs, IngestTitle } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import { NameHelpers, ModelHierarchy } from '../../../../../utils/nameHelpers';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';

export default async function getIngestTitle(_: Parent, args: QueryGetIngestTitleArgs, _context: Context): Promise<GetIngestTitleResult> {
    const { item, sourceObjects } = args.input;
    if (item) {
        let itemDB: DBAPI.Item | null = null;
        if (item.id) {
            itemDB = await DBAPI.Item.fetch(item.id);
            if (!itemDB)
                LOG.error(`getIngestTitle unable to load Item from ${item.id}`, LOG.LS.eGQL);
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
