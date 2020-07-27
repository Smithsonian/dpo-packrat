/**
 * PrivateRoute
 * Renders a route only if the user is authenticated else redirects to login
 */
import React, { useContext } from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { AppContext } from '../../../context';

interface PrivateRouteProps {
    component: React.ComponentType<unknown>
}

function PrivateRoute({ component: Component, ...rest }: PrivateRouteProps & RouteProps): React.ReactElement {
    const { user } = useContext(AppContext);

    const render = props => (
        user ? <Component {...props} /> : <Redirect to={ROUTES.LOGIN} />
    );

    return <Route {...rest} render={render} />;
}

export default PrivateRoute;