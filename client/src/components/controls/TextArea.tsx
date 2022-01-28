/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * TextArea
 *
 * This component renders a textarea form control component.
 */
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { DebounceInput } from 'react-debounce-input';
import { ViewableProps } from '../../types/repository';
import FieldType from '../shared/FieldType';

const useStyles = makeStyles(({ palette, typography }) => ({
    description: {
        height: ({ height, rows }: TextAreaProps) => rows ? 'undefined' : height,
        width: '80%',
        padding: 10,
        resize: 'none',
        border: `${palette.primary.contrastText}, 0.4`,
        backgroundColor: palette.background.paper,
        borderRadius: 5,
        fontWeight: typography.fontWeightRegular,
        fontFamily: typography.fontFamily,
        fontSize: '0.8em'
    }
}));

interface TextAreaProps extends ViewableProps {
    label?: string;
    value?: number | string | null;
    name: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    error?: boolean;
    placeholder?: string;
    height?: string;
    rows?: string;
}

function TextArea(props: TextAreaProps): React.ReactElement {
    const { label, name, value, onChange, required = false, viewMode = false, disabled = false, placeholder, rows } = props;
    const classes = useStyles(props);

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between', style: { borderRadius: 0 } };
    return (
        (label ?
            <FieldType
                required={required}
                label={label ?? ''}
                direction='row'
                containerProps={rowFieldProps}
                width={viewMode ? 'auto' : undefined}
                padding='10px'
            >
                <DebounceInput
                    forceNotifyByEnter={false}
                    element={'textarea'}
                    disabled={disabled}
                    value={value || ''}
                    className={classes.description}
                    name={name}
                    onChange={onChange}
                    debounceTimeout={400}
                    placeholder={placeholder}
                    rows={rows}
                />
            </FieldType> :
            <DebounceInput
                forceNotifyByEnter={false}
                element={'textarea'}
                disabled={disabled}
                value={value || ''}
                className={classes.description}
                name={name}
                onChange={onChange}
                debounceTimeout={400}
                placeholder={placeholder}
                rows={rows}
            />
        )
    );
}

export default TextArea;