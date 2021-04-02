import React from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ReadOnlyRow } from '../../../../../components';
import BoundingBoxInput from './BoundingBoxInput';

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
        },
        '& > :last-child': {
            height: 'auto',
            width: 'auto'
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
    }
}));

// interface ObjectMesh {
//     // materialTypes: MaterialInfo[];
//     pointCount: number;
//     faceCount: number;
//     colorChannelCount: number;
//     textureCoordChannelCount: number;
//     hasBones: boolean;
//     hasFaceNormals: boolean;
//     hasTangents: boolean;
//     hasTextureCoordinates: boolean;
//     hasVertexNormals: boolean;
//     hasVertexColor: boolean;
//     manifoldClosed: boolean;
//     manifoldOpen: boolean;
//     isWatertight: boolean;
//     selfIntersecting: boolean;
//     boundingValues: number[];
// }

// interface MaterialInfo {
//     materialName: string;
//     type: MaterialType[];
// }

// interface MaterialType {
//     typeName: string;
//     source: string;
//     value: string;
//     additional: string;
// }

function interpretTrinary(truthyOrNull: boolean | null) {
    if (truthyOrNull === null) return 'Unknown';
    if (truthyOrNull === false) return 'No';
    return 'Yes';
}

function ObjectMeshTable({ material }): React.ReactElement {
    const classes = useStyles();

    return (
        <React.Fragment>
            <Box className={classes.materialFields}>
                {material.materialTypes.map(materialType => {
                    return (
                        <React.Fragment>
                            <Box className={classes.unindentedFields}>
                                <ReadOnlyRow label='Material Name' value={materialType.materialName} />
                                {materialType.type.map(t => {
                                    return (
                                        <Box className={classes.indentedFields}>
                                            <ReadOnlyRow label='Type' value={t.typeName} />
                                            <Box className={classes.nestedIndentedFields}>
                                                <ReadOnlyRow label='Source' value={t.source} />
                                                <ReadOnlyRow label='Value' value={t.value} />
                                                <ReadOnlyRow label='Additional' value={t.additional} />
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
                <ReadOnlyRow label='Point Count' value={material.pointCount || 0} />
                <ReadOnlyRow label='Face Count' value={material.faceCount || 0} />
                <ReadOnlyRow label='Color Channel Count' value={material.pointCount || 0} />
                <ReadOnlyRow label='Texture Coord Channel Count' value={material.textureCoordChannelCount || 0} />
                <ReadOnlyRow label='Has Bones?' value={interpretTrinary(material.hasBones)} />
                <ReadOnlyRow label='Has Face Normals?' value={interpretTrinary(material.hasFaceNormals)} />
                <ReadOnlyRow label='Has Tangents?' value={interpretTrinary(material.hasTangents)} />
                <ReadOnlyRow label='Has Texture Coordinates?' value={interpretTrinary(material.hasTextureCoordinates)} />
                <ReadOnlyRow label='Has Vertex Normals?' value={interpretTrinary(material.hasVertexNormals)} />
                <ReadOnlyRow label='Has Vertex Color?' value={interpretTrinary(material.hasVertexColor)} />
                <ReadOnlyRow label='Manifold (Closed)?' value={interpretTrinary(material.manifoldClosed)} />
                <ReadOnlyRow label='Manifold (Open)?' value={interpretTrinary(material.manifoldOpen)} />
                <ReadOnlyRow label='Is Watertight?' value={interpretTrinary(material.isWatertight)} />
                <ReadOnlyRow label='Self Intersecting?' value={interpretTrinary(material.selfIntersecting)} />
                <BoundingBoxInput
                    boundingBoxP1X={material.boundingValues[0]}
                    boundingBoxP1Y={material.boundingValues[1]}
                    boundingBoxP1Z={material.boundingValues[2]}
                    boundingBoxP2X={material.boundingValues[3]}
                    boundingBoxP2Y={material.boundingValues[4]}
                    boundingBoxP2Z={material.boundingValues[5]}
                    onChange={() => {}}
                    disabled
                />
            </Box>
        </React.Fragment>
    );
}

export default ObjectMeshTable;
