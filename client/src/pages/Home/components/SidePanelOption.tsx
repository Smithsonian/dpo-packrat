import { Box, Typography } from '@material-ui/core';
import { makeStyles, fade } from '@material-ui/core/styles';
import React, { memo } from 'react';
import { FaChartLine, FaClipboardCheck, FaClipboardList, FaCog, FaFileUpload } from 'react-icons/fa';
import { MdInsertChart } from 'react-icons/md';
import { HOME_ROUTES, resolveRoute } from '../../../constants';
import { Colors } from '../../../theme';
import { Link } from 'react-router-dom';

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '0.8rem 1.25rem',
        width: ({ isExpanded }: SidePanelOptionProps) => isExpanded ? 200 : 50,
        transition: 'all 250ms ease-in',
        textDecoration: 'none',
        overflow: 'hidden',
        backgroundColor: ({ isSelected }: SidePanelOptionProps) => isSelected ? fade(palette.primary.light, 0.2) : palette.primary.dark,
        '&:hover': {
            cursor: 'pointer',
            backgroundColor: fade(palette.primary.light, 0.2)
        },
    },
    iconContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        borderRadius: 10,
        backgroundColor: ({ color }: SidePanelOptionProps) => fade(color, 0.2),
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
        fontWeight: typography.fontWeightLight
    },
}));

export interface SidePanelOptionProps {
    title: string;
    subtitle?: string;
    color: string;
    type: HOME_ROUTES;
    isExpanded: boolean;
    isSelected: boolean;
}

function SidePanelOption(props: SidePanelOptionProps): React.ReactElement {
    const { title, subtitle, color, type, isExpanded } = props;

    const classes = useStyles(props);

    return (
        <Link className={classes.container} to={resolveRoute(type)}>
            <Box className={classes.iconContainer}>
                <MenuOptionIcon type={type} color={color} />
            </Box>
            {isExpanded && <Box className={classes.detailsContainer}>
                <Typography className={classes.title} variant='body1'>{title}</Typography>
                <Typography className={classes.subtitle} variant='caption'>{subtitle}</Typography>
            </Box>}
        </Link>
    );
}

interface MenuOptionIconProps {
    type: HOME_ROUTES;
    color: string;
}

function MenuOptionIcon({ type, color }: MenuOptionIconProps) {
    switch (type) {
        case HOME_ROUTES.DASHBOARD:
            return <FaChartLine size={20} color={color} />;

        case HOME_ROUTES.REPOSITORY:
            return <FaClipboardList size={20} color={color} />;

        case HOME_ROUTES.INGESTION:
            return <FaFileUpload size={20} color={color} />;

        case HOME_ROUTES.WORKFLOW:
            return <FaClipboardCheck size={20} color={color} />;

        case HOME_ROUTES.REPORTING:
            return <MdInsertChart size={20} color={color} />;

        case HOME_ROUTES.ADMIN:
            return <FaCog size={20} color={color} />;

        default:
            return <FaChartLine size={20} color={color} />;
    }
}

export default memo(SidePanelOption);