import { GetObjectChildrenResult, QueryGetObjectChildrenArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import { NavigationFactory, INavigation, NavigationFilter, NavigationResult } from '../../../../../navigation/interface';
import { Authorization } from '../../../../../auth/Authorization';
import * as H from '../../../../../utils/helpers';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';

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
        rows,
        cursorMark
    } = args.input;
    const navigation: INavigation | null = await NavigationFactory.getInstance();

    if (!navigation) {
        const error: string = 'Cannot get navigation instance';
        RK.logError(RK.LogSection.eGQL,'get object children failed',error,{ ...args.input },'GraphQL.Repository.Children');

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
        dateCreatedFrom: H.Helpers.safeDate(dateCreatedFrom),   // convert ISO representation to Date
        dateCreatedTo: H.Helpers.safeDate(dateCreatedTo),       // convert ISO representation to Date
        rows,
        cursorMark
    };

    // Enforce authorization on the filter
    const ctx = Authorization.getContext();

    if (ctx && !ctx.isAdmin) {
        // Restrict projects to authorized set (use != to also catch undefined from stale sessions)
        if (ctx.effectiveProjectSOIds != null) {
            if (filter.projects?.length) {
                const totalProjects = filter.projects.length;
                const authorized = new Set(ctx.effectiveProjectSOIds);
                filter.projects = filter.projects.filter(p => authorized.has(p));
                Authorization.logFilteredResults('getObjectChildren.projects', totalProjects, filter.projects.length);
            } else {
                filter.projects = ctx.effectiveProjectSOIds;
            }
        }

        // Restrict units to effective set (use != to also catch undefined from stale sessions)
        if (ctx.effectiveUnitSOIds != null) {
            if (filter.units?.length) {
                const totalUnits = filter.units.length;
                const authorized = new Set(ctx.effectiveUnitSOIds);
                filter.units = filter.units.filter(u => authorized.has(u));
                Authorization.logFilteredResults('getObjectChildren.units', totalUnits, filter.units.length);
            } else {
                filter.units = ctx.effectiveUnitSOIds;
            }
        }
    }

    const result: NavigationResult = await navigation.getObjectChildren(filter);
    return result;
}
