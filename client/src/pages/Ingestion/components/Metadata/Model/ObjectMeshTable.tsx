/* eslint-disable react/jsx-key */
/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import React from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ReadOnlyRow } from '../../../../../components';

const useStyles = makeStyles(theme => ({
    notRequiredFields: {
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 5,
        backgroundColor: theme.palette.secondary.light,
        '& > *': {
            minHeight: '20px',
            borderBottom: '0.5px solid #D8E5EE',
            borderTop: '0.5px solid #D8E5EE'
        },
        width: '350px'
    },
    materialFields: {
        display: 'flex',
        flexDirection: 'column',
        width: '350px',
        marginRight: '30px'
    },
    unindentedFields: {
        '& > :first-child': {
            minHeight: '20px',
            borderBottom: '0.5px solid #D8E5EE',
            borderTop: '0.5px solid #D8E5EE'
        }
    },
    indentedFields: {
        '& > *': {
            textIndent: '15px',
            minHeight: '20px',
            borderBottom: '0.5px solid #D8E5EE',
            borderTop: '0.5px solid #D8E5EE'
        }
    },
    ModelObjectContainer: {
        display: 'flex',
        width: '100%',
        marginBottom: '3%',
        justifyContent: 'space-around'
    },
    boundingBox: {
        '& > *': {
            height: '10px'
        },
        '& :not(:first-child)': {
            textIndent: '30px'
        }
    },
    objectMeshTable: {
        display: 'flex',
        flexDirection: 'row',
        borderRadius: 5,
        paddingTop: 5,
        backgroundColor: theme.palette.primary.light,
        width: 'auto'
    },
    ObjectMeshContainer: {
        borderRadius: 5,
        padding: 10,
        backgroundColor: theme.palette.primary.light,
        width: 'fit-content',
        display: 'flex',
        flexDirection: 'column'
    },
    captionContainer: {
        flex: '1 1 0%',
        width: '92%',
        display: 'flex',
        marginBottom: '8px',
        flexDirection: 'row',
        color: '#2C405A'
    }
}));

function roundToTwoPlaces(num) {
    return Math.ceil(num * 100) / 100;
}

function interpretTrinary(truthyOrNull: boolean | null) {
    if (truthyOrNull === null) return 'Unknown';
    if (truthyOrNull === false) return 'No';
    return 'Yes';
}

function ObjectMeshTable({ modelObjects }): React.ReactElement {
    const classes = useStyles();
    return (
        <Box className={classes.ObjectMeshContainer}>
            <Box className={classes.captionContainer}>
                <Typography variant='caption'>Material and Mesh</Typography>
            </Box>
            <Box className={classes.objectMeshTable}>
                {modelObjects.map(modelObject => {
                    return (
                        <Box className={classes.ModelObjectContainer} key={modelObject.idModelObject}>
                            <Box className={classes.materialFields}>
                                {modelObject.ModelMaterials.map(materialType => {
                                    return (
                                        <React.Fragment key={materialType.idModelMaterial}>
                                            <Box className={classes.unindentedFields}>
                                                <ReadOnlyRow label='Material Name' value={materialType.Name} />
                                                {materialType.ModelMaterialChannel.map(channel => {
                                                    return (
                                                        <Box className={classes.unindentedFields} key={channel.idModelMaterialChannel}>
                                                            <ReadOnlyRow label='Type' value={channel.Type} />
                                                            <Box className={classes.indentedFields}>
                                                                <ReadOnlyRow label='Source' value={channel.Source} />
                                                                <ReadOnlyRow label='Value' value={channel.Value} />
                                                                <ReadOnlyRow label='Additional' value={channel.AdditionalAttributes} />
                                                            </Box>
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                            <Box style={{ height: '20px' }} />
                                        </React.Fragment>
                                    );
                                })}
                            </Box>

                            <Box className={classes.notRequiredFields}>
                                <ReadOnlyRow label='Vertex Count' value={modelObject.CountVertices} />
                                <ReadOnlyRow label='Face Count' value={modelObject.CountFaces} />
                                <ReadOnlyRow label='Color Channel Count' value={modelObject.CountColorChannels} />
                                <ReadOnlyRow label='Texture Coord Channel Count' value={modelObject.CountTextureCoordinateChannels} />
                                <ReadOnlyRow label='Has Bones?' value={interpretTrinary(modelObject.HasBones)} />
                                <ReadOnlyRow label='Has Face Normals?' value={interpretTrinary(modelObject.HasFaceNormals)} />
                                <ReadOnlyRow label='Has Tangents?' value={interpretTrinary(modelObject.HasTangents)} />
                                <ReadOnlyRow label='Has Texture Coordinates?' value={interpretTrinary(modelObject.HasTextureCoordinates)} />
                                <ReadOnlyRow label='Has Vertex Normals?' value={interpretTrinary(modelObject.HasVertextNormals)} />
                                <ReadOnlyRow label='Has Vertex Color?' value={interpretTrinary(modelObject.HasVertexColor)} />
                                <ReadOnlyRow label='Manifold (Closed)?' value={interpretTrinary(modelObject.IsTwoManifoldUnbounded)} />
                                <ReadOnlyRow label='Manifold (Open)?' value={interpretTrinary(modelObject.IsTwoManifoldBounded)} />
                                <ReadOnlyRow label='Is Watertight?' value={interpretTrinary(modelObject.IsWatertight)} />
                                <ReadOnlyRow label='Self Intersecting?' value={interpretTrinary(modelObject.SelfIntersecting)} />
                                <Box className={classes.boundingBox}>
                                    <ReadOnlyRow label='Bounding Box' />
                                    <ReadOnlyRow
                                        label='Min'
                                        value={`(${roundToTwoPlaces(modelObject.BoundingBoxP1X)} , ${roundToTwoPlaces(modelObject.BoundingBoxP1Y)} , ${roundToTwoPlaces(
                                            modelObject.BoundingBoxP1Z
                                        )})`}
                                    />
                                    <ReadOnlyRow
                                        label='Max'
                                        value={`(${roundToTwoPlaces(modelObject.BoundingBoxP2X)} , ${roundToTwoPlaces(modelObject.BoundingBoxP2Y)} , ${roundToTwoPlaces(
                                            modelObject.BoundingBoxP2Z
                                        )})`}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}

export default ObjectMeshTable;
