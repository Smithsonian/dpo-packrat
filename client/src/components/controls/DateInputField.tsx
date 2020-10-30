/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * DateInputField
 *
 * This component renders id date input fields used in metadata components.
 */
import DateFnsUtils from '@date-io/date-fns';
import { fade, makeStyles } from '@material-ui/core/styles';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import React from 'react';
import { Colors } from '../../theme';

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
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

interface DateInputFieldProps {
    value: Date;
    onChange: any;
}

function DateInputField(props: DateInputFieldProps): React.ReactElement {
    const { value, onChange } = props;
    const classes = useStyles();

    return (
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDatePicker
                disableToolbar
                variant='inline'
                format='MM/dd/yyyy'
                margin='normal'
                value={value}
                className={classes.date}
                InputProps={{ disableUnderline: true }}
                onChange={onChange}
            />
        </MuiPickersUtilsProvider>
    );
}

export default DateInputField;