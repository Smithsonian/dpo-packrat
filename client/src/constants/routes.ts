export enum Routes {
    HOME = '/:type',
    LOGIN = '/login',
    ABOUT = '/about',
    DASHBOARD = '/dashboard'
}

export enum DASHBOARD_TYPES {
    DASHBOARD = 'dashboard',
    REPOSITORY = 'repository',
    INGESTION = 'ingestion',
    WORKFLOW = 'workflow',
    REPORTING = 'reporting',
    ADMIN = 'admin'
}

export function resolveRoute(route: Routes | DASHBOARD_TYPES): string {
    return `/${route}`;
}
