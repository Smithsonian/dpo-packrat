import { MetadataExtractor } from './MetadataExtractor';
import * as DBAPI from '../db';
import * as NAV from '../navigation/interface';
import * as H from '../utils/helpers';
import { RecordKeeper as RK } from '../records/recordKeeper';

export class MetadataManager {
    static async persistExtractor(idSystemObject: number, idSystemObjectParent: number, extractor: MetadataExtractor, idUser: number | null): Promise<H.IOResults> {
        const metadataCount: number = extractor.metadata.size;
        if (metadataCount === 0)
            return { success: true };

        RK.logInfo(RK.LogSection.eMETA,'persist extractor',`persisting ${metadataCount} key/value pairs`,{ idSystemObject, idSystemObjectParent, metadataCount },'Metadata.Manager');

        /* istanbul ignore next */
        const idVMetadataSource: number | null = await extractor.idVMetadataSource() ?? null;
        const metadataList: DBAPI.Metadata[] = [];

        for (const [key, value] of extractor.metadata) {
            const len: number = value.length;
            const metadataDB: DBAPI.Metadata = new DBAPI.Metadata({
                Name: key,
                ValueShort: len < 256 ? value : null,
                ValueExtended: len >= 256 ? value : null,
                idAssetVersionValue: null,
                idUser,
                idVMetadataSource,
                idSystemObject,
                idSystemObjectParent,
                idMetadata: 0
            });
            metadataList.push(metadataDB);
        }

        if (!await DBAPI.Metadata.createMany(metadataList)) {
            const error: string = `MetadataManager.persistExtractor failed creating metadata ${JSON.stringify(metadataList, H.Helpers.saferStringify)}`;
            RK.logError(RK.LogSection.eMETA,'persist extractor failed','failed creating metadata',{ metadataList },'Metadata.Manager');
            return { success: false, error };
        }
        // LOG.info(`MetadataManager.persistExtractor(${idSystemObject}, ${idSystemObjectParent}) wrote ${metadataCount} DB Records`, LOG.LS.eMETA);

        // update Solr metadata core
        const navigation: NAV.INavigation | null = await NAV.NavigationFactory.getInstance();
        const indexer: NAV.IIndexer | null = navigation ? await navigation.getIndexer() : /* istanbul ignore next */ null; /* istanbul ignore else */
        if (indexer) {
            const success: boolean = await indexer.indexMetadata(metadataList);
            // LOG.info(`MetadataManager.persistExtractor(${idSystemObject}, ${idSystemObjectParent}) indexed ${metadataCount} Solr Records`, LOG.LS.eMETA);
            return { success, error: success ? '' : /* istanbul ignore next */ 'IIndexer.indexMetadata failed' };
        } else {
            const error: string = 'MetadataManager.persistExtractor unable to fetch navigation indexer';
            RK.logError(RK.LogSection.eMETA,'persist extractor failed','unable to fetch navigation indexer',{ metadataList },'Metadata.Manager');
            return { success: false, error };
        }
    }
}
