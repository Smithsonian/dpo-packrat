/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * DateInputField
 *
 * This component renders id date input fields used in metadata components.
 */
import DateFnsUtils from '@date-io/date-fns';
import { fade, makeStyles } from '@material-ui/core/styles';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { MaterialUiPickersDate } from '@material-ui/pickers/typings/date';
import React from 'react';
import { Colors } from '../../theme';
import { ViewableProps } from '../../types/repository';

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    date: {
        width: '50%',
        background: palette.background.paper,
        border: (updated: boolean) => `1px solid ${fade(updated ? palette.secondary.main : palette.primary.contrastText, 0.4)}`,
        backgroundColor: (updated: boolean) => (updated ? palette.secondary.light : palette.background.paper),
        padding: '1px 8px',
        color: Colors.defaults.white,
        marginTop: 0,
        fontFamily: typography.fontFamily,
        [breakpoints.down('lg')]: {
            minWidth: 160,
            maxWidth: 160,
            '& > div > input': {
                fontSize: '0.8em'
            }
        },
        marginBottom: 0
    }
}));

interface DateInputFieldProps extends ViewableProps {
    value: Date | null | string;
    onChange: (date: MaterialUiPickersDate, value?: string | null | undefined) => void;
}

function DateInputField(props: DateInputFieldProps): React.ReactElement {
    const { value, onChange, disabled = false, updated = false } = props;
    const classes = useStyles(updated);

    return (
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDatePicker
                disabled={disabled}
                disableToolbar
                variant='inline'
                format='MM/dd/yyyy'
                margin='normal'
                value={value}
                className={classes.date}
                InputProps={{ disableUnderline: true }}
                onChange={onChange}
                autoOk
            />
        </MuiPickersUtilsProvider>
    );
}

export default DateInputField;
