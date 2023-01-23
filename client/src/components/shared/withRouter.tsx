/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

// React Router v6 removed withRouter but offers the wrapper code. See https://reactrouter.com/en/v6.3.0/faq
import React from 'react';
import {
    useLocation,
    useNavigate,
    useParams,
} from 'react-router-dom';

function withRouter(Component: any) {
    function ComponentWithRouterProp(props) {
        const location = useLocation();
        const navigate = useNavigate();
        const params = useParams();
        return (
            <Component
                {...props}
                router={{ location, navigate, params }}
            />
        );
    }
    return ComponentWithRouterProp;
}

export default withRouter;