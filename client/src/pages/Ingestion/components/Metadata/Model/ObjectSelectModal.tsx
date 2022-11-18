/**
 * ObjectSelectModal
 *
 * This component renders the source object select modal which let's user select
 * the source objects for a model.
 */

import { GetSystemObjectDetailsDocument, ExistingRelationship, RelatedObjectType } from '../../../../../types/graphql';
import { apolloClient } from '../../../../../graphql';
import { AppBar, Box, Button, Dialog, Toolbar, Typography, IconButton } from '@material-ui/core';
import { makeStyles, fade, createStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { StateRelatedObject } from '../../../../../store';
import { updateSourceObjects, updateDerivedObjects } from '../../../../Repository/hooks/useDetailsView';
import RepositoryFilterView from '../../../../Repository/components/RepositoryFilterView';
import RepositoryTreeView from '../../../../Repository/components/RepositoryTreeView';
import { isValidParentChildRelationship } from '../../../../../utils/repository';
import { useRepositoryStore } from '../../../../../store/repository';
import CloseIcon from '@material-ui/icons/Close';
import { DebounceInput } from 'react-debounce-input';
import { IoIosSearch } from 'react-icons/io';
import { Colors } from '../../../../../theme';


const useStyles = makeStyles(({ palette, spacing, typography }) => createStyles({
    title: {
        marginLeft: spacing(2),
        textAlign: 'center',
    },
    appBar: {
        position: 'sticky',
        color: palette.background.paper,
        width: '100%',
    },
    toolBar: {
        display: 'flex',
        justifyContent: 'space-between',
        columnGap: '10px'
    },
    toolBarControlContainer: {
        display: 'flex',
        alignItems: 'center',
        columnGap: '10px'
    },
    repositoryContainer: {
        display: 'flex',
        flexDirection: 'column',
        padding: 20,
        paddingBottom: 0
    },
    loader: {
        color: palette.background.paper
    },
    searchBtn: {
        outline: '1px solid white',
        color: 'white',
        width: '90px',
        height: '30px',
        // border: '1px solid white',
        '&:focus': {
            border: '2px solid silver',
        }
    },
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        marginLeft: 10,
        padding: '5px 10px',
        width: '40vw',
        minWidth: '30vw',
        borderRadius: 5,
        backgroundColor: fade(Colors.defaults.white, 0.1)
    },
    search: {
        height: 25,
        flex: 1,
        fontSize: 14,
        marginLeft: 5,
        color: fade(Colors.defaults.white, 0.65),
        background: 'transparent',
        fontWeight: 400,
        fontFamily: typography.fontFamily,
        '&::placeholder': {
            color: fade(Colors.defaults.white, 0.65),
            fontStyle: 'italic'
        },
        '&::-moz-placeholder': {
            fontStyle: 'italic'
        },
        '&:focus': {
            border: '2px solid silver',
        },
        '&:not(:focus)': {
            borderStyle: 'none'
        }
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
    const [keyword, updateSearch, getFilterState, updateRepositoryFilter, resetRepositoryFilter] = useRepositoryStore(state => [
        state.keyword,
        state.updateSearch,
        state.getFilterState,
        state.updateRepositoryFilter,
        state.resetRepositoryFilter
    ]);

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
                    if (data.updateSourceObjects.status === 'success') toast.success('Parents successfully added');
                    if (data.updateSourceObjects.status === 'warn') toast.warn(`The following parents had mismatched relationship: ${data.updateSourceObjects.message}`);
                } else {
                    toast.error('Parents could not be added. Please try again later');
                }
            } else if (props.relationship === 'Derived' && idSystemObject) {
                const { data } = await updateDerivedObjects(idSystemObject, objectType, selectedRelationships, []);
                if (data.updateDerivedObjects.success) {
                    if (data.updateDerivedObjects.status === 'success') toast.success('Children successfully added');
                    if (data.updateDerivedObjects.status === 'warn') toast.warn(`The following children had mismatched relationship: ${data.updateDerivedObjects.message}`);
                } else {
                    toast.error('Children could not be added. Please try again later');
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

    const updateRepositorySearch = (): void => {
        resetRepositoryBrowserRoot();
        const filterState = getFilterState();
        filterState.search = filterState.keyword;
        resetRepositoryFilter(false);
        updateRepositoryFilter(filterState, true);
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
            <Box width='fit-content'>
                <AppBar className={classes.appBar}>
                    <Toolbar className={classes.toolBar}>
                        <Box className={classes.toolBarControlContainer}>
                            <Typography variant='h6' className={classes.title}>
                                Add {props?.relationship === 'Source' ? 'Parents' : 'Children'}
                            </Typography>
                            <Box className={classes.searchBox}>
                                <IoIosSearch size={20} color={fade(Colors.defaults.white, 0.65)} />
                                <DebounceInput
                                    title='Search Repository'
                                    element='input'
                                    className={classes.search}
                                    name='search'
                                    value={keyword}
                                    onChange={({ target }) => updateSearch(target.value)}
                                    onKeyPress={e => {
                                        if (e.key === 'Enter')
                                            updateRepositorySearch();
                                    }}
                                    forceNotifyByEnter
                                    debounceTimeout={400}
                                    placeholder='Search'
                                />
                            </Box>
                            <Button variant='outlined' className={classes.searchBtn} onClick={updateRepositorySearch}>
                                Search
                            </Button>
                        </Box>

                        <Box className={classes.toolBarControlContainer}>
                            <Button variant='outlined' className={classes.searchBtn} onClick={onClick}>
                                {isSaving ? 'Saving...' : 'Save'}
                            </Button>
                            <IconButton autoFocus color='inherit' onClick={onModalClose} >
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Toolbar>
                </AppBar>
                <Box className={classes.repositoryContainer}>
                    <RepositoryFilterView />
                    <RepositoryTreeView isModal selectedItems={selected} onSelect={onSelect} onUnSelect={onUnSelect} />
                </Box>
            </Box>
        </Dialog>
    );
}

export default ObjectSelectModal;
