/**
 * DetailsView
 *
 * This component renders repository details view for the Repository UI.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useState } from 'react';
import { useParams } from 'react-router';
import IdentifierList from '../../../../components/shared/IdentifierList';
import { parseIdentifiersToState, useVocabularyStore } from '../../../../store';
import { eVocabularySetID } from '../../../../types/server';
import DerivedObjectsList from '../../../Ingestion/components/Metadata/Model/DerivedObjectsList';
import ObjectSelectModal from '../../../Ingestion/components/Metadata/Model/ObjectSelectModal';
import SourceObjectsList from '../../../Ingestion/components/Metadata/Model/SourceObjectsList';
import { useObjectDetails } from '../../hooks/useDetailsView';
import DetailsHeader from './DetailsHeader';
import DetailsThumbnail from './DetailsThumbnail';
import ObjectNotFoundView from './ObjectNotFoundView';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 140px)',
        padding: 20,
        marginBottom: 20,
        borderRadius: 10,
        overflowY: 'scroll',
        backgroundColor: palette.primary.light,
        [breakpoints.down('lg')]: {
            maxHeight: 'calc(100vh - 120px)',
            padding: 10
        }
    }
}));

type DetailsParams = {
    idSystemObject: string;
};

function DetailsView(): React.ReactElement {
    const classes = useStyles();
    const params = useParams<DetailsParams>();
    const [modalOpen, setModalOpen] = useState(false);

    const { data, loading } = useObjectDetails(Number.parseInt(params.idSystemObject, 10));

    const getEntries = useVocabularyStore(state => state.getEntries);

    if (!data || !params.idSystemObject) {
        return <ObjectNotFoundView loading={loading} />;
    }

    const { name, objectType, retired, identifiers, allowed, thumbnail, objectAncestors, sourceObjects, derivedObjects } = data.getSystemObjectDetails;

    const disabled: boolean = !allowed;

    const addIdentifer = () => {
        alert('TODO: KARAN: add identifier');
    };

    const removeIdentifier = () => {
        alert('TODO: KARAN: remove identifier');
    };

    const updateIdentifierFields = () => {
        alert('TODO: KARAN: update identifier');
    };

    const onSelectedObjects = () => {
        onModalClose();
    };

    const onModalClose = () => {
        setModalOpen(false);
    };

    const onAddSourceObject = () => {
        setModalOpen(true);
    };

    const onAddDerivedObject = () => {
        alert('TODO: KARAN: on add derived object');
    };

    return (
        <Box className={classes.container}>
            <DetailsHeader
                name={name}
                objectType={objectType}
                path={objectAncestors}
                retired={retired}
                disabled={disabled}
            />
            <Box display='flex' flex={1}>
                <Box display='flex' flex={1} flexDirection='column'>
                    <IdentifierList
                        viewMode
                        disabled={disabled}
                        identifiers={parseIdentifiersToState(identifiers, [])}
                        identifierTypes={getEntries(eVocabularySetID.eIdentifierIdentifierType)}
                        onAdd={addIdentifer}
                        onRemove={removeIdentifier}
                        onUpdate={updateIdentifierFields}
                    />
                    <SourceObjectsList
                        viewMode
                        disabled={disabled}
                        sourceObjects={sourceObjects}
                        onAdd={onAddSourceObject}
                    />
                    <DerivedObjectsList
                        viewMode
                        disabled={disabled}
                        derivedObjects={derivedObjects}
                        onAdd={onAddDerivedObject}
                    />
                </Box>
                <Box display='flex' flex={1} padding={2}>
                    <DetailsThumbnail thumbnail={thumbnail} />
                </Box>
            </Box>

            <ObjectSelectModal
                open={modalOpen}
                onSelectedObjects={onSelectedObjects}
                onModalClose={onModalClose}
                selectedObjects={sourceObjects}
            />
        </Box>
    );
}

export default DetailsView;