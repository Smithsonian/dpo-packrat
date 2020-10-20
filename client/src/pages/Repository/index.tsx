import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router';
import { useControlStore } from '../../store';
import { generateRepositoryUrl, parseRepositoryUrl } from '../../utils/repository';
import RepositoryFilterView from './components/RepositoryFilterView';
import RepositoryTreeView from './components/RepositoryTreeView';

const useStyles = makeStyles(({ breakpoints }) => ({
    container: {
        display: 'flex',
        flex: 1,
        maxWidth: (sideBarExpanded: boolean) => sideBarExpanded ? '85vw' : '93vw',
        flexDirection: 'column',
        padding: 20,
        paddingBottom: 0,
        paddingRight: 0,
        [breakpoints.down('lg')]: {
            paddingRight: 20,
            maxWidth: (sideBarExpanded: boolean) => sideBarExpanded ? '85vw' : '92vw',
        }
    }
}));

export type RepositoryFilter = {
    units: boolean;
    projects: boolean;
};

function Repository(): React.ReactElement {
    const sideBarExpanded = useControlStore(state => state.sideBarExpanded);
    const classes = useStyles(sideBarExpanded);
    const history = useHistory();
    const { search } = useLocation();

    const queries = parseRepositoryUrl(search);

    const initialFilterState: RepositoryFilter = {
        units: true,
        projects: false
    };

    const defaultFilterState = Object.keys(queries).length ? queries : initialFilterState;

    const [filter] = useState<RepositoryFilter>(defaultFilterState);

    useEffect(() => {
        const route = generateRepositoryUrl(filter);
        history.push(route);
    }, [filter, history]);

    return (
        <Box className={classes.container}>
            <RepositoryFilterView />
            <RepositoryTreeView />
        </Box>
    );
}

export default Repository;