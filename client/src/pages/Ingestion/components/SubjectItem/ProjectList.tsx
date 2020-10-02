import React from 'react';
import { Select, MenuItem } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useProject } from '../../../../store';
import lodash from 'lodash';

const useStyles = makeStyles(({ palette }) => ({
    projectSelect: {
        width: '100%',
        padding: '0px 10px',
        backgroundColor: palette.background.paper
    }
}));

function ProjectList(): React.ReactElement {
    const classes = useStyles();
    const { projects, getSelectedProject, updateSelectedProject } = useProject();

    const hasProjects = !projects.length;
    const selectedProject = getSelectedProject();

    const uniqueSortedProjects = lodash.uniqBy(lodash.orderBy(projects, 'name', 'asc'), 'name');

    return (
        <Select
            value={selectedProject?.id || 'none'}
            disabled={hasProjects}
            className={classes.projectSelect}
            renderValue={() => `${selectedProject?.name || 'none'}`}
            onChange={({ target: { value } }) => updateSelectedProject(value as number)}
            disableUnderline
        >
            <MenuItem value='none'>none</MenuItem>
            {uniqueSortedProjects.map(({ id, name }, index: number) => <MenuItem key={index} value={id}>{name}</MenuItem>)}
        </Select>
    );
}

export default ProjectList;