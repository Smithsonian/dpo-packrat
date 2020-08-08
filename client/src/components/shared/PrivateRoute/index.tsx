/**
 * PrivateRoute
 * Renders a route only if the user is authenticated else redirects to login
 */
import React, { useContext } from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { AppContext } from '../../../context';

interface PrivateRouteProps {
    component?: React.ComponentType<unknown>;
    children?: unknown;
}

function PrivateRoute({ component: Component, children, ...rest }: PrivateRouteProps & RouteProps): React.ReactElement {
    const { user } = useContext(AppContext);

    const render = props => {

        if (!user) {
            return <Redirect to={ROUTES.LOGIN} />;
        } else {
            if (Component) {
                return <Component {...props} />;
            } else {
                return children;
            }
        }
    };

    return <Route {...rest} render={render} />;
}

export default PrivateRoute;