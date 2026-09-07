/**
 * ServiceStatusBanner
 *
 * Renders thin banners at the top of the screen when backend services
 * (Database, Solr, EDAN) are unavailable. Pinned above the header as a
 * non-scrolling flex child of the app shell.
 */
import { Box, Typography } from '@material-ui/core';
import { makeStyles, createStyles } from '@material-ui/core/styles';
import React from 'react';
import { useServiceStatusStore } from '../../store';

const useStyles = makeStyles(() => createStyles({
    wrapper: {
        flexShrink: 0,
    },
    banner: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '4px 16px',
    },
    error: {
        backgroundColor: '#d32f2f',
        color: '#ffffff',
    },
    warning: {
        backgroundColor: '#ed6c02',
        color: '#ffffff',
    },
    text: {
        fontWeight: 500,
        fontSize: '0.8rem',
    },
}));

function ServiceStatusBanner(): React.ReactElement | null {
    const classes = useStyles();
    const { status, initialized } = useServiceStatusStore();

    const banners: { message: string; severity: 'error' | 'warning' }[] = [];

    if (initialized && !status.database) {
        banners.push({
            message: 'Database is unreachable. Application functionality is limited.',
            severity: 'error',
        });
    }

    if (initialized && !status.solr) {
        banners.push({
            message: 'Search service is unavailable. Repository browsing may not work.',
            severity: 'warning',
        });
    }

    if (initialized && !status.edan) {
        banners.push({
            message: 'EDAN is unreachable. Publishing and ingestion from EDAN are unavailable.',
            severity: 'warning',
        });
    }

    if (banners.length === 0) return null;

    return (
        <div className={classes.wrapper}>
            {banners.map((banner, index) => (
                <Box
                    key={index}
                    className={`${classes.banner} ${banner.severity === 'error' ? classes.error : classes.warning}`}
                >
                    <Typography className={classes.text}>
                        {banner.message}
                    </Typography>
                </Box>
            ))}
        </div>
    );
}

export default ServiceStatusBanner;
