/**
 * PrivateRoute
 *
 * Renders a route only if the user is authenticated else redirects to login.
 */
import React from 'react';
import { Navigate, Route, RouteProps } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { useUserStore } from '../../store';

interface PrivateRouteProps extends RouteProps {
    component?: React.ComponentType<unknown>;
    children?: React.ReactNode;
}

function PrivateRoute({ component: Component, children, ...rest }: PrivateRouteProps): React.ReactElement {
    const user = useUserStore(state => state.user);
    const originalURL: string = encodeURI(window.location.pathname + window.location.search);

    const render = () => {
        if (!user) {
            // console.log(`*** window.location=${window.location}, ou=${originalURL}`);
            if (originalURL !== '/')
                return <Navigate to={`${ROUTES.LOGIN}?ou=${originalURL}`} />;
            else
                return <Navigate to={ROUTES.LOGIN} />;
        } else {
            if (Component) {
                return <Component />;
            } else {
                return children;
            }
        }
    };

    const element = render();

    return <Route {...rest} element={element} />;
}

export default PrivateRoute;