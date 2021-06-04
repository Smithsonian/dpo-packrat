import * as L from 'lodash';
import { QueryGetAssetVersionsDetailsArgs, GetAssetVersionsDetailsResult,
    Item, IngestPhotogrammetry, IngestModel, IngestScene, SubjectUnitIdentifier } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import { AssetStorageAdapter } from '../../../../../storage/interface';
import { AssetVersion, Project } from '../../../../../db';
import { IngestMetadata, BulkIngestReader } from '../../../../../utils/parser';
import * as LOG from '../../../../../utils/logger';

export default async function getAssetVersionsDetails(_: Parent, args: QueryGetAssetVersionsDetailsArgs, _context: Context): Promise<GetAssetVersionsDetailsResult> {
    let firstSubject: SubjectUnitIdentifier | null = null;
    let firstItem: Item | null = null;
    const { idAssetVersions } = args.input;

    const results: GetAssetVersionsDetailsResult = { valid: true, Details: [] };
    for (const idAssetVersion of idAssetVersions) {
        const assetVersion: AssetVersion | null = await AssetVersion.fetch(idAssetVersion);
        if (!assetVersion) {
            LOG.error(`GraphQL getAssetVersionsDetails called with invalid idAssetVersion ${idAssetVersion}`, LOG.LS.eGQL);
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
            idSubject,
            SubjectName,
            UnitAbbreviation,
            IdentifierPublic,
            IdentifierCollection
        };

        const Item: Item = { ...ingestMetadata };
        let CaptureDataPhoto: IngestPhotogrammetry | null = null;
        let Model: IngestModel | null = null;
        let Scene: IngestScene | null = null;

        if (BulkIngestReader.ingestedObjectIsPhotogrammetry(ingestMetadata))
            CaptureDataPhoto = { ...ingestMetadata };
        else if (BulkIngestReader.ingestedObjectIsModel(ingestMetadata))
            Model = { ...ingestMetadata };
        else if (BulkIngestReader.ingestedObjectIsScene(ingestMetadata))
            Scene = { ...ingestMetadata };

        if (!firstSubject)
            firstSubject = SubjectUnitIdentifier;
        else if (!L.isEqual(firstSubject, SubjectUnitIdentifier))
            results.valid = false;

        if (!firstItem)
            firstItem = Item;
        else if (!L.isEqual(firstItem, Item))
            results.valid = false;

        results.Details.push({ idAssetVersion, Project, SubjectUnitIdentifier, Item, CaptureDataPhoto, Model, Scene });
    }

    return results;
}
