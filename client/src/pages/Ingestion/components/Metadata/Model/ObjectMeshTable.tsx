/* eslint-disable react/jsx-key */
/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import React from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ReadOnlyRow, IndentedReadOnlyRow } from '../../../../../components';
import { toFixed } from '../../../../../constants/helperfunctions';

const useStyles = makeStyles(({ palette }) => ({
    materialFields: {
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 5,
        backgroundColor: palette.secondary.light,
        width: 'fit-content',
        height: 'fit-content',
        padding: '5px',
        outline: '1px solid rgba(141, 171, 196, 0.4)',
        marginRight: '1rem'
    },
    caption: {
        flex: '1 1 0%',
        width: '100%',
        display: 'flex',
        marginBottom: '8px',
        flexDirection: 'row',
        color: 'grey',
    },
    boundingBox: {
        '& > *': {
            minHeight: '10px'
        },
        '& :not(:first-child)': {
            textIndent: '30px'
        },
    },
    unindentedFields: {
        '& > :first-child': {
            minHeight: '20px',
            height: 'fit-content'
        },
        width: '100%'
    },
    indentedFields: {
        '& > *': {
            minHeight: '20px'
        }
    },
    notRequiredFields: {
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 5,
        backgroundColor: palette.secondary.light,
        width: 'fit-content',
        height: 'fit-content',
        padding: '5px',
        outline: '1px solid rgba(141, 171, 196, 0.4)'
    },
}));

function roundToTwoPlaces(num) {
    return Math.ceil(num * 100) / 100;
}

function parseAndRoundValues(val: string): string {
    if (!val.length) return val;

    const values = val.split(', ').map(value => toFixed(value, 6));
    return values.join(', ');
}

function interpretTrinary(truthyOrNull: boolean | null) {
    if (truthyOrNull === null) return 'Unknown';
    if (truthyOrNull === false) return 'No';
    return 'Yes';
}

function ObjectMeshTable({ modelObjects }): React.ReactElement {
    const classes = useStyles();

    const readOnlyContainerProps: React.CSSProperties = {
        height: 26,
        alignItems: 'center',
        columnGap: 10,
        background: 0
    };
    const readOnlyContainerTitles: React.CSSProperties = {
        background: 0
    };
    return (
        <>
            {modelObjects.map(modelObject => {
                const materialNames: string[] = [];
                return (
                    <React.Fragment key={modelObject.idModelObject}>
                        {modelObject.ModelMaterials.map((materialType, index) => {
                            materialNames.push(materialType.Name);
                            return (
                                <Box className={classes.materialFields} key={materialType.Name + `.${index}`}>
                                    <Box className={classes.caption}>
                                        <Typography variant='caption'>Material &apos;{materialType.Name}&apos;</Typography>
                                    </Box>
                                    <Box className={classes.unindentedFields} style={{ width: 200 }}>
                                        {materialType.ModelMaterialChannel.map((channel, index) => {
                                            return (
                                                <Box className={classes.unindentedFields} key={channel.Value + `.${index}`}>
                                                    <ReadOnlyRow label='Type' value={channel.Type} paddingString='5px 0px 0px 0px' containerStyle={readOnlyContainerTitles} />
                                                    <Box className={classes.indentedFields}>
                                                        <IndentedReadOnlyRow label='Source' value={channel.Source} indentation={1} padding='0px' />
                                                        <IndentedReadOnlyRow label='Value' value={parseAndRoundValues(channel.Value)} indentation={1} padding='0px' />
                                                        <IndentedReadOnlyRow label='Additional' value={channel.AdditionalAttributes} indentation={1} padding='0px' />
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            );
                        })}

                        <Box className={classes.notRequiredFields}>
                            <Box className={classes.caption}>
                                <Typography variant='caption'>Mesh</Typography>
                            </Box>
                            <ReadOnlyRow
                                label='Materials'
                                value={materialNames.length ? materialNames[0] : 'None'}
                                paddingString='0px'
                                containerStyle={readOnlyContainerProps}
                                valueProps={{ style: { fontWeight: 'bold' } }}
                            />
                            {materialNames.slice(1).map((materialName, index) => (
                                <ReadOnlyRow
                                    label=''
                                    value={materialName}
                                    key={materialName + `.${index}`}
                                    paddingString='0px'
                                    containerStyle={readOnlyContainerProps}
                                    valueProps={{ style: { fontWeight: 'bold' } }}
                                />
                            ))}
                            <ReadOnlyRow label='Vertex Count' value={modelObject.CountVertices} paddingString='0px' containerStyle={readOnlyContainerProps} />
                            <ReadOnlyRow label='Face Count' value={modelObject.CountFaces} paddingString='0px' containerStyle={readOnlyContainerProps} />
                            <ReadOnlyRow label='Triangle Count' value={modelObject.CountTriangles} paddingString='0px' containerStyle={readOnlyContainerProps} />
                            <ReadOnlyRow label='Color Channel Count' value={modelObject.CountColorChannels} paddingString='0px' containerStyle={readOnlyContainerProps} />
                            <ReadOnlyRow label='Texture Coord Channel Count' value={modelObject.CountTextureCoordinateChannels} paddingString='0px' containerStyle={readOnlyContainerProps} />
                            <ReadOnlyRow label='Has Bones?' value={interpretTrinary(modelObject.HasBones)} paddingString='0px' containerStyle={readOnlyContainerProps} />
                            <ReadOnlyRow label='Has Face Normals?' value={interpretTrinary(modelObject.HasFaceNormals)} paddingString='0px' containerStyle={readOnlyContainerProps} />
                            <ReadOnlyRow label='Has Tangents?' value={interpretTrinary(modelObject.HasTangents)} paddingString='0px' containerStyle={readOnlyContainerProps} />
                            <ReadOnlyRow label='Has Texture Coordinates?' value={interpretTrinary(modelObject.HasTextureCoordinates)} paddingString='0px' containerStyle={readOnlyContainerProps} />
                            <ReadOnlyRow label='Has Vertex Normals?' value={interpretTrinary(modelObject.HasVertextNormals)} paddingString='0px' containerStyle={readOnlyContainerProps} />
                            <ReadOnlyRow label='Has Vertex Color?' value={interpretTrinary(modelObject.HasVertexColor)} paddingString='0px' containerStyle={readOnlyContainerProps} />
                            <ReadOnlyRow label='Manifold (Closed)?' value={interpretTrinary(modelObject.IsTwoManifoldUnbounded)} paddingString='0px' containerStyle={readOnlyContainerProps} />
                            <ReadOnlyRow label='Manifold (Open)?' value={interpretTrinary(modelObject.IsTwoManifoldBounded)} paddingString='0px' containerStyle={readOnlyContainerProps} />
                            <ReadOnlyRow label='Is Watertight?' value={interpretTrinary(modelObject.IsWatertight)} paddingString='0px' containerStyle={readOnlyContainerProps} />
                            <ReadOnlyRow label='Self Intersecting?' value={interpretTrinary(modelObject.SelfIntersecting)} paddingString='0px' containerStyle={readOnlyContainerProps} />
                            <Box className={classes.boundingBox}>
                                <ReadOnlyRow label='Bounding Box' paddingString='0px' containerStyle={readOnlyContainerTitles} />
                                <ReadOnlyRow
                                    label='Min'
                                    value={`(${roundToTwoPlaces(modelObject.BoundingBoxP1X)}, ${roundToTwoPlaces(modelObject.BoundingBoxP1Y)}, ${roundToTwoPlaces(
                                        modelObject.BoundingBoxP1Z
                                    )})`}
                                    paddingString='0px'
                                    containerStyle={readOnlyContainerProps}
                                />
                                <ReadOnlyRow
                                    label='Max'
                                    value={`(${roundToTwoPlaces(modelObject.BoundingBoxP2X)}, ${roundToTwoPlaces(modelObject.BoundingBoxP2Y)}, ${roundToTwoPlaces(
                                        modelObject.BoundingBoxP2Z
                                    )})`}
                                    paddingString='0px'
                                    containerStyle={readOnlyContainerProps}
                                />
                            </Box>
                        </Box>
                    </React.Fragment>
                );
            })}
        </>
    );
}

export default ObjectMeshTable;
