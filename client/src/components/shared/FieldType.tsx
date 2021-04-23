/**
 * FieldType
 *
 * This component wraps content and highlights it as required field or not.
 */
import { Box, BoxProps, PropTypes, Typography, TypographyProps, Tooltip } from '@material-ui/core';
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import Progress from './Progress';

const useStyles = makeStyles(({ palette, spacing }) => ({
    container: {
        display: 'flex',
        padding: 10,
        borderRadius: 5,
        width: ({ width }: FieldTypeProps) => width || '100%',
        marginTop: ({ marginTop }: FieldTypeProps) => spacing(marginTop || 0),
        backgroundColor: ({ required, error }: FieldTypeProps) => (error ? fade(palette.error.light, 0.3) : required ? palette.primary.light : palette.secondary.light)
    },
    label: {
        color: palette.primary.dark
    },
    loading: {
        position: 'absolute',
        top: 16,
        right: 10
    }
}));

interface FieldTypeProps {
    required: boolean;
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
    children?: React.ReactNode;
    labelTooltip?: string;
}

function FieldType(props: FieldTypeProps): React.ReactElement {
    const { label, renderLabel, children, align = 'left', direction, containerProps, labelProps, loading, labelTooltip } = props;
    const classes = useStyles(props);

    let content: React.ReactNode = (
        <Typography align={align} className={classes.label} variant='caption' {...labelProps}>
            {label}
        </Typography>
    );

    if (labelTooltip) {
        const tooltipContent = (
            <Tooltip title={labelTooltip}>
                <Typography align={align} className={classes.label} variant='caption' {...labelProps}>
                    {label}
                </Typography>
            </Tooltip>
        );
        content = tooltipContent;
    }

    if (renderLabel === false) {
        content = null;
    }

    return (
        <Box position='relative' className={classes.container} flexDirection={direction || 'column'} {...containerProps}>
            {content}
            {children}
            {loading && <Progress className={classes.loading} size={15} />}
        </Box>
    );
}

export default FieldType;
