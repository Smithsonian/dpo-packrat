/**
 * ObjectNotFoundView
 *
 * This component renders when the queried object is not present in the system.
 */
import { Box, Button, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { IoIosInformationCircleOutline, IoMdArrowBack } from 'react-icons/io';
import { useHistory } from 'react-router';
import { Progress } from '../../../../components';
import { palette } from '../../../../theme';

const useStyles = makeStyles(({ palette }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        marginBottom: 20,
        borderRadius: 10,
        backgroundColor: palette.primary.light
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
}));

interface ObjectNotFoundViewProps {
    loading: boolean;
}

function ObjectNotFoundView(props: ObjectNotFoundViewProps): React.ReactElement {
    const { loading } = props;
    const classes = useStyles();
    const history = useHistory();

    const startIcon: React.ReactNode = <IoMdArrowBack />;

    const onGoBack = (): void => {
        history.goBack();
    };

    let content: React.ReactNode = <Progress />;

    if (!loading) {
        content = (
            <React.Fragment>
                <IoIosInformationCircleOutline color={palette.primary.main} size={100} />
                <Typography className={classes.title} variant='h4' color='primary'>Not found</Typography>
                <Typography className={classes.subtitle} variant='body1' color='textPrimary'>Object you selected was not found in the system</Typography>
                <Button className={classes.button} startIcon={startIcon} onClick={onGoBack}>go back</Button>
            </React.Fragment>
        );
    }

    return (
        <Box className={classes.container}>
            {content}
        </Box>
    );
}

export default ObjectNotFoundView;