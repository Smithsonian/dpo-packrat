/* eslint-disable react-hooks/exhaustive-deps */
/**
 * SceneDetails
 *
 * This component renders details tab for Scene specific details used in DetailsTab component.
 */
import { Box, makeStyles, Checkbox /*, Typography */ } from '@material-ui/core';
import React, { useEffect } from 'react';
import { Loader } from '../../../../../components';
import { GetSceneDocument } from '../../../../../types/graphql';
import { DetailComponentProps } from './index';
import { apolloClient } from '../../../../../graphql/index';
import ReferenceModels from '../../../../Ingestion/components/Metadata/Scene/ReferenceModels';
import { ReadOnlyRow, FieldType } from '../../../../../components/index';
import { useDetailTabStore } from '../../../../../store';
import { eSystemObjectType } from '../../../../../types/server';

export const useStyles = makeStyles(({ palette }) => ({
    value: {
        fontSize: '0.8em',
        color: palette.primary.dark
    },
    container: {
        marginBottom: 10,
        '& > *': {
            width: '20%',
            maxWidth: '300px',
            minWidth: '200px',
            height: '20px',
            '&:not(:last-child)': {
                borderBottom: '1px solid #D8E5EE'
            }
        }
    }
}));

function SceneDetails(props: DetailComponentProps): React.ReactElement {
    const classes = useStyles();
    const { data, loading, onUpdateDetail, objectType } = props;
    const [SceneDetails, updateDetailField] = useDetailTabStore(state => [state.SceneDetails, state.updateDetailField]);

    useEffect(() => {
        const retrieveSceneData = async () => {
            if (data && !loading) {
                const { Scene } = data.getDetailsTabDataForObject;
                const {
                    data: { getScene }
                } = await apolloClient.query({
                    query: GetSceneDocument,
                    variables: {
                        input: {
                            idScene: Scene?.idScene
                        }
                    },
                    fetchPolicy: 'no-cache'
                });

                updateDetailField(eSystemObjectType.eScene, 'ModelSceneXref', getScene?.Scene?.ModelSceneXref);
                updateDetailField(eSystemObjectType.eScene, 'CountScene', getScene?.Scene?.CountScene);
                updateDetailField(eSystemObjectType.eScene, 'CountNode', getScene?.Scene?.CountNode);
                updateDetailField(eSystemObjectType.eScene, 'CountCamera', getScene?.Scene?.CountCamera);
                updateDetailField(eSystemObjectType.eScene, 'CountLight', getScene?.Scene?.CountLight);
                updateDetailField(eSystemObjectType.eScene, 'CountModel', getScene?.Scene?.CountModel);
                updateDetailField(eSystemObjectType.eScene, 'CountMeta', getScene?.Scene?.CountMeta);
                updateDetailField(eSystemObjectType.eScene, 'CountSetup', getScene?.Scene?.CountSetup);
                updateDetailField(eSystemObjectType.eScene, 'CountTour', getScene?.Scene?.CountTour);
            }
        };

        retrieveSceneData();
    }, []);

    useEffect(() => {
        onUpdateDetail(objectType, SceneDetails);
    }, [SceneDetails]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        updateDetailField(eSystemObjectType.eScene, name, checked);
    };

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between', style: { borderRadius: 0 } };

    return (
        <Box>
            <ReferenceModels referenceModels={SceneDetails.ModelSceneXref} />

            <Box display='flex' flexDirection='column' className={classes.container}>
                <FieldType required label="Has been QC'd" direction='row' containerProps={rowFieldProps}>
                    <Checkbox name='HasBeenQCd' checked={SceneDetails.HasBeenQCd} color='primary' onChange={setCheckboxField} />
                </FieldType>

                <FieldType required label='Is Oriented' direction='row' containerProps={rowFieldProps}>
                    <Checkbox name='IsOriented' checked={SceneDetails.IsOriented} color='primary' onChange={setCheckboxField} />
                </FieldType>
                <ReadOnlyRow label='Scene Count' value={SceneDetails.CountScene} padding={15} />
                <ReadOnlyRow label='Node Count' value={SceneDetails.CountNode} padding={15} />
                <ReadOnlyRow label='Camera Count' value={SceneDetails.CountCamera} padding={15} />
                <ReadOnlyRow label='Light Count' value={SceneDetails.CountLight} padding={15} />
                <ReadOnlyRow label='Model Count' value={SceneDetails.CountModel} padding={15} />
                <ReadOnlyRow label='Meta Count' value={SceneDetails.CountMeta} padding={15} />
                <ReadOnlyRow label='Setup Count' value={SceneDetails.CountSetup} padding={15} />
                <ReadOnlyRow label='Tour Count' value={SceneDetails.CountTour} padding={15} />
            </Box>
        </Box>
    );
}

export default SceneDetails;
