/**
 * PublicRoute
 * Renders a route based on authentication and restriction specified
 */
import React, { useContext } from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { Routes } from '../../../constants';
import { AppContext } from '../../../context';

interface PublicRouteProps {
    restricted?: boolean;
    component: React.ComponentType<unknown>;
}

function PublicRoute({ component: Component, restricted = false, ...rest }: PublicRouteProps & RouteProps): React.ReactElement {
    const { user } = useContext(AppContext);

    const render = props => (
        !!user && restricted ? <Redirect to={Routes.DASHBOARD} /> : <Component {...props} />
    );

    return <Route {...rest} render={render} />;
}

export default PublicRoute;