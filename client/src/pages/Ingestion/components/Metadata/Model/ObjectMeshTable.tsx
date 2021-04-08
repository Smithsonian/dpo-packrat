import React from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ReadOnlyRow } from '../../../../../components';

const useStyles = makeStyles(({ palette }) => ({
    notRequiredFields: {
        display: 'flex',
        width: '50%',
        flexDirection: 'column',
        marginLeft: 30,
        borderRadius: 5,
        backgroundColor: palette.secondary.light,
        '& > *': {
            height: '20px',
            borderBottom: '0.5px solid #D8E5EE',
            borderTop: '0.5px solid #D8E5EE'
        }
    },
    materialFields: {
        display: 'flex',
        flexDirection: 'column',
        width: '50%'
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
                    <Box className={classes.ModelObjectContainer}>
                        <Box className={classes.materialFields} key={modelObject.idModelObject}>
                            {modelObject.ModelMaterials.map(materialType => {
                                return (
                                    <React.Fragment>
                                        <Box className={classes.unindentedFields} key={materialType.idModelMaterial}>
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
                            <ReadOnlyRow label='Point Count' value={modelObject.CountPoint} />
                            <ReadOnlyRow label='Face Count' value={modelObject.CountFace} />
                            <ReadOnlyRow label='Color Channel Count' value={modelObject.CountColorChannel} />
                            {console.log('modelobj', modelObject)}
                            {console.log('texturecoordinatechannelcount', modelObject.CountTextureCoorinateChannel)}
                            <ReadOnlyRow label='Texture Coord Channel Count' value={modelObject.CountTextureCoorinateChannel} />
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

                            {/* <ReadOnlyRow label='P1Y' value={modelObject.BoundingBoxP1Y} />
                            <ReadOnlyRow label='P1Z' value={modelObject.BoundingBoxP1Z} />
                            <ReadOnlyRow label='P2X' value={modelObject.BoundingBoxP2X} />
                            <ReadOnlyRow label='P2Y' value={modelObject.BoundingBoxP2Y} />
                            <ReadOnlyRow label='P2Z' value={modelObject.BoundingBoxP2Z} /> */}
                        </Box>
                    </Box>
                );
            })}
        </React.Fragment>
    );
}

export default ObjectMeshTable;
