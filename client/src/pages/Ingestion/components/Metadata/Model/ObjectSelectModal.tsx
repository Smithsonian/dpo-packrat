/**
 * ObjectSelectModal
 *
 * This component renders the source object select modal which let's user select
 * the source objects for a model.
 */
import { AppBar, Button, Dialog, IconButton, Slide, Toolbar, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { TransitionProps } from '@material-ui/core/transitions';
import CloseIcon from '@material-ui/icons/Close';
import React from 'react';
import { StateSourceObject } from './SourceObjects';

const useStyles = makeStyles(({ spacing }) => ({
    title: {
        marginLeft: spacing(2),
        flex: 1,
    },
    appBar: {
        position: 'relative',
        color: 'white'
    },
}));

interface ObjectSelectModalProps {
    open: boolean;
    onSelectedObjects: (newSourceObjects: StateSourceObject[]) => void;
    onModalClose: () => void;
}

function ObjectSelectModal(props: ObjectSelectModalProps): React.ReactElement {
    const { open, onSelectedObjects, onModalClose } = props;
    const classes = useStyles();

    const onSave = () => {
        onSelectedObjects([]);
    };

    return (
        <Dialog fullScreen open={open} onClose={onModalClose} TransitionComponent={Transition}>
            <AppBar className={classes.appBar}>
                <Toolbar>
                    <IconButton edge='start' color='inherit' onClick={onModalClose} aria-label='close'>
                        <CloseIcon />
                    </IconButton>
                    <Typography variant='h6' className={classes.title}>
                        Select Source Objects
                    </Typography>
                    <Button autoFocus color='inherit' onClick={onSave}>
                        save
                    </Button>
                </Toolbar>
            </AppBar>
        </Dialog>
    );
}

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children?: React.ReactElement },
    ref: React.Ref<unknown>,
) {
    return <Slide direction='up' ref={ref} {...props} />;
});

export default ObjectSelectModal;
