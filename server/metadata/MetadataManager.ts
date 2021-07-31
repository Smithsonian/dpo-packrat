import { MetadataExtractor } from './MetadataExtractor';
import * as DBAPI from '../db';
import * as H from '../utils/helpers';
import * as LOG from '../utils/logger';

export class MetadataManager {
    static async persistExtractor(idSystemObject: number, extractor: MetadataExtractor, idUser: number | null): Promise<H.IOResults> {
        const metadataCount: number = extractor.metadata.size;
        if (metadataCount === 0)
            return { success: true, error: '' };

        LOG.info(`MetadataManager.persistExtractor(${idSystemObject}) persisting ${metadataCount} key/value pairs`, LOG.LS.eMETA);
        const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
        if (!SO) {
            const error: string = `MetadataManager.persistExtractor failed fetching idSystemObject ${idSystemObject}`;
            LOG.error(error, LOG.LS.eMETA);
            return { success: false, error };
        }

        const idVMetadataSource: number | null = await extractor.idVMetadataSource() ?? null;

        for (const [key, value] of extractor.metadata) {
            const len: number = value.length;
            const metadataDB: DBAPI.Metadata = new DBAPI.Metadata({
                Name: key,
                ValueShort: len < 256 ? value : null,
                ValueExtended: len >= 256 ? value : null,
                idAssetValue: null,
                idUser,
                idVMetadataSource,
                idSystemObject: SO.idSystemObject,
                idMetadata: 0
            });

            if (!await metadataDB.create()) {
                const error: string = `MetadataManager.persistExtractor failed creating metadata ${JSON.stringify(metadataDB, H.Helpers.saferStringify)}`;
                LOG.error(error, LOG.LS.eMETA);
                return { success: false, error };
            }

            // TODO: update Solr metadata core
        }

        return { success: true, error: '' };
    }
}
