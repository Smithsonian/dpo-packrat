/* eslint-disable react-hooks/exhaustive-deps */
/**
 * SceneDetails
 *
 * This component renders details tab for Scene specific details used in DetailsTab component.
 */
import { Box, makeStyles, Checkbox /*, Typography */ } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { Loader } from '../../../../../components';
import { GetSceneDocument } from '../../../../../types/graphql';
import { DetailComponentProps } from './index';
import { apolloClient } from '../../../../../graphql/index';
import ReferenceModels from '../../../../Ingestion/components/Metadata/Scene/ReferenceModels';
import { ReadOnlyRow, FieldType } from '../../../../../components/index';

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
    const [details, setDetails] = useState({
        Name: '',
        HasBeenQCd: false,
        IsOriented: false,
        CountScene: 0,
        CountNode: 0,
        CountCamera: 0,
        CountLight: 0,
        CountModel: 0,
        CountMeta: 0,
        CountSetup: 0,
        CountTour: 0,
        ModelSceneXref: [
            {
                BoundingBoxP1X: 0,
                BoundingBoxP1Y: 0,
                BoundingBoxP1Z: 0,
                BoundingBoxP2X: 0,
                BoundingBoxP2Y: 0,
                BoundingBoxP2Z: 0,
                FileSize: 0,
                Model: null,
                Name: '',
                Quality: '',
                UVResolution: 0,
                Usage: '',
                idModel: -1,
                idModelSceneXref: 0,
                idScene: 0
            }
        ]
    });

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
                setDetails(getScene?.Scene);
            }
        };
        retrieveSceneData();
    }, [data, loading]);

    useEffect(() => {
        onUpdateDetail(objectType, details);
    }, [details]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        setDetails(details => ({ ...details, [name]: checked }));
    };

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between', style: { borderRadius: 0 } };

    return (
        <Box>
            <ReferenceModels referenceModels={details.ModelSceneXref} />

            <Box display='flex' flexDirection='column' className={classes.container}>
                <FieldType required label="Has been QC'd" direction='row' containerProps={rowFieldProps}>
                    <Checkbox name='HasBeenQCd' checked={details.HasBeenQCd} color='primary' onChange={setCheckboxField} />
                </FieldType>

                <FieldType required label='Is Oriented' direction='row' containerProps={rowFieldProps}>
                    <Checkbox name='IsOriented' checked={details.IsOriented} color='primary' onChange={setCheckboxField} />
                </FieldType>
                <ReadOnlyRow label='Scene Count' value={details.CountScene} padding={15} />
                <ReadOnlyRow label='Node Count' value={details.CountNode} padding={15} />
                <ReadOnlyRow label='Camera Count' value={details.CountCamera} padding={15} />
                <ReadOnlyRow label='Light Count' value={details.CountLight} padding={15} />
                <ReadOnlyRow label='Model Count' value={details.CountModel} padding={15} />
                <ReadOnlyRow label='Meta Count' value={details.CountMeta} padding={15} />
                <ReadOnlyRow label='Setup Count' value={details.CountSetup} padding={15} />
                <ReadOnlyRow label='Tour Count' value={details.CountTour} padding={15} />
            </Box>
        </Box>
    );
}

export default SceneDetails;
