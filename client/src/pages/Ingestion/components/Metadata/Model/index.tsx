/**
 * Metadata - Model
 *
 * This component renders the metadata fields specific to model asset.
 */
import DateFnsUtils from '@date-io/date-fns';
import { Box, Checkbox } from '@material-ui/core';
import { fade, makeStyles } from '@material-ui/core/styles';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import React from 'react';
import { AssetIdentifiers, FieldType, IdInputField, SelectField } from '../../../../../components';
import { StateIdentifier, useMetadataStore, useVocabularyStore } from '../../../../../store';
import { Colors } from '../../../../../theme';
import { eVocabularySetID } from '../../../../../types/server';
import BoundingBoxInput from './BoundingBoxInput';

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    container: {
        marginTop: 20
    },
    date: {
        width: '50%',
        background: palette.background.paper,
        border: `1px solid ${fade(palette.primary.contrastText, 0.4)}`,
        padding: '1px 8px',
        color: Colors.defaults.white,
        borderRadius: 5,
        marginTop: 0,
        fontFamily: typography.fontFamily,
        [breakpoints.down('lg')]: {
            minWidth: 160,
            maxWidth: 160,
            '& > div > input': {
                fontSize: '0.8em',
            }
        }
    }
}));

interface ModelProps {
    metadataIndex: number;
}

function Model(props: ModelProps): React.ReactElement {
    const { metadataIndex } = props;
    const classes = useStyles();
    const metadata = useMetadataStore(state => state.metadatas[metadataIndex]);
    const { model } = metadata;
    const updateModelField = useMetadataStore(state => state.updateModelField);
    const [getEntries, getInitialEntry] = useVocabularyStore(state => [state.getEntries, state.getInitialEntry]);

    const onIdentifersChange = (identifiers: StateIdentifier[]): void => {
        updateModelField(metadataIndex, 'identifiers', identifiers);
    };

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        updateModelField(metadataIndex, name, checked);
    };

    const setIdField = ({ target }): void => {
        const { name, value } = target;
        let idFieldValue: number | null = null;

        if (value) {
            idFieldValue = Number.parseInt(value, 10);
        }

        updateModelField(metadataIndex, name, idFieldValue);
    };


    const setDateField = (name: string, value?: string | null): void => {
        if (value) {
            const date = new Date(value);
            updateModelField(metadataIndex, name, date);
        }
    };

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between' };

    return (
        <Box className={classes.container}>
            <AssetIdentifiers
                systemCreated={model.systemCreated}
                identifiers={model.identifiers}
                onSystemCreatedChange={setCheckboxField}
                onAddIdentifer={onIdentifersChange}
                onUpdateIdentifer={onIdentifersChange}
                onRemoveIdentifer={onIdentifersChange}
            />
            <Box display='flex' flexDirection='row' mt={1}>
                <Box display='flex' flex={1} flexDirection='column'>
                    <FieldType
                        // TODO: KARAN: add error fields
                        error={false}
                        required
                        label='Date Captured'
                        direction='row'
                        containerProps={rowFieldProps}
                    >
                        <MuiPickersUtilsProvider utils={DateFnsUtils}>
                            <KeyboardDatePicker
                                disableToolbar
                                variant='inline'
                                format='MM/dd/yyyy'
                                margin='normal'
                                value={model.dateCaptured}
                                className={classes.date}
                                InputProps={{ disableUnderline: true }}
                                onChange={(_, value) => setDateField('dateCaptured', value)}
                            />
                        </MuiPickersUtilsProvider>
                    </FieldType>

                    <SelectField
                        required
                        label='Creation Method'
                        value={model.creationMethod || getInitialEntry(eVocabularySetID.eModelCreationMethod)}
                        name='creationMethod'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eModelCreationMethod)}
                    />

                    <FieldType required label='Master' direction='row' containerProps={rowFieldProps}>
                        <Checkbox
                            name='masterModel'
                            checked={model.masterModel}
                            color='primary'
                            onChange={setCheckboxField}
                        />
                    </FieldType>

                    <FieldType required label='Authoritative' direction='row' containerProps={rowFieldProps}>
                        <Checkbox
                            name='authoritativeModel'
                            checked={model.authoritativeModel}
                            color='primary'
                            onChange={setCheckboxField}
                        />
                    </FieldType>

                    <SelectField
                        required
                        label='Modality'
                        value={model.modality || getInitialEntry(eVocabularySetID.eModelModality)}
                        name='modality'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eModelModality)}
                    />

                    <SelectField
                        required
                        label='Units'
                        value={model.units || getInitialEntry(eVocabularySetID.eModelUnits)}
                        name='units'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eModelUnits)}
                    />

                    <SelectField
                        required
                        label='Purpose'
                        value={model.purpose || getInitialEntry(eVocabularySetID.eModelPurpose)}
                        name='purpose'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eModelPurpose)}
                    />

                    <SelectField
                        required
                        label='Model File Type'
                        value={model.modelFileType || getInitialEntry(eVocabularySetID.eModelGeometryFileModelFileType)}
                        name='modelFileType'
                        onChange={setIdField}
                        options={getEntries(eVocabularySetID.eModelGeometryFileModelFileType)}
                    />
                </Box>
                <Box display='flex' flex={1} flexDirection='column' ml='30px'>
                    <IdInputField label='Roughness' value={model.roughness} name='roughness' onChange={setIdField} />
                    <IdInputField label='Metalness' value={model.metalness} name='metalness' onChange={setIdField} />
                    <IdInputField label='Point Count' value={model.pointCount} name='pointCount' onChange={setIdField} />
                    <IdInputField label='Face Count' value={model.faceCount} name='faceCount' onChange={setIdField} />

                    <FieldType required={false} label='Is Watertight?' direction='row' containerProps={rowFieldProps}>
                        <Checkbox
                            name='isWatertight'
                            checked={model.isWatertight}
                            color='primary'
                            onChange={setCheckboxField}
                        />
                    </FieldType>

                    <FieldType required={false} label='Has Normals?' direction='row' containerProps={rowFieldProps}>
                        <Checkbox
                            name='hasNormals'
                            checked={model.hasNormals}
                            color='primary'
                            onChange={setCheckboxField}
                        />
                    </FieldType>


                    <FieldType required={false} label='Has Vertex Color?' direction='row' containerProps={rowFieldProps}>
                        <Checkbox
                            name='hasVertexColor'
                            checked={model.hasVertexColor}
                            color='primary'
                            onChange={setCheckboxField}
                        />
                    </FieldType>

                    <FieldType required={false} label='Has UV Space?' direction='row' containerProps={rowFieldProps}>
                        <Checkbox
                            name='hasUVSpace'
                            checked={model.hasUVSpace}
                            color='primary'
                            onChange={setCheckboxField}
                        />
                    </FieldType>

                    <BoundingBoxInput model={model} onChange={setIdField} />
                </Box>

            </Box>
        </Box>
    );
}

export default Model;