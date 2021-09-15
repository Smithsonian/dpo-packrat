/**
 * ObjectSelectModal
 *
 * This component renders the source object select modal which let's user select
 * the source objects for a model.
 */

// import {
//     GetSourceObjectIdentiferDocument,
//     GetSourceObjectIdentiferInput,
//     GetSourceObjectIdentiferQuery,
//     UpdateDerivedObjectsDocument,
//     UpdateSourceObjectsDocument
// } from '../../../../../types/graphql';
import { GetSystemObjectDetailsDocument, ExistingRelationship } from '../../../../../types/graphql';
import { apolloClient } from '../../../../../graphql';
import { AppBar, Box, Button, Dialog, Toolbar, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { StateRelatedObject } from '../../../../../store';
import { updateSourceObjects, updateDerivedObjects } from '../../../../Repository/hooks/useDetailsView';
import RepositoryFilterView from '../../../../Repository/components/RepositoryFilterView';
import RepositoryTreeView from '../../../../Repository/components/RepositoryTreeView';
import { isValidParentChildRelationship } from '../../../../../utils/repository';

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
    onSelectedObjects?: (newSourceObjects: StateRelatedObject[]) => void;
    onModalClose: () => void;
    relationship?: string;
    idSystemObject?: number;
    objectType: number;
}

function ObjectSelectModal(props: ObjectSelectModalProps): React.ReactElement {
    const { open, onSelectedObjects, selectedObjects, onModalClose, idSystemObject, objectType, relationship } = props;
    const classes = useStyles();
    const [selected, setSelected] = useState<StateRelatedObject[]>([]);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [previouslySelectedObjects, setPreviouslySelectedObjects] = useState<ExistingRelationship[]>([]);

    useEffect(() => {
        const selected = selectedObjects.map(({ idSystemObject, objectType }) => {
            return {
                idSystemObject,
                objectType
            };
        });
        setPreviouslySelectedObjects(selected);
    }, [selectedObjects]);

    const onSaveClick = async (): Promise<void> => {
        try {
            if (isSaving) return;
            setIsSaving(true);
            const selectedRelationships: ExistingRelationship[] = selected.map(({ idSystemObject, objectType }) => {
                return { idSystemObject, objectType };
            });
            if (props.relationship === 'Source' && idSystemObject) {
                console.log('derived case', idSystemObject, objectType, 'selectedRelationships', selectedRelationships, 'previouslySelected', previouslySelectedObjects);
                const { data } = await updateSourceObjects(idSystemObject, objectType, selectedRelationships, previouslySelectedObjects);
                console.log('data', data);
                if (data.updateSourceObjects.success) {
                    if (data.updateSourceObjects.status === 'success') toast.success('Parent(s) successfully added');
                    if (data.updateSourceObjects.status === 'warn') toast.warn(`The following parent(s) had mismatched relationship:${data.updateSourceObjects.message}`);
                } else {
                    toast.error('Parent(s) could not be added. Please try again later');
                }
            } else if (props.relationship === 'Derived' && idSystemObject) {
                console.log('derived case', idSystemObject, objectType, 'selectedRelationships', selectedRelationships, 'previouslySelected', previouslySelectedObjects);
                const { data } = await updateDerivedObjects(idSystemObject, objectType, selectedRelationships, []);
                console.log('data', data);
                if (data.updateDerivedObjects.success) {
                    if (data.updateDerivedObjects.status === 'success') toast.success('Child(ren) successfully added');
                    if (data.updateDerivedObjects.status === 'warn') toast.warn(`The following child(ren) had mismatched relationship:${data.updateDerivedObjects.message}`);
                } else {
                    toast.error('Child(ren) could not be added. Please try again later');
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
            console.log('error', error);
            toast.error(`Error: ${error}`, { autoClose: false });
        }
        onModalClose();
        setSelected([]);
        setIsSaving(false);
    };

    // onSelect handles selecting of entry
    const onSelect = async (sourceObject: StateRelatedObject): Promise<void> => {
        /*
            2 cases to handle:
                1) sourceObject is the parent - we want to simply pass the previouslySelectedObjects/existingParentRelationships
                2) sourceObject is the child - need to query for the child's sourceObjects to make sure it's following the relationship rules
        */
        console.log('sourceObject', sourceObject);
        console.log('selected', selected);
        console.log('objectType', objectType);
        try {
            if (relationship === 'Source') {
                if (!isValidParentChildRelationship(sourceObject.objectType, objectType, selected, previouslySelectedObjects, true)) {
                    toast.error('Invalid parent selected');
                    return;
                }
            }

            if (relationship === 'Derived') {
                const { data } = await apolloClient.query({
                    query: GetSystemObjectDetailsDocument,
                    variables: {
                        input: {
                            idSystemObject: sourceObject.idSystemObject
                        }
                    }
                });
                if (!data) {
                    toast.error('Cannot identify selected child');
                    return;
                }
                const {
                    getSystemObjectDetails: { sourceObjects }
                } = data;
                if (!isValidParentChildRelationship(objectType, sourceObject.objectType, [], sourceObjects, false)) {
                    toast.error('Invalid child selected');
                    return;
                }
            }

            setSelected([...selected, sourceObject]);
        } catch (error) {
            toast.error(error);
        }
    };

    const onUnSelect = (idSystemObject: number): void => {
        const updatedSelected = selected.filter(sourceObject => sourceObject.idSystemObject !== idSystemObject);
        setSelected(updatedSelected);
    };

    // onSelectedObjects will be passed when in Ingestion view
    // otherwise, we'll use onSaveClick when in Repository Details view
    const onClick = async () => {
        setIsSaving(true);
        if (onSelectedObjects) {
            onSelectedObjects(selected);
            setSelected([]);
        } else {
            await onSaveClick();
        }
        setIsSaving(false);
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
                        Select {props?.relationship === 'Source' ? 'Parent(s)' : 'Child(ren)'}
                    </Typography>
                    <Button autoFocus color='inherit' onClick={onClick}>
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
