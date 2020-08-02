import { Box, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { memo, useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useParams } from 'react-router';
import { HOME_ROUTES } from '../../../constants';
import { Colors } from '../../../theme';
import { colorWithOpacity } from '../../../theme/colors';
import SidePanelOption, { SidePanelOptionProps } from './SidePanelOption';

const useStyles = makeStyles(({ palette, spacing }) => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: palette.primary.dark,
    },
    menuOptions: {
        display: 'flex',
        flex: 1
    },
    bottomOptions: {
        display: 'flex',
        justifyContent: 'flex-end',
        padding: spacing(2)
    },
    anchor: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: 10,
        borderRadius: 10,
        transition: 'all 250ms linear',
        '&:hover': {
            cursor: 'pointer',
            backgroundColor: colorWithOpacity(palette.primary.light, 33)
        }
    }
}));

interface SidePanelProps {
    isExpanded: boolean;
    onToggle: () => void;
}

function SidePanel(props: SidePanelProps): React.ReactElement {
    const { isExpanded, onToggle } = props;
    const { type } = useParams();

    const [selectedOption, setSelectedOption] = useState(type || HOME_ROUTES.INGESTION);

    useEffect(() => {
        setSelectedOption(type);
    }, [type]);

    const classes = useStyles();

    const Options: SidePanelOptionProps[] = [
        {
            title: 'Dashboard',
            type: HOME_ROUTES.DASHBOARD,
            color: Colors.sidebarOptions.dashboard,
            isExpanded,
            isSelected: selectedOption === HOME_ROUTES.DASHBOARD
        },
        {
            title: 'Repository',
            subtitle: '314k assets',
            type: HOME_ROUTES.REPOSITORY,
            color: Colors.sidebarOptions.repository,
            isExpanded,
            isSelected: selectedOption === HOME_ROUTES.REPOSITORY
        },
        {
            title: 'Ingestion',
            subtitle: '12 assets today',
            type: HOME_ROUTES.INGESTION,
            color: Colors.sidebarOptions.ingestion,
            isExpanded,
            isSelected: selectedOption === HOME_ROUTES.INGESTION
        },
        {
            title: 'Workflow',
            subtitle: '6 open tasks',
            type: HOME_ROUTES.WORKFLOW,
            color: Colors.sidebarOptions.workflow,
            isExpanded,
            isSelected: selectedOption === HOME_ROUTES.WORKFLOW
        },
        {
            title: 'Reporting',
            type: HOME_ROUTES.REPORTING,
            color: Colors.sidebarOptions.reporting,
            isExpanded,
            isSelected: selectedOption === HOME_ROUTES.REPORTING

        },
        {
            title: 'Admin',
            type: HOME_ROUTES.ADMIN,
            color: Colors.sidebarOptions.admin,
            isExpanded,
            isSelected: selectedOption === HOME_ROUTES.ADMIN
        }
    ];

    return (
        <Box className={classes.container}>
            <Grid container className={classes.menuOptions} direction='column'>
                {Options.map((props, index) => <SidePanelOption key={index} {...props} />)}
            </Grid>
            <Box display='flex' flex={1} />
            <Box className={classes.bottomOptions}>
                {isExpanded ?
                    <FaChevronLeft
                        className={classes.anchor}
                        size={20}
                        color={Colors.defaults.white}
                        onClick={onToggle}
                    /> :
                    <FaChevronRight
                        className={classes.anchor}
                        size={20}
                        color={Colors.defaults.white}
                        onClick={onToggle}
                    />}
            </Box>
        </Box>
    );
}

export default memo(SidePanel);