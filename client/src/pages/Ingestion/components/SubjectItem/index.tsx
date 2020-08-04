import React, { useContext } from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { HOME_ROUTES, resolveSubRoute, INGESTION_ROUTE } from '../../../../constants';
import { SidebarBottomNavigator } from '../../../../components';
import { useHistory, Redirect } from 'react-router';
import { AppContext } from '../../../../context';

const useStyles = makeStyles(() => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column'
    },
    content: {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
}));

function SubjectItem(): React.ReactElement {
    const classes = useStyles();
    const history = useHistory();
    const { ingestion: { metadata } } = useContext(AppContext);

    const onNext = () => {
        const { file: { id, type } } = metadata[0];
        const nextRoute = resolveSubRoute(HOME_ROUTES.INGESTION, `${INGESTION_ROUTE.ROUTES.METADATA}?fileId=${id}&type=${type}`);

        history.push(nextRoute);
    };

    const metadataLength = metadata.length;

    if (!metadataLength) {
        return <Redirect to={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.UPLOADS)} />;
    }

    return (
        <Box className={classes.container}>
            <Box className={classes.content}>
                <Typography variant='subtitle1'>Subject and Item</Typography>
            </Box>
            <SidebarBottomNavigator
                leftLabel='Previous'
                leftRoute={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.UPLOADS)}
                rightLabel='Next'
                onClickRight={onNext}
            />
        </Box>
    );
}

export default SubjectItem;