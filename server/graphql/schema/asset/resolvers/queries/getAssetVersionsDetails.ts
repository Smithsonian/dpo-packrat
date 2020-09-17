import { QueryGetAssetVersionsDetailsArgs, GetAssetVersionsDetailsResult,
    Item as ItemQL, Model as ModelQL, IngestPhotogrammetry } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import { BulkIngestReader } from '../../../../../utils/parser';
// import * as LOG from '../../../../../utils/logger';
import * as H from '../../../../../utils/helpers';

export default async function getAssetVersionsDetails(_: Parent, args: QueryGetAssetVersionsDetailsArgs, context: Context): Promise<GetAssetVersionsDetailsResult> {
    const { user } = context;
    if (!user)
        return { valid: false, SubjectUnitIdentifier: [], Project: [], Item: [], CaptureDataPhoto: [], Model: [] };

    const { idAssetVersions } = args.input;
    let bulkIngestFound: boolean = false; // either everything is not a bulk ingest, or there's exactly 1 bulk ingest
    let results: GetAssetVersionsDetailsResult = { valid: true, SubjectUnitIdentifier: [], Project: [], Item: [], CaptureDataPhoto: [], Model: [] };
    for (const idAssetVersion of idAssetVersions) {
        const bulkReader: BulkIngestReader = new BulkIngestReader();
        const loadResults: H.IOResults = await bulkReader.loadFromAssetVersion(idAssetVersion, true);
        if (loadResults.success) {
            if (bulkIngestFound)
                return { valid: false, SubjectUnitIdentifier: [], Project: [], Item: [], CaptureDataPhoto: [], Model: [] };
            else
                bulkIngestFound = true;

            const itemList: ItemQL[] = [];
            const capturePhotoList: IngestPhotogrammetry[] = [];
            const modelList: ModelQL[] = [];
            for (const item of bulkReader.items)
                itemList.push({ idItem: item.idItem, EntireSubject: item.EntireSubject, Name: item.Name });
            for (const CDP of bulkReader.captureDataPhoto)
                capturePhotoList.push(CDP);
            for (const model of bulkReader.models)
                modelList.push(model);

            results = { valid: true, SubjectUnitIdentifier: bulkReader.subjects, Project: bulkReader.projects, Item: itemList, CaptureDataPhoto: capturePhotoList, Model: modelList };
            bulkReader.captureDataPhoto;
            bulkReader.models;
        }
    }

    return results;
}
