/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/jsx-max-props-per-line */
/**
 * Metadata - Attachment
 *
 * This component is a reusable form control component
 * that creates a dynamic list of additional inputs
 * used for attachments in ingestion
 */

import React from 'react';
import { Box, Checkbox } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { InputField, FieldType } from '../../../../components';

const useStyles = makeStyles(() => ({
    container: {
        marginBottom: 10,
        '& > *': {
            width: 'fit-content',
            minWidth: '300px',
            height: '20px',
            '&:not(:last-child)': {
                borderBottom: '1px solid #D8E5EE'
            }
        }
    }
}));

export interface metadataRow {
    name: string;
    label: string;
    type: 'string' | 'boolean';
}

interface AttachmentMetadataProps {
    metadatas: metadataRow[];
    metadataState: { [name: string]: boolean | string | undefined | null };
    setNameField: ({ target }: { target: any }) => void;
    setCheckboxField: ({ target }: { target: any }) => void;
}


function AttachmentMetadataForm(props: AttachmentMetadataProps): React.ReactElement {
    const { metadatas, metadataState, setNameField, setCheckboxField } = props;
    const classes = useStyles();
    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between' };

    const rows = metadatas.map(({ type, label, name }) => {
        if (type === 'boolean') {
            return (
                <FieldType key={name} required label={label} direction='row' containerProps={rowFieldProps}>
                    <Checkbox name={name} checked={metadataState[name] as boolean} color='primary' onChange={setCheckboxField} />
                </FieldType>
            );
        } else {
            return (
                <InputField key={name} required type='string' label={label} value={metadataState[name] as string} name={name} onChange={setNameField} />
            );
        }
    });

    return (
        <Box display='flex' flexDirection='column' className={classes.container}>
            {rows}
        </Box>
    );
}

export default AttachmentMetadataForm;
