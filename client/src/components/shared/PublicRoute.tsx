/**
 * PublicRoute
 * Renders a route based on authentication and restriction specified
 */
import React from 'react';
import { Redirect, Route, RouteProps } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { useUserStore } from '../../store';

interface PublicRouteProps {
    restricted?: boolean;
    component: React.ComponentType<unknown>;
}

function PublicRoute({ component: Component, restricted = false, ...rest }: PublicRouteProps & RouteProps): React.ReactElement {
    const user = useUserStore(state => state.user);

    const render = props => (
        !!user && restricted ? <Redirect to={ROUTES.HOME} /> : <Component {...props} />
    );

    return <Route {...rest} render={render} />;
}

export default PublicRoute;