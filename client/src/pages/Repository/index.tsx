import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router';
import { generateRepositoryUrl, parseRepositoryUrl } from '../../utils/repository';
import RepositoryFilterView from './components/RepositoryFilterView';
import RepositoryTreeView from './components/RepositoryTreeView';

const useStyles = makeStyles(({ breakpoints }) => ({
    container: {
        display: 'flex',
        flex: 1,
        maxWidth: '100vw',
        flexDirection: 'column',
        padding: 40,
        paddingBottom: 0,
        [breakpoints.down('lg')]: {
            padding: 20,
        }
    }
}));

export type RepositoryFilter = {
    units: boolean;
    projects: boolean;
};

function Repository(): React.ReactElement {
    const classes = useStyles();
    const history = useHistory();
    const { search } = useLocation();

    const queries = parseRepositoryUrl(search);

    const initialFilterState: RepositoryFilter = {
        units: true,
        projects: false
    };

    const defaultFilterState = Object.keys(queries).length ? queries : initialFilterState;

    const [filter, setFilter] = useState<RepositoryFilter>(defaultFilterState);

    useEffect(() => {
        const route = generateRepositoryUrl(filter);
        history.push(route);
    }, [filter, history]);

    const onChange = (name: string, value: string | boolean) => {
        setFilter(filter => ({
            ...filter,
            [name]: value,
            ...(name === 'units' && { projects: false }),
            ...(name === 'projects' && { units: false }),
        }));
    };

    return (
        <Box className={classes.container}>
            <RepositoryFilterView filter={filter} onChange={onChange} />
            <RepositoryTreeView filter={filter} />
        </Box>
    );
}

export default Repository;