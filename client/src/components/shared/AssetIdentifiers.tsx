import { Box, Checkbox, Typography, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import lodash from 'lodash';
import React from 'react';
import { StateIdentifier, useVocabularyStore } from '../../store';
import { eVocabularySetID } from '../../types/server';
import FieldType from './FieldType';
import IdentifierList from './IdentifierList';

const useStyles = makeStyles(({ palette, spacing }) => ({
    assetIdentifier: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: 10
    },
    systemCreatedText: {
        marginLeft: spacing(2),
        fontStyle: 'italic',
        color: palette.primary.contrastText
    },
    addIdentifierButton: {
        height: 30,
        width: 80,
        fontSize: '0.8em',
        color: '#FFFFFF',
        backgroundColor: '#0079C4'
    }
}));

interface AssetIdentifiersProps {
    systemCreated: boolean;
    identifiers: StateIdentifier[];
    onSystemCreatedChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onAddIdentifer: (identifiers: StateIdentifier[]) => void;
    onUpdateIdentifer: (identifiers: StateIdentifier[]) => void;
    onRemoveIdentifer: (identifiers: StateIdentifier[]) => void;
}

function AssetIdentifiers(props: AssetIdentifiersProps): React.ReactElement {
    const { systemCreated, identifiers, onSystemCreatedChange, onAddIdentifer, onUpdateIdentifer, onRemoveIdentifer } = props;
    const classes = useStyles();
    const [getEntries, getInitialEntry] = useVocabularyStore(state => [state.getEntries, state.getInitialEntry]);

    const addIdentifer = (initialEntry: number | null) => {
        const newIdentifier: StateIdentifier = {
            id: identifiers.length + 1,
            identifier: '',
            identifierType: getInitialEntry(eVocabularySetID.eIdentifierIdentifierType) || initialEntry,
            selected: false
        };

        const updatedIdentifiers = lodash.concat(identifiers, [newIdentifier]);
        onAddIdentifer(updatedIdentifiers);
    };

    const removeIdentifier = (id: number) => {
        const updatedIdentifiers = lodash.filter(identifiers, identifier => identifier.id !== id);
        onUpdateIdentifer(updatedIdentifiers);
    };

    const updateIdentifierFields = (id: number, name: string, value: string | number | boolean) => {
        const updatedIdentifiers = identifiers.map(identifier => {
            if (identifier.id === id) {
                return {
                    ...identifier,
                    [name]: value
                };
            }
            return identifier;
        });
        onRemoveIdentifer(updatedIdentifiers);
    };

    return (
        <Box marginBottom='10px'>
            <FieldType required label='Asset Identifier(s)'>
                <Box display='flex' justifyContent='space-between'>
                    <Box className={classes.assetIdentifier}>
                        <Checkbox name='systemCreated' checked={systemCreated} color='primary' onChange={onSystemCreatedChange} />
                        <Typography className={classes.systemCreatedText} variant='body1'>
                            System will create an identifier
                        </Typography>
                    </Box>
                    {!identifiers.length && (
                        <Button
                            className={classes.addIdentifierButton}
                            variant='contained'
                            onClick={() => {
                                addIdentifer(getEntries(eVocabularySetID.eIdentifierIdentifierType)[0].idVocabulary);
                            }}
                        >
                            Add
                        </Button>
                    )}
                </Box>

                <IdentifierList
                    identifiers={identifiers}
                    identifierTypes={getEntries(eVocabularySetID.eIdentifierIdentifierType)}
                    onAdd={addIdentifer}
                    onRemove={removeIdentifier}
                    onUpdate={updateIdentifierFields}
                />
            </FieldType>
        </Box>
    );
}

export default AssetIdentifiers;
