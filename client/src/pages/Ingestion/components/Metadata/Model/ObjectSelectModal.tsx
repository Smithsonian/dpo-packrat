/**
 * ObjectSelectModal
 *
 * This component renders the source object select modal which let's user select
 * the source objects for a model.
 */
import { ApolloQueryResult } from '@apollo/client';
import { AppBar, Box, Button, Dialog, Toolbar, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { apolloClient } from '../../../../../graphql';
import { StateSourceObject } from '../../../../../store';
import { GetSourceObjectIdentiferDocument, GetSourceObjectIdentiferInput, GetSourceObjectIdentiferQuery } from '../../../../../types/graphql';
import RepositoryFilterView from '../../../../Repository/components/RepositoryFilterView';
import RepositoryTreeView from '../../../../Repository/components/RepositoryTreeView';

const useStyles = makeStyles(({ palette, spacing, breakpoints }) => ({
    title: {
        marginLeft: spacing(2),
        textAlign: 'center',
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
    const [selected, setSelected] = useState<StateSourceObject[]>([]);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    useEffect(() => {
        setSelected(selectedObjects);
    }, [selectedObjects]);

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
        <Dialog maxWidth='xl' open={open} onClose={onModalClose}>
            <AppBar className={classes.appBar}>
                <Toolbar>
                    <Button autoFocus color='inherit' onClick={onModalClose}>
                        Close
                    </Button>
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

export default ObjectSelectModal;
