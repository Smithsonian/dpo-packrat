/**
 * PublicRoute
 *
 * Renders a route based on authentication and restriction specified.
 */
import React from 'react';
import { Navigate, Route, RouteProps } from 'react-router-dom';
import { HOME_ROUTES } from '../../constants';
import { useUserStore } from '../../store';

interface PublicRouteProps extends RouteProps {
    restricted?: boolean;
    component: React.ComponentType<unknown>;
}

function PublicRoute({ component: Component, restricted = false, ...rest }: PublicRouteProps): React.ReactElement {
    const user = useUserStore(state => state.user);

    const render = () => (
        !!user && restricted ? <Navigate to={HOME_ROUTES.DASHBOARD} /> : <Component />
    );

    const element = render();

    return <Route {...rest} element={element} />;
}

export default PublicRoute;