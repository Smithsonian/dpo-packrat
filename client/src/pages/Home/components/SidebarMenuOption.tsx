import React from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { DASHBOARD_TYPES } from '../../../constants';
import { FaChartLine, FaClipboardList, FaFileUpload, FaClipboardCheck, FaCog } from 'react-icons/fa';
import { MdInsertChart } from 'react-icons/md';
import { Colors } from '../../../theme';
import { colorWithOpacity } from '../../../theme/colors';

const useStyles = makeStyles(({ palette, spacing }) => ({
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '0.8rem 1.25rem',
        width: ({ isExpanded }: SidebarMenuOptionProps) => isExpanded ? 200 : 50,
        transition: 'all 250ms ease-in',
        textDecoration: 'none',
        overflow: 'hidden',
        backgroundColor: ({ isSelected }: SidebarMenuOptionProps) => isSelected ? colorWithOpacity(palette.primary.light, 33) : palette.primary.dark,
        '&:hover': {
            cursor: 'pointer',
            backgroundColor: colorWithOpacity(palette.primary.light, 33)
        },
    },
    iconContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        borderRadius: 10,
        backgroundColor: ({ color }: SidebarMenuOptionProps) => colorWithOpacity(color, 33),
        minHeight: 32,
        minWidth: 32
    },
    detailsContainer: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        paddingLeft: spacing(2)
    },
    title: {
        color: Colors.defaults.white,
        lineHeight: 1.25,
    },
    subtitle: {
        whiteSpace: 'nowrap',
        color: palette.primary.contrastText,
    },
}));

export interface SidebarMenuOptionProps {
    title: string;
    subtitle?: string;
    color: string;
    type: DASHBOARD_TYPES;
    isExpanded: boolean;
    isSelected: boolean;
    onSelect: (type: DASHBOARD_TYPES) => void;
}

function SidebarMenuOption(props: SidebarMenuOptionProps): React.ReactElement {
    const { title, subtitle, color, type, isExpanded, onSelect } = props;

    const classes = useStyles(props);

    const onClick = () => onSelect(type);

    return (
        <Box className={classes.container} onClick={onClick}>
            <Box className={classes.iconContainer}>
                <MenuOptionIcon type={type} color={color} />
            </Box>
            {isExpanded && <Box className={classes.detailsContainer}>
                <Typography className={classes.title} variant='subtitle1'>{title}</Typography>
                <Typography className={classes.subtitle} variant='body2'>{subtitle}</Typography>
            </Box>}
        </Box>
    );
}

interface MenuOptionIconProps {
    type: DASHBOARD_TYPES;
    color: string;
}

function MenuOptionIcon({ type, color }: MenuOptionIconProps) {
    switch (type) {
        case DASHBOARD_TYPES.DASHBOARD:
            return <FaChartLine size={20} color={color} />;

        case DASHBOARD_TYPES.REPOSITORY:
            return <FaClipboardList size={20} color={color} />;

        case DASHBOARD_TYPES.INGESTION:
            return <FaFileUpload size={20} color={color} />;

        case DASHBOARD_TYPES.WORKFLOW:
            return <FaClipboardCheck size={20} color={color} />;

        case DASHBOARD_TYPES.REPORTING:
            return <MdInsertChart size={20} color={color} />;

        case DASHBOARD_TYPES.ADMIN:
            return <FaCog size={20} color={color} />;

        default:
            return <FaChartLine size={20} color={color} />;
    }
}

export default SidebarMenuOption;