/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ErrorBoundary
 *
 * This component catch errors during rendering, in lifecycle methods,
 * and in constructors of the whole tree below them.
 */
import { Box, Button, Typography } from '@material-ui/core';
import { Theme, withStyles } from '@material-ui/core/styles';
import React, { Component } from 'react';
import { BiMessageRoundedError } from 'react-icons/bi';
import { IoMdArrowBack } from 'react-icons/io';
import withRouter from './withRouter';
import { ROUTES } from '../../constants';
import { palette } from '../../theme';

interface ErrorBoundaryState {
    hasError: boolean;
}

const styles = ({ palette }: Theme) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '35vh'
    },
    title: {
        margin: '10px 0px 5px 0px',
    },
    subtitle: {
        color: palette.grey[600],
        marginBottom: 10
    },
    button: {
        color: palette.primary.main,
        fontSize: '0.8em'
    }
});

class ErrorBoundary extends Component<any, ErrorBoundaryState> {
    state: ErrorBoundaryState = {
        hasError: false
    };

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    render(): React.ReactNode {
        const { hasError } = this.state;
        const { children, classes, history } = this.props;

        const startIcon: React.ReactNode = <IoMdArrowBack />;

        const onGoBack = (): void => {
            history.push(ROUTES.HOME);
            this.setState({ hasError: false });
        };

        if (hasError) {
            return (
                <Box className={classes.container}>
                    <BiMessageRoundedError color={palette.primary.main} size={100} />
                    <Typography className={classes.title} variant='h4' color='primary'>Something went wrong</Typography>
                    <Typography className={classes.subtitle} variant='body1' color='textPrimary'>We are working on getting it fixed</Typography>
                    <Button className={classes.button} startIcon={startIcon} onClick={onGoBack}>go back</Button>
                </Box>
            );
        }

        return children;
    }
}

export default withStyles(styles as any)(withRouter(ErrorBoundary));