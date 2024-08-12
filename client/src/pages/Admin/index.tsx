/**
 * Admin
 *
 * This component renders Admin UI and all the sub-components
 * The structure is as follows:
 *
 * Admin
 * - AdminSidebarMenu
 * - AdminUserForm
 * - AdminUsersView
 * -- AdminUsersFilter
 * -- AdminUsersList
 * - AdminProjectsView
 * -- AdminProjectsFilter
 * -- AdminProjectsList
 * - AdminUnitsView
 * -- AdminUnitsFilter
 * -- AdminUnitsList
 * - AddProjectForm
 * - AddUnitForm
 *
 */
import React from 'react';
import AdminUsersView from './components/AdminUsersView';
import AdminUserForm from './components/AdminUserForm';
import AdminProjectsView from './components/AdminProjectsView';
import AdminUnitsView from './components/AdminUnitsView';
import AdminToolsView from './components/AdminToolsView';
import AddUnitForm from './components/AddUnitForm';
import AddProjectForm from './components/AddProjectForm';
import LicenseView from './components/License/LicenseView';
import LicenseForm from './components/License/LicenseForm';
import SubjectForm from './components/Subject/SubjectForm';
import SubjectView from './components/Subject/SubjectView';
import { Route, Routes } from 'react-router';
import { Navigate } from 'react-router';
import { ADMIN_EDIT, ADMIN_ROUTE, resolveRoute, resolveSubRoute } from '../../constants';

function Admin(): React.ReactElement {
    return (
        <Routes>
            <Route path={resolveRoute(ADMIN_EDIT.USER)} element={<AdminUserForm />} />
            <Route path={resolveRoute(ADMIN_ROUTE.ROUTES.USERS)} element={<AdminUsersView />} />
            <Route path={resolveRoute(ADMIN_EDIT.LICENSE)} element={<LicenseForm />} />
            <Route path={resolveRoute(ADMIN_ROUTE.ROUTES.LICENSES)} element={<LicenseView />} />
            <Route path={resolveRoute(ADMIN_ROUTE.ROUTES.CREATEPROJECT)} element={<AddProjectForm />} />
            <Route path={resolveRoute(ADMIN_ROUTE.ROUTES.PROJECTS)} element={<AdminProjectsView />} />
            <Route path={resolveRoute(ADMIN_ROUTE.ROUTES.CREATEUNIT)} element={<AddUnitForm />} />
            <Route path={resolveRoute(ADMIN_ROUTE.ROUTES.UNITS)} element={<AdminUnitsView />} />
            <Route path={resolveRoute(ADMIN_ROUTE.ROUTES.CREATESUBJECT)} element={<SubjectForm />} />
            <Route path={resolveRoute(ADMIN_ROUTE.ROUTES.SUBJECTS)} element={<SubjectView />} />
            <Route path={resolveRoute(ADMIN_ROUTE.ROUTES.TOOLS)} element={<AdminToolsView />} />
            <Route path='/' element={<Navigate to={resolveSubRoute(ADMIN_ROUTE.TYPE, ADMIN_ROUTE.ROUTES.LICENSES)} />} />
        </Routes>
    );
}

export default Admin;
