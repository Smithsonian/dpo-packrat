/**
 * Routes
 *
 * This file exports all the route, types associated with
 * routing.
 */
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
    UPLOADS = 'uploads',
    SUBJECT_MEDIA_GROUP = 'subject_media_group',
    METADATA = 'metadata'
}

export enum INGESTION_PARAMS_TYPE {
    STEP = 'step'
}

export const INGESTION_ROUTE = {
    TYPE: 'ingestion/:step',
    PARAMS: INGESTION_PARAMS_TYPE,
    ROUTES: INGESTION_ROUTES_TYPE
};

export enum REPOSITORY_ROUTES_TYPE {
    VIEW = '',
    DETAILS = 'details/:idSystemObject',
    VOYAGER = 'voyager/:idSystemObject'
}

export const REPOSITORY_ROUTE = {
    TYPE: 'repository',
    ROUTES: REPOSITORY_ROUTES_TYPE
};

export const WORKFLOW_ROUTE = {
    TYPE: 'workflow'
};

export const ADMIN_EDIT = {
    USER: 'users/:idUser',
    LICENSE: 'licenses/:idLicense'
};

export const ADMIN_ROUTES_TYPE = {
    USERS: 'users',
    EDIT: ADMIN_EDIT,
    PROJECTS: 'projects',
    UNITS: 'units',
    CREATEPROJECT: 'projects/create',
    CREATEUNIT: 'units/create',
    LICENSES: 'licenses',
    SUBJECTS: 'subjects',
    CREATESUBJECT: 'subjects/create',
    TOOLS: 'tools',
};

export const ADMIN_ROUTE = {
    TYPE: 'admin',
    ROUTES: ADMIN_ROUTES_TYPE
};

export function resolveRoute(route: string): string {
    return `/${route}`;
}

export function resolveSubRoute(parentRoute: string, route: string): string {
    return `/${parentRoute}/${route}`;
}
