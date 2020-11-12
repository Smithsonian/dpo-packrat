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
import { useVocabularyStore } from '../../../../store';
import { eSystemObjectType, eVocabularySetID } from '../../../../types/server';
import DerivedObjectsList from '../../../Ingestion/components/Metadata/Model/DerivedObjectsList';
import ObjectSelectModal from '../../../Ingestion/components/Metadata/Model/ObjectSelectModal';
import SourceObjectsList from '../../../Ingestion/components/Metadata/Model/SourceObjectsList';
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

const mockData = {
    1: {
        name: 'PhotoSet1.zip',
        retired: true,
        objectType: eSystemObjectType.eCaptureData,
        path: [
            {
                idSystemObject: 0,
                name: 'USNM',
                objectType: eSystemObjectType.eUnit,
            }, {
                idSystemObject: 1,
                name: 'Armstrong Suit',
                objectType: eSystemObjectType.eProject,
            }, {
                idSystemObject: 2,
                name: 'Armstrong Glove',
                objectType: eSystemObjectType.eSubject,
            }, {
                idSystemObject: 3,
                name: 'Armstrong Glove Full',
                objectType: eSystemObjectType.eItem,
            }, {
                idSystemObject: 4,
                name: 'PhotoSet1.zip',
                objectType: eSystemObjectType.eCaptureData,
            }
        ],
        identifiers: [
            {
                id: 0,
                identifier: '31958de82-ab13-4049-c979-746e2fbe229e',
                identifierType: 75,
                selected: true
            },
        ],
        sourceObjects: [
            {
                idSystemObject: 0,
                name: 'PhotoSetAlpha1.zip',
                identifier: 'a5cf8642-7466-4896-a0a2-d698f2009cd3',
                objectType: eSystemObjectType.eModel
            }
        ],
        derivedObjects: [
            {
                idSystemObject: 0,
                name: 'Photo1.zip',
                variantType: 28,
                objectType: eSystemObjectType.eAsset
            },
            {
                idSystemObject: 1,
                name: 'Photo2.zip',
                variantType: 28,
                objectType: eSystemObjectType.eAsset
            },
            {
                idSystemObject: 2,
                name: 'Photo3.zip',
                variantType: 28,
                objectType: eSystemObjectType.eAsset
            },
            {
                idSystemObject: 3,
                name: 'Photo4.zip',
                variantType: 28,
                objectType: eSystemObjectType.eAsset
            },
        ],
    }
};

type DetailsParams = {
    idSystemObject: string;
};

function DetailsView(): React.ReactElement {
    const classes = useStyles();
    const params = useParams<DetailsParams>();
    const [modalOpen, setModalOpen] = useState(false);

    const data = mockData[params.idSystemObject];
    const getEntries = useVocabularyStore(state => state.getEntries);

    if (!data) {
        return <ObjectNotFoundView loading={false} />;
    }

    const { name, objectType, path, retired, identifiers, sourceObjects, derivedObjects, thumbnail } = data;
    const disabled: boolean = false;

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
                path={path}
                retired={retired}
                disabled={disabled}
            />
            <Box display='flex' flex={1}>
                <Box display='flex' flex={1} flexDirection='column'>
                    <IdentifierList
                        disabled={disabled}
                        identifiers={identifiers}
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