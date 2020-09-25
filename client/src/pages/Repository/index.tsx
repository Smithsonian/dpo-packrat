import React, { useState } from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import RepositoryFilterView from './components/RepositoryFilterView';
import RepositoryTreeView from './components/RepositoryTreeView';
import useDebounce from './hooks/useDebounce';

const useStyles = makeStyles(({ breakpoints }) => ({
    container: {
        display: 'flex',
        flex: 1,
        maxWidth: '100vw',
        flexDirection: 'column',
        padding: 40,
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
    const initialFilterState = {
        units: true,
        projects: false,
    };

    const [filter, setFilter] = useState<RepositoryFilter>(initialFilterState);
    const debouncedFilter = useDebounce<RepositoryFilter>(filter, 200);

    const onChange = (name: string, value: string | boolean) => {
        setFilter(filter => {
            return {
                ...filter,
                [name]: value,
                ...(name === 'units' && { projects: false }),
                ...(name === 'projects' && { units: false }),
            };
        });
    };

    return (
        <Box className={classes.container}>
            <RepositoryFilterView filter={filter} onChange={onChange} />
            <RepositoryTreeView filter={debouncedFilter} />
        </Box>
    );
}

export default Repository;