import * as L from 'lodash';
import { QueryGetAssetVersionsDetailsArgs, GetAssetVersionsDetailsResult,
    Item, IngestPhotogrammetry, IngestModel, SubjectUnitIdentifier } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import { AssetStorageAdapter } from '../../../../../storage/interface';
import { AssetVersion, Project } from '../../../../../db';
import { IngestMetadata, BulkIngestReader } from '../../../../../utils/parser';
import * as LOG from '../../../../../utils/logger';

export default async function getAssetVersionsDetails(_: Parent, args: QueryGetAssetVersionsDetailsArgs, context: Context): Promise<GetAssetVersionsDetailsResult> {
    const { user } = context;
    if (!user) {
        LOG.logger.error('GraphQL getAssetVersionsDetails called with invalid user');
        return { valid: false, Details: [] };
    }

    let firstSubject: SubjectUnitIdentifier | null = null;
    let firstItem: Item | null = null;
    const { idAssetVersions } = args.input;

    const results: GetAssetVersionsDetailsResult = { valid: true, Details: [] };
    for (const idAssetVersion of idAssetVersions) {
        const assetVersion: AssetVersion | null = await AssetVersion.fetch(idAssetVersion);
        if (!assetVersion) {
            LOG.logger.error(`GraphQL getAssetVersionsDetails called with invalid idAssetVersion ${idAssetVersion}`);
            return { valid: false, Details: [] };
        }

        const ingestMetadata: IngestMetadata | null = await AssetStorageAdapter.extractBulkIngestMetadata(assetVersion);
        if (!ingestMetadata) {
            results.Details.push({ idAssetVersion });
            continue;
        }

        const Project: Project[] | null = await BulkIngestReader.computeProjects(ingestMetadata);

        const { idSubject, SubjectName, UnitAbbreviation, IdentifierPublic, IdentifierCollection } = ingestMetadata;
        const SubjectUnitIdentifier: SubjectUnitIdentifier = {
            __typename: 'SubjectUnitIdentifier',
            idSubject,
            SubjectName,
            UnitAbbreviation,
            IdentifierPublic,
            IdentifierCollection
        };

        const Item: Item = { ...ingestMetadata };
        let CaptureDataPhoto: IngestPhotogrammetry | null = null;
        let Model: IngestModel | null = null;

        if (BulkIngestReader.ingestedObjectIsPhotogrammetry(ingestMetadata))
            CaptureDataPhoto = { ...ingestMetadata };
        else if (BulkIngestReader.ingestedObjectIsModel(ingestMetadata))
            Model = { ...ingestMetadata };

        if (!firstSubject)
            firstSubject = SubjectUnitIdentifier;
        else if (!L.isEqual(firstSubject, SubjectUnitIdentifier))
            results.valid = false;

        if (!firstItem)
            firstItem = Item;
        else if (!L.isEqual(firstItem, Item))
            results.valid = false;

        results.Details.push({ idAssetVersion, Project, SubjectUnitIdentifier, Item, Model, CaptureDataPhoto });
    }

    return results;
}
