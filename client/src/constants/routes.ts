export enum ROUTES {
    HOME = '/',
    LOGIN = '/login',
    ABOUT = '/about'
}

export enum HOME_ROUTES {
    DASHBOARD = 'dashboard',
    REPOSITORY = 'repository',
    INGESTION = 'ingestion',
    WORKFLOW = 'workflow',
    REPORTING = 'reporting',
    ADMIN = 'admin'
}

export const HOME_ROUTE = {
    TYPE: '/:type',
    ROUTES: HOME_ROUTES
};

export enum INGESTION_ROUTES_TYPE {
    FILES = 'files',
    SUBJECT_ITEM = 'subject_item',
    METADATA = 'metadata'
}

export const INGESTION_ROUTE = {
    TYPE: 'ingestion/:step',
    ROUTES: INGESTION_ROUTES_TYPE
};

export function resolveRoute(route: string): string {
    return `/${route}`;
}

export function resolveSubRoute(parentRoute: string, route: string): string {
    return `/${parentRoute}/${route}`;
}
