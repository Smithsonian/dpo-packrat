import React, { useContext } from 'react';
import { Select, MenuItem } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { AppContext } from '../../../../context';
import useProject from '../../hooks/useProject';

const useStyles = makeStyles(({ palette }) => ({
    projectSelect: {
        width: '100%',
        padding: '0px 10px',
        backgroundColor: palette.background.paper
    }
}));

function ProjectList(): React.ReactElement {
    const classes = useStyles();
    const { ingestion: { projects } } = useContext(AppContext);
    const { getSelectedProject, updateSelectedProject } = useProject();

    const hasProjects = !projects.length;
    const selectedProject = getSelectedProject();

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
            {projects.map(({ id, name }, index) => <MenuItem key={index} value={id}>{name}</MenuItem>)}
        </Select>
    );
}

export default ProjectList;