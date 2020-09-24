import React, { useState } from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import RepositoryFilterView from './components/RepositoryFilterView';
import RepositoryTreeView from './components/RepositoryTreeView';
import RepositoryTreeHeader from './components/RepositoryTreeView/RepositoryTreeHeader';

const useStyles = makeStyles(({ breakpoints }) => ({
    container: {
        display: 'flex',
        flex: 1,
        maxWidth: '70vw',
        flexDirection: 'column',
        padding: 40,
        [breakpoints.down('lg')]: {
            padding: 20,
            maxWidth: '100vw'
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

    const onChange = (name: string, value: string | boolean) => {
        setFilter(filter => ({ ...filter, [name]: value }));
    };

    return (
        <Box className={classes.container}>
            <RepositoryFilterView filter={filter} onChange={onChange} />
            <RepositoryTreeHeader />
            <RepositoryTreeView filter={filter} />
        </Box>
    );
}

export default Repository;