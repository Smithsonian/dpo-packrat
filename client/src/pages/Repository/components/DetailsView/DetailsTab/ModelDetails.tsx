/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable  react/jsx-max-props-per-line */

/**
 * ModelDetails
 *
 * This component renders details tab for Model specific details used in DetailsTab component.
 */
import { Typography, Box, makeStyles, Select, MenuItem, fade } from '@material-ui/core';
import React, { useEffect } from 'react';
import { DateInputField, Loader, ReadOnlyRow, IndentedReadOnlyRow } from '../../../../../components';
import { useVocabularyStore, useDetailTabStore } from '../../../../../store';
import { eVocabularySetID, eSystemObjectType } from '@dpo-packrat/common';
import { extractModelConstellation } from '../../../../../constants/helperfunctions';
import ObjectMeshTable from './../../../../Ingestion/components/Metadata/Model/ObjectMeshTable';
import { DetailComponentProps } from './index';
import { useStyles as useSelectStyles, SelectFieldProps } from '../../../../../components/controls/SelectField';
import { DebounceInput } from 'react-debounce-input';

export const useStyles = makeStyles(({ palette, typography }) => ({
    value: {
        fontSize: '0.8em',
        color: palette.primary.dark
    },
    notRequiredFields: {
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 5,
        backgroundColor: palette.secondary.light,
        width: 'fit-content',
        height: 'fit-content',
        padding: '5px 5px'
    },
    dataEntry: {
        display: 'flex',
        flexDirection: 'column',
        width: 'fit-content',
        '& > *': {
            height: '20px',
            width: 'auto'
        },
        height: 'fit-content',
        backgroundColor: palette.secondary.light,
        paddingTop: '5px',
        paddingBottom: '5px'
    },
    ModelMetricsAndFormContainer: {
        borderRadius: 5,
        padding: 10,
        backgroundColor: palette.primary.light,
        width: 'calc(100% - 20px)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'start',
        flexWrap: 'wrap',
        columnGap: 10,
        rowGap: 10
    },
    caption: {
        flex: '1 1 0%',
        width: '100%',
        display: 'flex',
        marginBottom: '8px',
        flexDirection: 'row',
        color: 'grey',
        // color: '#2C405A'
    },
    objectMeshTableContainer: {
        display: 'flex',
        justifyContent: 'start',
        width: '100%',
        backgroundColor: palette.primary.light,
        '& > *': {
            width: 'calc(100% - 20px)'
        }
    },
    detailsContainer: {
        // display: 'flex',
        // flexDirection: 'column',
        // alignItems: 'center'
    },
    label: {
        color: 'auto'
    },
    input: {
        width: 'fit-content',
        border: `1px solid ${fade(palette.primary.contrastText, 0.4)}`,
        backgroundColor: palette.background.paper,
        padding: 9,
        borderRadius: 5,
        fontWeight: typography.fontWeightRegular,
        fontFamily: typography.fontFamily,
        fontSize: '0.8em',
        height: 3
    },
    readOnlyRowsContainer: {
        display: 'flex',
        flexDirection: 'column',
        // borderRadius: 5,
        backgroundColor: palette.secondary.light,
        width: '200px'
    },
    unindentedFields: {
        '& > :first-child': {
            minHeight: '20px',
            height: 'fit-content',
            borderBottom: '0.5px solid #D8E5EE',
            borderTop: '0.5px solid #D8E5EE'
        },
        width: '100%'
    },
    indentedFields: {
        '& > *': {
            minHeight: '20px',
            borderBottom: '0.5px solid #D8E5EE',
            borderTop: '0.5px solid #D8E5EE'
        }
    },
    boundingBox: {
        '& > *': {
            minHeight: '10px',
            padding: '3px 10px 3px 10px'
        },
        '& :not(:first-child)': {
            textIndent: '30px'
        }
    },
    materialFields: {
        display: 'flex',
        flexDirection: 'column',
        width: 'min(48%, 300px)',
        marginRight: '30px'
    },
    objectMeshTable: {
        display: 'flex',
        flexDirection: 'row',
        borderRadius: 5,
        paddingTop: 5,
        paddingLeft: 10,
        backgroundColor: palette.primary.light,
        width: 'auto'
    },
    ModelObjectContainer: {
        display: 'flex',
        width: '100%',
        marginBottom: '3%',
        justifyContent: 'start',
        paddingRight: 20
    },
}));

function ModelDetails(props: DetailComponentProps): React.ReactElement {
    const classes = useStyles();
    const { data, loading, onUpdateDetail, objectType, subtitle, onSubtitleUpdate } = props;

    const { ingestionModel, modelObjects } = extractModelConstellation(data?.getDetailsTabDataForObject?.Model);
    const [ModelDetails, updateDetailField] = useDetailTabStore(state => [state.ModelDetails, state.updateDetailField]);
    const [getEntries] = useVocabularyStore(state => [state.getEntries]);

    useEffect(() => {
        onUpdateDetail(objectType, ModelDetails);
    }, [ModelDetails]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const setDateField = (date: Date | string | null): void => {
        if (date) {
            const newDate = new Date(date);
            updateDetailField(eSystemObjectType.eModel, 'DateCreated', newDate);
        }
    };

    const setIdField = ({ target }): void => {
        const { name, value } = target;
        let idFieldValue: number | null = null;

        if (value) {
            idFieldValue = Number.parseInt(value, 10);
        }
        updateDetailField(eSystemObjectType.eModel, name, idFieldValue);
    };

    const readOnlyContainerProps: React.CSSProperties = {
        height: 26,
        alignItems: 'center'
    }

    return (
        <Box flex={1} className={classes.detailsContainer}>
            <Box className={classes.ModelMetricsAndFormContainer} mb={2}>
                    
                <Box display='flex' flexDirection='column' className={classes.dataEntry}>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px calc(100% - 120px)', gridColumnGap: 5, padding: '3px 10px 3px 10px' }}>
                        <div style={{ gridColumnStart: 1, gridColumnEnd: 2 }}>
                            <Typography className={classes.label} variant='caption'>
                                Subtitle
                            </Typography>
                        </div>
                        <div style={{ gridColumnStart: 2, gridColumnEnd: 3 }}>
                            <DebounceInput value={subtitle} onChange={onSubtitleUpdate} className={classes.input} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px calc(100% - 120px)', gridColumnGap: 5, padding: '3px 10px 3px 10px' }}>
                        <div style={{ gridColumnStart: 1, gridColumnEnd: 2 }}>
                            <Typography className={classes.label} variant='caption'>
                                Date Created
                            </Typography>
                        </div>
                        <div style={{ gridColumnStart: 2, gridColumnEnd: 3 }}>
                            <DateInputField value={ModelDetails.DateCreated} onChange={date => setDateField(date)} dateHeight='22px' />
                        </div>
                    </div>
                    <SelectField
                        required
                        label='Creation Method'
                        value={ModelDetails.idVCreationMethod}
                        name='idVCreationMethod'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eModelCreationMethod)}
                        selectHeight='24px'
                        valueLeftAligned
                        selectFitContent
                    />
                    <SelectField
                        required
                        label='Modality'
                        value={ModelDetails.idVModality}
                        name='idVModality'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eModelModality)}
                        selectHeight='24px'
                        valueLeftAligned
                        selectFitContent
                    />

                    <SelectField
                        required
                        label='Units'
                        value={ModelDetails.idVUnits}
                        name='idVUnits'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eModelUnits)}
                        selectHeight='24px'
                        valueLeftAligned
                        selectFitContent
                    />

                    <SelectField
                        required
                        label='Purpose'
                        value={ModelDetails.idVPurpose}
                        name='idVPurpose'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eModelPurpose)}
                        selectHeight='24px'
                        valueLeftAligned
                        selectFitContent
                    />

                    <SelectField
                        required
                        label='Model File Type'
                        value={ModelDetails.idVFileType}
                        name='idVFileType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eModelFileType)}
                        selectHeight='24px'
                        valueLeftAligned
                        selectFitContent
                    />
                </Box>

                <Box className={classes.notRequiredFields}>
                    <Box className={classes.caption}>
                        <Typography variant='caption'>Model</Typography>
                    </Box>
                    <Box className={classes.readOnlyRowsContainer}>
                        <ReadOnlyRow label='Vertex Count' value={ingestionModel?.CountVertices} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Face Count' value={ingestionModel?.CountFaces} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Triangle Count' value={ingestionModel?.CountTriangles} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Animation Count' value={ingestionModel?.CountAnimations} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Camera Count' value={ingestionModel?.CountCameras} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Light Count' value={ingestionModel?.CountLights} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Material Count' value={ingestionModel?.CountMaterials} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Mesh Count' value={ingestionModel?.CountMeshes} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Embedded Texture Count' value={ingestionModel?.CountEmbeddedTextures} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Linked Texture Count' value={ingestionModel?.CountLinkedTextures} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='File Encoding' value={ingestionModel?.FileEncoding} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Draco Compressed' value={ingestionModel?.IsDracoCompressed ? 'true' : 'false'} paddingString='0px' containerStyle={readOnlyContainerProps} />
                    </Box>
                </Box>

                {/* TODO */}
                <Box className={classes.notRequiredFields}>
                    <Box className={classes.caption}>
                        <Typography variant='caption'>Material</Typography>
                    </Box>
                    <Box className={classes.readOnlyRowsContainer}>
                        <ReadOnlyRow label='Vertex Count' value={ingestionModel?.CountVertices} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Face Count' value={ingestionModel?.CountFaces} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Triangle Count' value={ingestionModel?.CountTriangles} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Animation Count' value={ingestionModel?.CountAnimations} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Camera Count' value={ingestionModel?.CountCameras} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Light Count' value={ingestionModel?.CountLights} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Material Count' value={ingestionModel?.CountMaterials} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Mesh Count' value={ingestionModel?.CountMeshes} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Embedded Texture Count' value={ingestionModel?.CountEmbeddedTextures} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Linked Texture Count' value={ingestionModel?.CountLinkedTextures} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='File Encoding' value={ingestionModel?.FileEncoding} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Draco Compressed' value={ingestionModel?.IsDracoCompressed ? 'true' : 'false'} paddingString='0px' containerStyle={readOnlyContainerProps} />
                    </Box>
                </Box>

                {/* TODO */}
                <Box className={classes.notRequiredFields}>
                    <Box className={classes.caption}>
                        <Typography variant='caption'>Mesh</Typography>
                    </Box>
                    <Box className={classes.readOnlyRowsContainer}>
                        <ReadOnlyRow label='Vertex Count' value={ingestionModel?.CountVertices} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Face Count' value={ingestionModel?.CountFaces} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Triangle Count' value={ingestionModel?.CountTriangles} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Animation Count' value={ingestionModel?.CountAnimations} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Camera Count' value={ingestionModel?.CountCameras} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Light Count' value={ingestionModel?.CountLights} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Material Count' value={ingestionModel?.CountMaterials} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Mesh Count' value={ingestionModel?.CountMeshes} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Embedded Texture Count' value={ingestionModel?.CountEmbeddedTextures} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Linked Texture Count' value={ingestionModel?.CountLinkedTextures} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='File Encoding' value={ingestionModel?.FileEncoding} paddingString='0px' containerStyle={readOnlyContainerProps} />
                        <ReadOnlyRow label='Draco Compressed' value={ingestionModel?.IsDracoCompressed ? 'true' : 'false'} paddingString='0px' containerStyle={readOnlyContainerProps} />
                    </Box>
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
                                                <ReadOnlyRow label='Material Name' value={materialType.Name} paddingString='3px 10px' />
                                                {materialType.ModelMaterialChannel.map(channel => {
                                                    return (
                                                        <Box className={classes.unindentedFields} key={channel.idModelMaterialChannel}>
                                                            <ReadOnlyRow label='Type' value={channel.Type} paddingString='3px 10px' />
                                                            <Box className={classes.indentedFields}>
                                                                <IndentedReadOnlyRow label='Source' value={channel.Source} indentation={1} padding='3px 10px' />
                                                                <IndentedReadOnlyRow label='Value' value={channel.Value} indentation={1} padding='3px 10px' />
                                                                <IndentedReadOnlyRow label='Additional' value={channel.AdditionalAttributes} indentation={1} padding='3px 10px' />
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
                                <ReadOnlyRow label='Vertex Count' value={modelObject.CountVertices} paddingString='3px 10px' />
                                <ReadOnlyRow label='Face Count' value={modelObject.CountFaces} paddingString='3px 10px' />
                                <ReadOnlyRow label='Triangle Count' value={modelObject.CountTriangles} paddingString='3px 10px' />
                                <ReadOnlyRow label='Color Channel Count' value={modelObject.CountColorChannels} paddingString='3px 10px' />
                                <ReadOnlyRow label='Texture Coord Channel Count' value={modelObject.CountTextureCoordinateChannels} paddingString='3px 10px' />
                                <ReadOnlyRow label='Has Bones?' value={interpretTrinary(modelObject.HasBones)} paddingString='3px 10px' />
                                <ReadOnlyRow label='Has Face Normals?' value={interpretTrinary(modelObject.HasFaceNormals)} paddingString='3px 10px' />
                                <ReadOnlyRow label='Has Tangents?' value={interpretTrinary(modelObject.HasTangents)} paddingString='3px 10px' />
                                <ReadOnlyRow label='Has Texture Coordinates?' value={interpretTrinary(modelObject.HasTextureCoordinates)} paddingString='3px 10px' />
                                <ReadOnlyRow label='Has Vertex Normals?' value={interpretTrinary(modelObject.HasVertextNormals)} paddingString='3px 10px' />
                                <ReadOnlyRow label='Has Vertex Color?' value={interpretTrinary(modelObject.HasVertexColor)} paddingString='3px 10px' />
                                <ReadOnlyRow label='Manifold (Closed)?' value={interpretTrinary(modelObject.IsTwoManifoldUnbounded)} paddingString='3px 10px' />
                                <ReadOnlyRow label='Manifold (Open)?' value={interpretTrinary(modelObject.IsTwoManifoldBounded)} paddingString='3px 10px' />
                                <ReadOnlyRow label='Is Watertight?' value={interpretTrinary(modelObject.IsWatertight)} paddingString='3px 10px' />
                                <ReadOnlyRow label='Self Intersecting?' value={interpretTrinary(modelObject.SelfIntersecting)} paddingString='3px 10px' />
                                <Box className={classes.boundingBox}>
                                    <ReadOnlyRow label='Bounding Box' />
                                    <ReadOnlyRow
                                        label='Min'
                                        value={`(${roundToTwoPlaces(modelObject.BoundingBoxP1X)}, ${roundToTwoPlaces(modelObject.BoundingBoxP1Y)}, ${roundToTwoPlaces(
                                            modelObject.BoundingBoxP1Z
                                        )})`}
                                        paddingString='3px 10px 3px 10px'
                                    />
                                    <ReadOnlyRow
                                        label='Max'
                                        value={`(${roundToTwoPlaces(modelObject.BoundingBoxP2X)}, ${roundToTwoPlaces(modelObject.BoundingBoxP2Y)}, ${roundToTwoPlaces(
                                            modelObject.BoundingBoxP2Z
                                        )})`}
                                        paddingString='3px 10px 3px 10px'
                                    />
                                </Box>
                            </Box>
                        </Box>
                    );
                })}
            </Box>

            </Box>



            
            <Box className={classes.objectMeshTableContainer}>
                <ObjectMeshTable modelObjects={modelObjects} />
            </Box>
        </Box>
    );
}

export default ModelDetails;


function SelectField(props: SelectFieldProps): React.ReactElement {
    const { value, name, options, onChange, disabled = false, label } = props;
    const classes = useSelectStyles(props);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '120px calc(100% - 120px)', gridColumnGap: 5, padding: '3px 10px 3px 10px' }}>
            <div style={{ gridColumnStart: 1, gridColumnEnd: 2 }}>
                <Typography style={{ color: 'auto' }} variant='caption'>
                    {label}
                </Typography>
            </div>
            <Select value={value || ''} className={classes.select} name={name} onChange={onChange} disabled={disabled} disableUnderline inputProps={{ 'title': `${name} select`, style: { width: '100%' } }} style={{ minWidth: '100%', width: 'fit-content' }} SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}>
                {options.map(({ idVocabulary, Term }, index) => (
                    <MenuItem key={index} value={idVocabulary}>
                        {Term}
                    </MenuItem>
                ))}
            </Select>
        </div>
    );
}

function roundToTwoPlaces(num) {
    return Math.ceil(num * 100) / 100;
}

function interpretTrinary(truthyOrNull: boolean | null) {
    if (truthyOrNull === null) return 'Unknown';
    if (truthyOrNull === false) return 'No';
    return 'Yes';
}