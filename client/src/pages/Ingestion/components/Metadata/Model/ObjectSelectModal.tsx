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
import { GetSystemObjectDetailsDocument, ExistingRelationship, RelatedObjectType } from '../../../../../types/graphql';
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
import { useRepositoryStore } from '../../../../../store/repository';

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
    relationship?: RelatedObjectType;
    idSystemObject?: number;
    objectType: number;
}

function ObjectSelectModal(props: ObjectSelectModalProps): React.ReactElement {
    const { open, onSelectedObjects, selectedObjects, onModalClose, idSystemObject, objectType, relationship } = props;
    const classes = useStyles();
    const [resetRepositoryBrowserRoot] = useRepositoryStore((state) => [state.resetRepositoryBrowserRoot]);
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
                const { data } = await updateSourceObjects(idSystemObject, objectType, selectedRelationships, previouslySelectedObjects);
                if (data.updateSourceObjects.success) {
                    if (data.updateSourceObjects.status === 'success') toast.success('Parent(s) successfully added');
                    if (data.updateSourceObjects.status === 'warn') toast.warn(`The following parent(s) had mismatched relationship: ${data.updateSourceObjects.message}`);
                } else {
                    toast.error('Parent(s) could not be added. Please try again later');
                }
            } else if (props.relationship === 'Derived' && idSystemObject) {
                const { data } = await updateDerivedObjects(idSystemObject, objectType, selectedRelationships, []);
                if (data.updateDerivedObjects.success) {
                    if (data.updateDerivedObjects.status === 'success') toast.success('Child(ren) successfully added');
                    if (data.updateDerivedObjects.status === 'warn') toast.warn(`The following child(ren) had mismatched relationship: ${data.updateDerivedObjects.message}`);
                } else {
                    toast.error('Child(ren) could not be added. Please try again later');
                }
            }
        } catch (error) {
            toast.error(`Error: ${error}`, { autoClose: false });
        }
        onModalClose();
        setSelected([]);
        setIsSaving(false);
        resetRepositoryBrowserRoot();
    };

    // onSelect handles selecting of entry
    const onSelect = async (sourceObject: StateRelatedObject): Promise<void> => {
        /*
            2 cases to handle:
                1) sourceObject is the parent - we want to simply pass the previouslySelectedObjects/existingParentRelationships
                2) sourceObject is the child - need to query for the child's sourceObjects to make sure it's following the relationship rules
        */
        try {
            if (relationship === RelatedObjectType.Source) {
                if (!isValidParentChildRelationship(sourceObject.objectType, objectType, selected, previouslySelectedObjects, true)) {
                    toast.error('Invalid parent selected');
                    return;
                }
            }

            if (relationship === RelatedObjectType.Derived) {
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
            const message: string = (error instanceof Error) ? `: ${error.message}` : '';
            toast.error(`Failed to select object${message}`);
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
