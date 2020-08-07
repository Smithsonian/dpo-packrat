import React, { useContext } from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { resolveSubRoute, INGESTION_ROUTE, HOME_ROUTES } from '../../../../constants';
import { SidebarBottomNavigator } from '../../../../components';
import { useLocation, Redirect, useHistory } from 'react-router';
import { AppContext } from '../../../../context';
import lodash from 'lodash';
import * as qs from 'query-string';

const useStyles = makeStyles(() => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column'
    },
    content: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
}));

function Metadata(): React.ReactElement {
    const classes = useStyles();
    const { search } = useLocation();
    const { ingestion } = useContext(AppContext);
    const { metadatas } = ingestion;
    const history = useHistory();

    const metadataLength = metadatas.length;
    const query = qs.parse(search);

    if (!metadataLength || !query.fileId) {
        return <Redirect to={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.UPLOADS)} />;
    }

    const metadataStep = metadatas.find(({ file }) => file.id === query.fileId);
    const metadataStepIndex = lodash.indexOf(metadatas, metadataStep);
    const isLast = (metadataStepIndex + 1) === metadataLength;

    const onPrevious = () => {
        history.goBack();
    };

    const onNext = () => {
        if (isLast) {
            alert('Finished');
        } else {
            const { file: { id, type } } = metadatas[metadataStepIndex + 1];
            const nextRoute = resolveSubRoute(HOME_ROUTES.INGESTION, `${INGESTION_ROUTE.ROUTES.METADATA}?fileId=${id}&type=${type}`);

            history.push(nextRoute);
        }
    };

    return (
        <Box className={classes.container}>
            <Box className={classes.content}>
                <Typography variant='subtitle1'>Metadata</Typography>
                <Typography variant='caption'>Name: {metadataStep?.file.name}</Typography>
                <Typography variant='caption'>Size: {metadataStep?.file.size}</Typography>
                <Typography variant='caption'>Type: {metadataStep?.file.type}</Typography>
            </Box>
            <SidebarBottomNavigator
                leftLabel='Previous'
                onClickLeft={onPrevious}
                rightLabel={isLast ? 'Finish' : 'Next'}
                onClickRight={onNext}
            />
        </Box>
    );
}

export default Metadata;