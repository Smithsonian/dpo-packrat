import { QueryGetIngestionItemsArgs, GetIngestionItemsResult, IngestionItem } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { Authorization } from '../../../../../auth/Authorization';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';
// import * as H from '../../../../../utils/helpers';

export default async function getIngestionItems(_: Parent, args: QueryGetIngestionItemsArgs): Promise<GetIngestionItemsResult> {
    const { input } = args;
    const { idSubjects } = input;

    const items: DBAPI.Item[] | null = await DBAPI.Item.fetchDerivedFromSubjects(idSubjects);
    if (!items) {
        RK.logError(RK.LogSection.eGQL,'get ingestion items failed','unable to fetch items from scene',{ idSubjects },'GraphQL.Unit.IngestionItems');
        return { };
    }

    const idItems: number[] = [];
    for (const item of items)
        idItems.push(item.idItem);

    if (idItems.length === 0)
        return { IngestionItem: [] };

    const ItemAndProjects: DBAPI.ItemAndProject[] | null = await DBAPI.Item.fetchRelatedItemsAndProjects(idItems);
    if (!ItemAndProjects) {
        RK.logError(RK.LogSection.eGQL,'get ingestion items failed','unable to fetch projects related to items',{ idItems },'GraphQL.Unit.IngestionItems');
        return { };
    }

    // Filter by accessible projects (authorized units' projects + assigned restricted projects)
    const ctx = Authorization.getContext();
    const projectSet = (ctx && !ctx.isAdmin && ctx.effectiveProjectIds) ? new Set(ctx.effectiveProjectIds) : null;

    const IngestionItem: IngestionItem[] = [];
    let totalCount = 0;
    for (const itemAndProject of ItemAndProjects) {
        if (!itemAndProject.idItem || !itemAndProject.idProject)
            continue;
        totalCount++;
        if (projectSet && !projectSet.has(itemAndProject.idProject))
            continue;
        IngestionItem.push({
            idItem: itemAndProject.idItem,
            EntireSubject: itemAndProject.EntireSubject ?? true,
            MediaGroupName: itemAndProject.Name ?? '',
            idProject: itemAndProject.idProject,
            ProjectName: itemAndProject.ProjectName ?? 'Unknown',
        });
    }

    if (projectSet)
        Authorization.logFilteredResults('getIngestionItems', totalCount, IngestionItem.length);

    return { IngestionItem };
}
