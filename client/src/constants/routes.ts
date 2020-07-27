export enum ROUTES {
    HOME = '/:type',
    LOGIN = '/login',
    ABOUT = '/about',
    DASHBOARD = '/dashboard'
}

export enum DASHBOARD_ROUTES {
    DASHBOARD = 'dashboard',
    REPOSITORY = 'repository/:step',
    INGESTION = 'ingestion',
    WORKFLOW = 'workflow',
    REPORTING = 'reporting',
    ADMIN = 'admin'
}

export enum INGESTION_ROUTES {
    FILES = 'files',
    SUBJECT_ITEM = 'subject_item',
    METADATA = 'metadata'
}

export function resolveRoute(route: ROUTES | DASHBOARD_ROUTES): string {
    return `/${route}`;
}
