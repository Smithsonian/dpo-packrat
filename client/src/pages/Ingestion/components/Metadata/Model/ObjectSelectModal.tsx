/**
 * ObjectSelectModal
 *
 * This component renders the source object select modal which let's user select
 * the source objects for a model.
 */
import { ApolloQueryResult } from '@apollo/client';
import { AppBar, Box, Button, Dialog, IconButton, Slide, Toolbar, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { TransitionProps } from '@material-ui/core/transitions';
import CloseIcon from '@material-ui/icons/Close';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { apolloClient } from '../../../../../graphql';
import { StateSourceObject } from '../../../../../store';
import { GetSourceObjectIdentiferDocument, GetSourceObjectIdentiferInput, GetSourceObjectIdentiferQuery } from '../../../../../types/graphql';
import RepositoryFilterView from '../../../../Repository/components/RepositoryFilterView';
import RepositoryTreeView from '../../../../Repository/components/RepositoryTreeView';

const useStyles = makeStyles(({ palette, spacing, breakpoints }) => ({
    title: {
        marginLeft: spacing(2),
        flex: 1,
    },
    appBar: {
        position: 'relative',
        color: palette.background.paper
    },
    repositoryContainer: {
        display: 'flex',
        flexDirection: 'column',
        padding: 20,
        paddingBottom: 0,
        [breakpoints.down('lg')]: {
            padding: 10
        }
    },
    loader: {
        color: palette.background.paper
    }
}));

interface ObjectSelectModalProps {
    open: boolean;
    selectedObjects: StateSourceObject[];
    onSelectedObjects: (newSourceObjects: StateSourceObject[]) => void;
    onModalClose: () => void;
}

function ObjectSelectModal(props: ObjectSelectModalProps): React.ReactElement {
    const { open, onSelectedObjects, selectedObjects, onModalClose } = props;
    const classes = useStyles();
    const [selected, setSelected] = useState<StateSourceObject[]>(selectedObjects);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const onSave = async (): Promise<void> => {
        try {
            if (isSaving) return;
            setIsSaving(true);
            const idSystemObjects: number[] = selected.map(({ idSystemObject }) => idSystemObject);
            const input: GetSourceObjectIdentiferInput = {
                idSystemObjects
            };

            const { data }: ApolloQueryResult<GetSourceObjectIdentiferQuery> = await apolloClient.query({
                query: GetSourceObjectIdentiferDocument,
                variables: {
                    input
                }
            });

            if (data) {
                const { getSourceObjectIdentifer } = data;
                const { sourceObjectIdentifiers } = getSourceObjectIdentifer;

                const selectedSourceObjects: StateSourceObject[] = selected.map((selected: StateSourceObject, index: number) => ({
                    ...selected,
                    identifier: sourceObjectIdentifiers[index]?.identifier
                }));
                onSelectedObjects(selectedSourceObjects);
            }
        } catch (error) {
            toast.error('Error occurred while fetching identifiers');
        }
        setIsSaving(false);
    };

    const onSelect = (sourceObject: StateSourceObject): void => {
        setSelected([...selected, sourceObject]);
    };

    const onUnSelect = (idSystemObject: number): void => {
        const updatedSelected = selected.filter(sourceObject => sourceObject.idSystemObject !== idSystemObject);
        setSelected(updatedSelected);
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
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                </Toolbar>
            </AppBar>
            <Box className={classes.repositoryContainer}>
                <RepositoryFilterView />
                <RepositoryTreeView isModal selectedItems={selected} onSelect={onSelect} onUnSelect={onUnSelect} />
            </Box>
        </Dialog >
    );
}

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children?: React.ReactElement },
    ref: React.Ref<unknown>,
) {
    return <Slide direction='up' ref={ref} {...props} />;
});

export default ObjectSelectModal;
