/* eslint-disable react-hooks/exhaustive-deps */
/**
 * SceneDetails
 *
 * This component renders details tab for Scene specific details used in DetailsTab component.
 */
import { Box, makeStyles, Checkbox, Tooltip } from '@material-ui/core';
import React, { useEffect, useRef } from 'react';
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
        display: 'flex',
        flexDirection: 'column',
        marginBottom: 10,
        width: 'fit-content',
        '& > *': {
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

    const gridTemplateColumns = '200px 1fr';
    const rowFieldProps = { alignItems: 'center', alignContent: 'center', style: { borderRadius: 0, display: 'grid', gridTemplateColumns } };

    return (
        <Box>
            <ReferenceModels referenceModels={SceneDetails.ModelSceneXref} />

            <Box className={classes.container}>
                <FieldType
                    required
                    label='Approved for Publication'
                    direction='row'
                    width='100%'
                    containerProps={rowFieldProps}
                >
                    <Box width='fit-content' textAlign='right'>
                        <Checkbox name='ApprovedForPublication' checked={SceneDetails.ApprovedForPublication} color='primary' onChange={setCheckboxField} />
                    </Box>
                </FieldType>

                <FieldType
                    required
                    label="Posed and QC'd"
                    direction='row'
                    width='100%'
                    containerProps={rowFieldProps}
                >
                    <Tooltip placement='left' title='When checked, downloads will be generated if this scene has a master model as a parent, as well as every time the scene is re-posed.' arrow>
                        <Box width='fit-content' textAlign='right'>
                            <Checkbox name='PosedAndQCd' checked={SceneDetails.PosedAndQCd} color='primary' onChange={setCheckboxField} />
                        </Box>
                    </Tooltip>
                </FieldType>
                <ReadOnlyRow label='Publication Approver' value={SceneDetails.PublicationApprover} padding={15} gridTemplate={gridTemplateColumns} />
                <ReadOnlyRow label='EDAN UUID' value={SceneDetails.EdanUUID} padding={15} gridTemplate={gridTemplateColumns} />
                <ReadOnlyRow label='Scene Count' value={SceneDetails.CountScene} padding={15} gridTemplate={gridTemplateColumns} />
                <ReadOnlyRow label='Node Count' value={SceneDetails.CountNode} padding={15} gridTemplate={gridTemplateColumns} />
                <ReadOnlyRow label='Camera Count' value={SceneDetails.CountCamera} padding={15} gridTemplate={gridTemplateColumns} />
                <ReadOnlyRow label='Light Count' value={SceneDetails.CountLight} padding={15} gridTemplate={gridTemplateColumns} />
                <ReadOnlyRow label='Model Count' value={SceneDetails.CountModel} padding={15} gridTemplate={gridTemplateColumns} />
                <ReadOnlyRow label='Meta Count' value={SceneDetails.CountMeta} padding={15} gridTemplate={gridTemplateColumns} />
                <ReadOnlyRow label='Setup Count' value={SceneDetails.CountSetup} padding={15} gridTemplate={gridTemplateColumns} />
                <ReadOnlyRow label='Tour Count' value={SceneDetails.CountTour} padding={15} gridTemplate={gridTemplateColumns} />
            </Box>
        </Box>
    );
}

export default SceneDetails;
