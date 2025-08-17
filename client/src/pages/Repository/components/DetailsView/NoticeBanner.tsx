/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
// import { Box } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';

export type NoticeState = 'error' | 'warning' | 'info';
export interface NoticeBannerProps {
    state: NoticeState;
    title?: string;
    messageHTML?: string;
    messageText?: string;
    className?: string;
}

const useStyles = makeStyles((theme: any) => ({
    root: {
        width: '100%',
        marginBottom: theme?.spacing ? theme.spacing(2) : 16,
    },
    // Optional: tighten spacing inside the alert
    alert: {
    // example tweaks; remove if you want defaults
    // padding: theme?.spacing ? theme.spacing(1.5) : 12,
    },
    messageHTML: {
    // Ensure long links wrap nicely
        wordBreak: 'break-word',
    },
}));

/* eslint-disable-next-line react/prop-types */
const NoticeBanner: React.FC<NoticeBannerProps> = ({ state, title, messageHTML, messageText, className }) => {
    const classes = useStyles();
    return (
        <div className={`${classes.root} ${className ?? ''}`}>
            <Alert severity={state} variant='outlined' className={classes.alert}>
                {title ? <AlertTitle>{title}</AlertTitle> : null}
                {messageHTML
                    ? <div className={classes.messageHTML} dangerouslySetInnerHTML={{ __html: messageHTML }} />
                    : (messageText ?? null)}
            </Alert>
        </div>
    );
};

export default NoticeBanner;
