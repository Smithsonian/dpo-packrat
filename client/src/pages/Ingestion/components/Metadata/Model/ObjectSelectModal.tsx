/**
 * ObjectSelectModal
 *
 * This component renders the source object select modal which let's user select
 * the source objects for a model.
 */

// import { ApolloQueryResult } from '@apollo/client';
// import {
//     GetSourceObjectIdentiferDocument,
//     GetSourceObjectIdentiferInput,
//     GetSourceObjectIdentiferQuery,
//     UpdateDerivedObjectsDocument,
//     UpdateSourceObjectsDocument
// } from '../../../../../types/graphql';
// import { apolloClient } from '../../../../../graphql';

import { AppBar, Box, Button, Dialog, Toolbar, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { StateRelatedObject } from '../../../../../store';
import { updateSourceObjects, updateDerivedObjects } from '../../../../Repository/hooks/useDetailsView';
import RepositoryFilterView from '../../../../Repository/components/RepositoryFilterView';
import RepositoryTreeView from '../../../../Repository/components/RepositoryTreeView';

const useStyles = makeStyles(({ palette, spacing, breakpoints }) => ({
    title: {
        marginLeft: spacing(2),
        textAlign: 'center',
        flex: 1
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
    selectedObjects: StateRelatedObject[];
    onSelectedObjects: (newSourceObjects: StateRelatedObject[]) => void;
    onModalClose: () => void;
    relationship?: string;
    idSystemObject?: number;
}

function ObjectSelectModal(props: ObjectSelectModalProps): React.ReactElement {
    const { open /*, onSelectedObjects */, selectedObjects, onModalClose, idSystemObject } = props;
    const classes = useStyles();
    const [selected, setSelected] = useState<StateRelatedObject[]>([]);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    useEffect(() => {
        setSelected(selectedObjects);
    }, [selectedObjects, props]);

    const onSaveClick = async (): Promise<void> => {
        try {
            if (isSaving) return;
            setIsSaving(true);
            const idSystemObjects: number[] = selected.map(({ idSystemObject }) => idSystemObject);
            if (props.relationship === 'Source' && idSystemObject) {
                const { data } = await updateSourceObjects(idSystemObject, idSystemObjects);
                if (data.updateSourceObjects.success) {
                    toast.success('Source object(s) successfully added');
                } else {
                    toast.error('Source object(s) could not be added. Please try again later');
                }
            } else if (props.relationship === 'Derived' && idSystemObject) {
                const { data } = await updateDerivedObjects(idSystemObject, idSystemObjects);
                if (data.updateDerivedObjects.success) {
                    toast.success('Derived object(s) successfully added');
                } else {
                    toast.error('Derived object(s) could not be added. Please try again later');
                }
            }
            // const input: GetSourceObjectIdentiferInput = {
            //     idSystemObjects
            // };

            // const { data }: ApolloQueryResult<GetSourceObjectIdentiferQuery> = await apolloClient.query({
            //     query: GetSourceObjectIdentiferDocument,
            //     variables: {
            //         input
            //     }
            // });

            // if (data) {
            //     const { getSourceObjectIdentifer } = data;
            //     const { sourceObjectIdentifiers } = getSourceObjectIdentifer;

            //     const selectedSourceObjects: StateRelatedObject[] = selected.map((selected: StateRelatedObject, index: number) => ({
            //         ...selected,
            //         identifier: sourceObjectIdentifiers[index]?.identifier
            //     }));
            //     onSelectedObjects(selectedSourceObjects);
            // }
        } catch (error) {
            toast.error('Error occurred while fetching identifiers');
        }
        onModalClose();
        setSelected([]);
        setIsSaving(false);
    };

    const onSelect = (sourceObject: StateRelatedObject): void => {
        setSelected([...selected, sourceObject]);
    };

    const onUnSelect = (idSystemObject: number): void => {
        const updatedSelected = selected.filter(sourceObject => sourceObject.idSystemObject !== idSystemObject);
        setSelected(updatedSelected);
    };

    return (
        <Dialog
            open={open}
            onClose={() => {
                onModalClose();
                setSelected([]);
            }}
            maxWidth='xl'
        >
            <AppBar className={classes.appBar}>
                <Toolbar>
                    <Button autoFocus color='inherit' onClick={onModalClose}>
                        Close
                    </Button>
                    <Typography variant='h6' className={classes.title}>
                        Select {props?.relationship} Objects
                    </Typography>
                    <Button autoFocus color='inherit' onClick={onSaveClick}>
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                </Toolbar>
            </AppBar>
            <Box className={classes.repositoryContainer}>
                <RepositoryFilterView />
                <RepositoryTreeView isModal selectedItems={selected} onSelect={onSelect} onUnSelect={onUnSelect} />
            </Box>
        </Dialog>
    );
}

export default ObjectSelectModal;
