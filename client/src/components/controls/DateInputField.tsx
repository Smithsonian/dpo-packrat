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
        background: palette.background.paper,
        border: ({ updated }: DateInputFieldProps) => `1px solid ${fade(updated ? palette.secondary.main : palette.primary.contrastText, 0.4)}`,
        backgroundColor: ({ updated }: DateInputFieldProps) => (updated ? palette.secondary.light : palette.background.paper),
        paddingLeft: '10px',
        paddingRight: '10px',
        color: Colors.defaults.white,
        marginTop: 0,
        fontFamily: typography.fontFamily,
        '& > div > input': {
            fontSize: '0.8rem',
        },
        [breakpoints.down('lg')]: {
            '& > div':  {
                width: '97px'
            }
        },
        [breakpoints.up('xl')]: {
            '& > div': {
                width: '114px'
            }
        },
        borderRadius: 5,
        marginBottom: 0,
        height: ({ dateHeight }: DateInputFieldProps) => dateHeight ? dateHeight : undefined,
        alignItems: 'baseline',
        '& .MuiSvgIcon-root': {
            height: 20,
            width: 20
        }
    }
}));

interface DateInputFieldProps extends ViewableProps {
    value: Date | null | string;
    onChange: (date: MaterialUiPickersDate, value?: string | null | undefined) => void;
    dateHeight?: string;
}

function DateInputField(props: DateInputFieldProps): React.ReactElement {
    const { value, onChange, disabled = false } = props;
    const classes = useStyles(props);

    return (
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDatePicker
                disabled={disabled}
                disableToolbar
                variant='inline'
                format='MM/dd/yyyy'
                value={value}
                className={classes.date}
                InputProps={{ disableUnderline: true, style: { height: '100%' } }}
                onChange={onChange}
                autoOk
                inputProps={{ style: { alignSelf: 'center' } }}
                KeyboardButtonProps={{ style: { padding: 0 }, size: 'small' }}
            />
        </MuiPickersUtilsProvider>
    );
}

export default DateInputField;
