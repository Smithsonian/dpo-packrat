/* eslint-disable react-hooks/exhaustive-deps */
/**
 * SceneDetails
 *
 * This component renders details tab for Scene specific details used in DetailsTab component.
 */
import { Box, makeStyles, Typography } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { CheckboxField, FieldType, Loader } from '../../../../../components';
import { SceneDetailFields } from '../../../../../types/graphql';
import { isFieldUpdated } from '../../../../../utils/repository';
import { DetailComponentProps } from './index';

export const useStyles = makeStyles(({ palette }) => ({
    value: {
        fontSize: '0.8em',
        color: palette.primary.dark
    }
}));

function SceneDetails(props: DetailComponentProps): React.ReactElement {
    const classes = useStyles();
    const { data, loading, onUpdateDetail, objectType } = props;

    const [details, setDetails] = useState<SceneDetailFields>({
        Links: []
    });

    useEffect(() => {
        if (data && !loading) {
            const { Scene } = data.getDetailsTabDataForObject;
            setDetails({
                Links: Scene?.Links ?? [],
                AssetType: Scene?.AssetType,
                Tours: Scene?.Tours,
                Annotation: Scene?.Annotation,
                HasBeenQCd: Scene?.HasBeenQCd,
                IsOriented: Scene?.IsOriented,
            });
        }
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

    const sceneData = data.getDetailsTabDataForObject?.Scene;

    return (
        <Box>
            {details.Links.map((link: string, index: number) => (
                <FieldType
                    key={index}
                    required
                    label='Link'
                    direction='row'
                    containerProps={rowFieldProps}
                    width='auto'
                >
                    <Typography className={classes.value}>{link}</Typography>
                </FieldType>
            ))}

            <FieldType
                required
                label='Tours'
                direction='row'
                containerProps={rowFieldProps}
                width='auto'
            >
                <Typography className={classes.value}>{details.Tours}</Typography>
            </FieldType>
            <FieldType
                required
                label='Annotation'
                direction='row'
                containerProps={rowFieldProps}
                width='auto'
            >
                <Typography className={classes.value}>{details.Annotation}</Typography>
            </FieldType>

            <CheckboxField
                viewMode
                required
                updated={isFieldUpdated(details, sceneData, 'HasBeenQCd')}
                disabled
                name='HasBeenQCd'
                label='HasBeenQCd'
                value={details.HasBeenQCd ?? false}
                onChange={setCheckboxField}
            />

            <CheckboxField
                viewMode
                required
                updated={isFieldUpdated(details, sceneData, 'IsOriented')}
                disabled
                name='IsOriented'
                label='IsOriented'
                value={details.IsOriented ?? false}
                onChange={setCheckboxField}
            />
        </Box>
    );
}

export default SceneDetails;