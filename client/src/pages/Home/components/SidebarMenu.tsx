import { Box, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useHistory } from 'react-router';
import { DASHBOARD_TYPES } from '../../../constants';
import { Colors } from '../../../theme';
import { colorWithOpacity } from '../../../theme/colors';
import SidebarMenuOption, { SidebarMenuOptionProps } from './SidebarMenuOption';

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

interface SidebarMenuProps {
    isExpanded: boolean;
    onToggle: () => void;
}

function SidebarMenu(props: SidebarMenuProps): React.ReactElement {
    const { isExpanded, onToggle } = props;
    const [selectedOption, setSelectedOption] = useState(DASHBOARD_TYPES.DASHBOARD);

    const classes = useStyles();
    const history = useHistory();

    const onSelect = (type: DASHBOARD_TYPES): void => {
        history.push(type);
        setSelectedOption(type);
    };

    const Options: SidebarMenuOptionProps[] = [
        {
            title: 'Dashboard',
            type: DASHBOARD_TYPES.DASHBOARD,
            color: Colors.sidebarOptions.dashboard,
            isExpanded,
            isSelected: selectedOption === DASHBOARD_TYPES.DASHBOARD,
            onSelect,
        },
        {
            title: 'Repository',
            subtitle: '314k assets',
            type: DASHBOARD_TYPES.REPOSITORY,
            color: Colors.sidebarOptions.repository,
            isExpanded,
            isSelected: selectedOption === DASHBOARD_TYPES.REPOSITORY,
            onSelect,
        },
        {
            title: 'Ingestion',
            subtitle: '12 assets today',
            type: DASHBOARD_TYPES.INGESTION,
            color: Colors.sidebarOptions.ingestion,
            isExpanded,
            isSelected: selectedOption === DASHBOARD_TYPES.INGESTION,
            onSelect,
        },
        {
            title: 'Workflow',
            subtitle: '6 open tasks',
            type: DASHBOARD_TYPES.WORKFLOW,
            color: Colors.sidebarOptions.workflow,
            isExpanded,
            isSelected: selectedOption === DASHBOARD_TYPES.WORKFLOW,
            onSelect,
        },
        {
            title: 'Reporting',
            type: DASHBOARD_TYPES.REPORTING,
            color: Colors.sidebarOptions.reporting,
            isExpanded,
            isSelected: selectedOption === DASHBOARD_TYPES.REPORTING,
            onSelect,

        },
        {
            title: 'Admin',
            type: DASHBOARD_TYPES.ADMIN,
            color: Colors.sidebarOptions.admin,
            isExpanded,
            isSelected: selectedOption === DASHBOARD_TYPES.ADMIN,
            onSelect,
        }
    ];

    return (
        <Box className={classes.container}>
            <Grid container className={classes.menuOptions} direction='column'>
                {Options.map((props, index) => <SidebarMenuOption key={index} {...props} />)}
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

export default SidebarMenu;