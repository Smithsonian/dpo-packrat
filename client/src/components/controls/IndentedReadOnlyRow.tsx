/**
 * IndentedReadOnlyRow
 *
 * This component is a replacement for ReadOnlyRow to allow indentation of the labels
 */
import { Box, BoxProps, PropTypes, Typography, TypographyProps } from '@material-ui/core';
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import Progress from '../shared/Progress';

const useStyles = makeStyles(({ palette, spacing }) => ({
    container: {
        display: 'grid',
        alignItems: 'center',
        gridTemplateColumns: ({ indentation }: IndentedReadOnlyRowProps) => indentation ? `${15*indentation}px 20% 15px 1fr` : '15px 20% 15px 1fr',
        padding: ({ padding }: IndentedReadOnlyRowProps) => padding ? padding : '0px 10px',
        borderRadius: 5,
        width: ({ width }: IndentedReadOnlyRowProps) => width || '100%',
        marginTop: ({ marginTop }: IndentedReadOnlyRowProps) => spacing(marginTop || 0),
        backgroundColor: ({ required, error }: IndentedReadOnlyRowProps) => (error ? fade(palette.error.light, 0.3) : required ? palette.primary.light : palette.secondary.light)
    },
    label: {
        color: 'auto',
        gridColumnStart: 2,
        gridColumnEnd: 3
    },
    loading: {
        position: 'absolute',
        top: 16,
        right: 10
    },
    value: {
        height: 'fit-content',
        justifySelf: 'end',
        gridColumnStart: -2,
        gridColumnEnd: -1,
        wordBreak: 'break-word'
    }
}));

interface IndentedReadOnlyRowProps {
    required?: boolean;
    renderLabel?: boolean;
    label?: string;
    width?: string;
    direction?: string;
    containerProps?: BoxProps;
    labelProps?: TypographyProps;
    align?: PropTypes.Alignment;
    marginTop?: number;
    error?: boolean;
    loading?: boolean;
    labelTooltip?: string;
    value: string | number | null;
    indentation?: number;
    padding?: string;
}

function IndentedReadOnlyRow(props: IndentedReadOnlyRowProps): React.ReactElement {
    const { label, renderLabel, align = 'left', direction, containerProps, labelProps, loading, value } = props;
    const classes = useStyles(props);

    let content: React.ReactNode = (
        <Typography align={align} variant='caption' {...labelProps}>
            {label}
        </Typography>
    );

    if (renderLabel === false) {
        content = null;
    }

    return (
        <Box position='relative' className={classes.container} flexDirection={direction || 'row'} {...containerProps}>
            <Box className={classes.label}>
                {content}
            </Box>
            <Box className={classes.value}>
                <Typography variant='caption' style={{ fontFamily: 'Roboto, Helvetical, Arial, sans-serif', color: '#2C405A', overflowWrap: 'break-word' }}>
                    {value}
                </Typography>
            </Box>
            {loading && <Progress className={classes.loading} size={15} />}
        </Box>
    );
}

export default IndentedReadOnlyRow;
