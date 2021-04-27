import { GetObjectChildrenResult, QueryGetObjectChildrenArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import { NavigationFactory, INavigation, NavigationFilter, NavigationResult } from '../../../../../navigation/interface';
import * as LOG from '../../../../../utils/logger';

export default async function getObjectChildren(_: Parent, args: QueryGetObjectChildrenArgs): Promise<GetObjectChildrenResult> {
    const {
        idRoot,
        objectTypes,
        metadataColumns,
        search,
        objectsToDisplay,
        units,
        projects,
        has,
        missing,
        captureMethod,
        variantType,
        modelPurpose,
        modelFileType,
        dateCreatedFrom,
        dateCreatedTo,
    } = args.input;
    const navigation: INavigation | null = await NavigationFactory.getInstance();

    if (!navigation) {
        const error: string = 'Cannot get navigation instance';
        LOG.error('getObjectChilgren', LOG.LS.eGQL, error);

        return {
            success: false,
            error,
            entries: [],
            metadataColumns
        };
    }

    const filter: NavigationFilter = {
        idRoot,
        objectTypes,
        metadataColumns,
        search,
        objectsToDisplay,
        units,
        projects,
        has,
        missing,
        captureMethod,
        variantType,
        modelPurpose,
        modelFileType,
        dateCreatedFrom,
        dateCreatedTo,
        rows: 1000,
        cursorMark: ''
    };

    const result: NavigationResult = await navigation.getObjectChildren(filter);
    return result;
}
