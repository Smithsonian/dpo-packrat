/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { Alert, AlertTitle } from '@material-ui/lab';
import { makeStyles, fade } from '@material-ui/core/styles';

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

    alertBase: {
        borderWidth: 2,
        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
        '& .MuiAlert-icon': {
            fontSize: 80,               // icon size
            alignSelf: 'flex-start',
            marginRight: 12,
            lineHeight: 1,
            marginTop: 5
        },
        '& .MuiAlertTitle-root': {    // title: 2x, bold, underlined
            fontSize: '1.5em',
            fontWeight: 700,
            textDecoration: 'underline',
            marginBottom: 4,
        },
    },
    alertError: {
        borderColor: theme.palette.error.dark,
        backgroundColor: fade(theme.palette.error.main, 0.08),
        color: theme.palette.error.dark,
        '& a': { fontWeight: 'bold', color: theme.palette.error.dark, textDecorationColor: theme.palette.error.dark },
    },
    alertWarning: {
        borderColor: '#bf6100',
        backgroundColor: fade(theme.palette.warning.main, 0.12),
        color:  '#bf6100',
        '& a': { fontWeight: 'bold', color: '#bf6100', textDecorationColor: '#bf6100' },
        '& .MuiAlert-icon': { color: '#bf6100' },
    },
    alertInfo: {
        borderColor: theme.palette.info.main,
        backgroundColor: fade(theme.palette.info.main, 0.1),
        color: theme.palette.info.dark,
        '& a': { color: theme.palette.info.main, textDecorationColor: theme.palette.info.main },
    },

    messageHTML: {
        wordBreak: 'break-word',
    },
}));

/* eslint-disable-next-line react/prop-types */
const NoticeBanner: React.FC<NoticeBannerProps> = ({ state, title, messageHTML, messageText, className }) => {
    const classes = useStyles();

    const severityClass = state === 'error'   ? classes.alertError : state === 'warning' ? classes.alertWarning : classes.alertInfo;

    return (
        <div className={`${classes.root} ${className ?? ''}`}>
            <Alert
                severity={state}
                variant='outlined'
                className={`${classes.alertBase} ${severityClass}`}
            >
                {title ? <AlertTitle>{title}</AlertTitle> : null}
                {messageHTML
                    ? <div className={classes.messageHTML} dangerouslySetInnerHTML={{ __html: messageHTML }} />
                    : (messageText ?? null)}
            </Alert>
        </div>
    );
};

export default NoticeBanner;
