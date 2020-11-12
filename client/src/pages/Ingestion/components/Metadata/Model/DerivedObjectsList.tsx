/**
 * DerivedObjectsList
 *
 * This component renders the derived object list with add capability.
 */
import { Box, Button, Typography } from '@material-ui/core';
import clsx from 'clsx';
import React from 'react';
import { MdRemoveCircleOutline } from 'react-icons/md';
import { NewTabLink } from '../../../../../components';
import { StateDerivedObject, useVocabularyStore } from '../../../../../store';
import { eVocabularySetID } from '../../../../../types/server';
import { getDetailsUrlForObject, getTermForSystemObjectType } from '../../../../../utils/repository';
import { Header, useStyles } from './SourceObjectsList';

interface DerivedObjectsListProps {
    derivedObjects: StateDerivedObject[];
    onAdd: () => void;
    onRemove?: (id: number) => void;
    viewMode?: boolean;
    disabled?: boolean;
}

function DerivedObjectsList(props: DerivedObjectsListProps): React.ReactElement {
    const { derivedObjects, onAdd, onRemove, viewMode = false, disabled = false } = props;
    const classes = useStyles(viewMode);

    const titles = ['Derived Object(s)', 'Variant Type', 'Object Type'];
    const hasDerivedObjects = !!derivedObjects.length;

    return (
        <Box className={classes.container}>
            <Header titles={titles} />
            {hasDerivedObjects && (
                <Box className={classes.list}>
                    {derivedObjects.map((derivedObject: StateDerivedObject, index: number) => (
                        <Item
                            key={index}
                            viewMode={viewMode}
                            derivedObject={derivedObject}
                            onRemove={onRemove}
                        />
                    ))}
                </Box>
            )}
            <Button
                className={classes.addButton}
                disableElevation
                color='primary'
                variant='contained'
                onClick={() => onAdd()}
                disabled={disabled}
            >
                Add
            </Button>
        </Box>
    );
}

interface ItemProps {
    derivedObject: StateDerivedObject;
    onRemove?: (id: number) => void;
    viewMode?: boolean;
}

function Item(props: ItemProps): React.ReactElement {
    const { derivedObject, onRemove, viewMode = false } = props;
    const { idSystemObject, name, variantType, objectType } = derivedObject;
    const classes = useStyles(viewMode);
    const getEntries = useVocabularyStore(state => state.getEntries);

    const entries = getEntries(eVocabularySetID.eCaptureDataFileVariantType);
    const variant = entries.find(entry => entry.idVocabulary === variantType);

    const remove = () => onRemove?.(idSystemObject);

    return (
        <Box
            display='flex'
            flex={1}
            flexDirection='row'
            alignItems='center'
            pb='10px'
        >
            <Box display='flex' flex={2}>
                <NewTabLink to={getDetailsUrlForObject(idSystemObject)}>
                    <Typography className={clsx(classes.label, classes.labelUnderline)}>{name}</Typography>
                </NewTabLink>
            </Box>
            <Box display='flex' flex={3}>
                <Typography className={classes.label}>{variant?.Term}</Typography>
            </Box>
            <Box display='flex' flex={1}>
                <Typography className={classes.label}>{getTermForSystemObjectType(objectType)}</Typography>
            </Box>
            <Box width='50px'>
                {!viewMode && <MdRemoveCircleOutline className={classes.removeIcon} onClick={remove} size={24} />}
            </Box>
        </Box>
    );
}

export default DerivedObjectsList;
