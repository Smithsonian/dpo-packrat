import { Box, Grid, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { INGESTION_ROUTE } from '../../../../constants';
import IngestionSidebarOption, { IngestionSidebarOptionProps } from './IngestionSidebarOption';

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        padding: '2em 1em',
        borderRight: `1px solid ${palette.primary.light}`
    },
    menuLabel: {
        color: palette.primary.contrastText,
        fontWeight: typography.fontWeightMedium,
        marginBottom: spacing(5)
    },
    menuOptions: {
        display: 'flex',
        flex: 1
    }
}));

function SidebarMenu(): React.ReactElement {
    const [selectedOption, setSelectedOption] = useState(INGESTION_ROUTE.ROUTES.FILES);

    const classes = useStyles();
    const { step } = useParams();

    useEffect(() => {
        setSelectedOption(step);
    }, [step]);

    const Options: IngestionSidebarOptionProps[] = [
        {
            label: 'Files',
            type: INGESTION_ROUTE.ROUTES.FILES,
            isSelected: selectedOption === INGESTION_ROUTE.ROUTES.FILES
        },
        {
            label: 'Subject & Item',
            type: INGESTION_ROUTE.ROUTES.SUBJECT_ITEM,
            isSelected: selectedOption === INGESTION_ROUTE.ROUTES.SUBJECT_ITEM
        },
        {
            label: 'Metadata',
            type: INGESTION_ROUTE.ROUTES.METADATA,
            isSelected: selectedOption === INGESTION_ROUTE.ROUTES.METADATA
        }
    ];

    return (
        <Box className={classes.container}>
            <Typography className={classes.menuLabel} variant='caption'>INGESTION</Typography>
            <Grid container className={classes.menuOptions} direction='column'>
                {Options.map((props, index) => <IngestionSidebarOption key={index} {...props} />)}
            </Grid>
        </Box>
    );
}

export default SidebarMenu;