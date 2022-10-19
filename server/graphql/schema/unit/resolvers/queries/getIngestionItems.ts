import { QueryGetIngestionItemsArgs, GetIngestionItemsResult, IngestionItem } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';
import * as H from '../../../../../utils/helpers';

export default async function getIngestionItems(_: Parent, args: QueryGetIngestionItemsArgs): Promise<GetIngestionItemsResult> {
    const { input } = args;
    const { idSubjects } = input;

    const items: DBAPI.Item[] | null = await DBAPI.Item.fetchDerivedFromSubjects(idSubjects);
    if (!items) {
        LOG.error(`getIngestionItems unable to fetch items from ${H.Helpers.JSONStringify(idSubjects)}`, LOG.LS.eGQL);
        return { };
    }

    const idItems: number[] = [];
    for (const item of items)
        idItems.push(item.idItem);

    const ItemAndProjects: DBAPI.ItemAndProject[] | null = await DBAPI.Item.fetchRelatedItemsAndProjects(idItems);
    if (!ItemAndProjects) {
        LOG.info(`getIngestionItems unable to fetch projects related to items ${H.Helpers.JSONStringify(idItems)}`, LOG.LS.eGQL);
        return { };
    }

    const IngestionItem: IngestionItem[] = [];
    for (const itemAndProject of ItemAndProjects) {
        if (!itemAndProject.idItem || !itemAndProject.idProject)
            continue;
        IngestionItem.push({
            idItem: itemAndProject.idItem,
            EntireSubject: itemAndProject.EntireSubject ?? true,
            MediaGroupName: itemAndProject.Name ?? '',
            idProject: itemAndProject.idProject,
            ProjectName: itemAndProject.ProjectName ?? 'Unknown',
        });
    }

    return { IngestionItem };
}
