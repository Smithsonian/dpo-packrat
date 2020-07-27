import { Box, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useHistory } from 'react-router';
import { DASHBOARD_ROUTES } from '../../../constants';
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
    const [selectedOption, setSelectedOption] = useState(DASHBOARD_ROUTES.DASHBOARD);

    const classes = useStyles();
    const history = useHistory();

    const onSelect = (type: DASHBOARD_ROUTES): void => {
        history.push(type);
        setSelectedOption(type);
    };

    const Options: SidebarMenuOptionProps[] = [
        {
            title: 'Dashboard',
            type: DASHBOARD_ROUTES.DASHBOARD,
            color: Colors.sidebarOptions.dashboard,
            isExpanded,
            isSelected: selectedOption === DASHBOARD_ROUTES.DASHBOARD,
            onSelect,
        },
        {
            title: 'Repository',
            subtitle: '314k assets',
            type: DASHBOARD_ROUTES.REPOSITORY,
            color: Colors.sidebarOptions.repository,
            isExpanded,
            isSelected: selectedOption === DASHBOARD_ROUTES.REPOSITORY,
            onSelect,
        },
        {
            title: 'Ingestion',
            subtitle: '12 assets today',
            type: DASHBOARD_ROUTES.INGESTION,
            color: Colors.sidebarOptions.ingestion,
            isExpanded,
            isSelected: selectedOption === DASHBOARD_ROUTES.INGESTION,
            onSelect,
        },
        {
            title: 'Workflow',
            subtitle: '6 open tasks',
            type: DASHBOARD_ROUTES.WORKFLOW,
            color: Colors.sidebarOptions.workflow,
            isExpanded,
            isSelected: selectedOption === DASHBOARD_ROUTES.WORKFLOW,
            onSelect,
        },
        {
            title: 'Reporting',
            type: DASHBOARD_ROUTES.REPORTING,
            color: Colors.sidebarOptions.reporting,
            isExpanded,
            isSelected: selectedOption === DASHBOARD_ROUTES.REPORTING,
            onSelect,

        },
        {
            title: 'Admin',
            type: DASHBOARD_ROUTES.ADMIN,
            color: Colors.sidebarOptions.admin,
            isExpanded,
            isSelected: selectedOption === DASHBOARD_ROUTES.ADMIN,
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