/* eslint-disable react-hooks/exhaustive-deps */
/**
 * SceneDetails
 *
 * This component renders details tab for Scene specific details used in DetailsTab component.
 */
import { Box, makeStyles } from '@material-ui/core';
import React, { useEffect, useRef } from 'react';
import { Loader } from '../../../../../components';
import { GetSceneDocument } from '../../../../../types/graphql';
import { DetailComponentProps } from './index';
import { apolloClient } from '../../../../../graphql/index';
import ReferenceModels from '../../../../Ingestion/components/Metadata/Scene/ReferenceModels';
import { ReadOnlyRow, CheckboxField } from '../../../../../components/index';
import { useDetailTabStore } from '../../../../../store';
import { eSystemObjectType } from '@dpo-packrat/common';

export const useStyles = makeStyles(({ palette }) => ({
    value: {
        fontSize: '0.8em',
        color: palette.primary.dark
    },
    container: {
        marginBottom: 10,
        width: '20%',
        minWidth: 'fit-content',
        '& > *': {
            minHeight: '22px',
            height: 'fit-content',
            '&:not(:last-child)': {
                borderBottom: '1px solid #D8E5EE'
            }
        }
    }
}));

function SceneDetails(props: DetailComponentProps): React.ReactElement {
    const classes = useStyles();
    const isMounted = useRef(false);
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
                updateDetailField(eSystemObjectType.eScene, 'EdanUUID', getScene?.Scene?.EdanUUID);
                isMounted.current = true;
            }
        };

        retrieveSceneData();
    }, []);

    useEffect(() => {
        if (isMounted.current) onUpdateDetail(objectType, SceneDetails);
    }, [SceneDetails]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        updateDetailField(eSystemObjectType.eScene, name, checked);
    };

    return (
        <Box>
            <ReferenceModels referenceModels={SceneDetails.ModelSceneXref} />
            <Box display='flex' flexDirection='column' className={classes.container}>
                <CheckboxField
                    label='Approved for Publication'
                    name='ApprovedForPublication'
                    value={SceneDetails.ApprovedForPublication}
                    onChange={setCheckboxField}
                    required
                    padding='3px 10px 1px 10px'
                    containerStyle={{ borderTopLeftRadius: '5px', borderTopRightRadius: '5px', paddingTop: '5px' }}
                />
                <CheckboxField
                    label="Posed and QC'd"
                    name='PosedAndQCd'
                    value={SceneDetails.PosedAndQCd}
                    onChange={setCheckboxField}
                    tooltip={{ title: 'When checked, downloads will be generated if this scene has a master model as a parent, as well as every time the scene is re-posed.', placement: 'left' }}
                    required
                    padding='1px 10px'
                />
                <ReadOnlyRow label='EDAN UUID' value={SceneDetails.EdanUUID} paddingString='1px 10px' />
                <ReadOnlyRow label='Scene Count' value={SceneDetails.CountScene} padding={10} paddingString='1px 10px' />
                <ReadOnlyRow label='Node Count' value={SceneDetails.CountNode} padding={10} paddingString='1px 10px' />
                <ReadOnlyRow label='Camera Count' value={SceneDetails.CountCamera} padding={10} paddingString='1px 10px' />
                <ReadOnlyRow label='Light Count' value={SceneDetails.CountLight} padding={10} paddingString='1px 10px' />
                <ReadOnlyRow label='Model Count' value={SceneDetails.CountModel} padding={10} paddingString='1px 10px' />
                <ReadOnlyRow label='Meta Count' value={SceneDetails.CountMeta} padding={10} paddingString='1px 10px' />
                <ReadOnlyRow label='Setup Count' value={SceneDetails.CountSetup} padding={10} paddingString='1px 10px' />
                <ReadOnlyRow
                    label='Tour Count'
                    value={SceneDetails.CountTour}
                    padding={10} paddingString='1px 10px'
                    containerStyle={{ borderBottomLeftRadius: '5px', borderBottomRightRadius: '5px', paddingBottom: '5px' }}
                />
            </Box>
        </Box>
    );
}

export default SceneDetails;
