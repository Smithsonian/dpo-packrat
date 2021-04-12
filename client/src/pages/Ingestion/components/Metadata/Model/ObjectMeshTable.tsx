/* eslint-disable react/jsx-key */
/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import React from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ReadOnlyRow } from '../../../../../components';

const useStyles = makeStyles(theme => ({
    notRequiredFields: {
        display: 'flex',
        width: '50%',
        flexDirection: 'column',
        marginLeft: 30,
        borderRadius: 5,
        backgroundColor: theme.palette.secondary.light,
        '& > *': {
            height: '20px',
            borderBottom: '0.5px solid #D8E5EE',
            borderTop: '0.5px solid #D8E5EE'
        },
        minWidth: '300px'
    },
    materialFields: {
        display: 'flex',
        flexDirection: 'column',
        width: 'auto'
    },
    unindentedFields: {
        '& > :first-child': {
            height: '20px',
            borderBottom: '0.5px solid #D8E5EE',
            borderTop: '0.5px solid #D8E5EE'
        }
    },
    indentedFields: {
        '& > :first-child': {
            height: '20px',
            borderBottom: '0.5px solid #D8E5EE',
            borderTop: '0.5px solid #D8E5EE'
        },
        '& > *': {
            textIndent: '30px'
        }
    },
    nestedIndentedFields: {
        '& > *': {
            height: '20px',
            textIndent: '60px',
            borderBottom: '0.5px solid #D8E5EE',
            borderTop: '0.5px solid #D8E5EE'
        }
    },
    ModelObjectContainer: {
        display: 'flex',
        width: 'auto',
        minWidth: '300px',
        marginBottom: '3%'
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
        <React.Fragment>
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
                                                    <Box className={classes.indentedFields} key={channel.idModelMaterialChannel}>
                                                        <ReadOnlyRow label='Type' value={channel.Type} />
                                                        <Box className={classes.nestedIndentedFields}>
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
                            <Box style={{ height: 'auto' }}>
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
        </React.Fragment>
    );
}

export default ObjectMeshTable;
