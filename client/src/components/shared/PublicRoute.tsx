/**
 * PublicRoute
 *
 * Renders a route based on authentication and restriction specified.
 */
import React from 'react';
import { Redirect, Route, RouteProps } from 'react-router-dom';
import { HOME_ROUTES } from '../../constants';
import { useUserStore } from '../../store';

interface PublicRouteProps extends RouteProps {
    restricted?: boolean;
    component: React.ComponentType<unknown>;
}

function PublicRoute({ component: Component, restricted = false, ...rest }: PublicRouteProps): React.ReactElement {
    const user = useUserStore(state => state.user);

    const render = props => (
        !!user && restricted ? <Redirect to={HOME_ROUTES.DASHBOARD} /> : <Component {...props} />
    );

    return <Route {...rest} render={render} />;
}

export default PublicRoute;