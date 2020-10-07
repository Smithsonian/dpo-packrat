import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { DebounceInput } from 'react-debounce-input';
import { FieldType } from '../../../../../components';

const useStyles = makeStyles(({ palette, typography }) => ({
    description: {
        height: '10vh',
        width: '80%',
        padding: 10,
        resize: 'none',
        overflow: 'scroll',
        border: `1px solid ${fade(palette.primary.contrastText, 0.4)}`,
        borderRadius: 5,
        fontFamily: typography.fontFamily
    }
}));

interface DescriptionProps {
    value: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function Description(props: DescriptionProps): React.ReactElement {
    const { value, onChange } = props;
    const classes = useStyles();

    const rowFieldProps = { alignItems: 'center', justifyContent: 'space-between' };

    return (
        <FieldType required label='Description' direction='row' containerProps={rowFieldProps}>
            <DebounceInput
                element='textarea'
                className={classes.description}
                name='description'
                value={value}
                onChange={onChange}
                forceNotifyByEnter={false}
                debounceTimeout={400}
            />
        </FieldType>
    );
}

export default Description;