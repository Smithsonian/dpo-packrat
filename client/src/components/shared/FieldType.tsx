/**
 * FieldType
 *
 * This component wraps content and highlights it as required field or not.
 */
import { Box, BoxProps, PropTypes, Typography, TypographyProps, Tooltip, Grid, GridSize } from '@material-ui/core';
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import Progress from './Progress';
import { HelpOutline } from '@material-ui/icons';
// import { HelpOutline } from '@material-ui/icons';

const useStyles = makeStyles(({ palette, spacing }) => ({
    container: {
        display: 'flex',
        // padding: ({ padding }: FieldTypeProps) => padding ? padding : '0px 10px',
        //borderRadius: 5,
        //border: `1px dashed #0086ff`,
        // width: ({ width }: FieldTypeProps) => width || '100%',
        marginTop: ({ marginTop }: FieldTypeProps) => spacing(marginTop || 0),
        backgroundColor: ({ required, error }: FieldTypeProps) => (error ? fade(palette.error.light, 0.3) : required ? '0' : palette.primary.light)
    },
    label: {
        color: palette.primary.dark
    },
    loading: {
        position: 'absolute',
        top: 16,
        right: 10
    },
    tooltip: {
        fontSize: '0.75rem',
        fontWeight: 'lighter'
    },
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
    valueLeftAligned?: boolean;
    gridLabel?: number;
    gridValue?: number;
    padding?: string;
    gridGap?: string;
}

function FieldType(props: FieldTypeProps): React.ReactElement {
    const { label, renderLabel, children, align = 'left', direction, containerProps, labelProps, loading, labelTooltip, valueLeftAligned, gridLabel, gridValue, gridGap } = props;
    const classes = useStyles(props);

    let content: React.ReactNode = (
        <>
            <Typography align={align} className={classes.label} variant='caption' {...labelProps}>
                {label}
            </Typography>
        </>
    );

    if (labelTooltip) {
        const tooltipContent = (
            <>
                <Typography align={align} className={classes.label} variant='caption' {...labelProps}>
                    {label}
                    <Tooltip
                        title={labelTooltip}
                        classes={{
                            tooltip: classes.tooltip,
                        }}
                    >
                        <HelpOutline style={{ alignSelf: 'center', cursor: 'pointer', verticalAlign: 'middle', padding: '0px 5px', paddingBottom: '3px', fontSize: '1rem' }} />
                    </Tooltip>
                </Typography>
            </>
        );
        content = tooltipContent;
    }

    if (renderLabel === false) {
        content = null;
    }

    let field: React.ReactElement = (
        <Box position='relative' className={classes.container} flexDirection={direction || 'column'} {...containerProps}>
            {content}
            {children}
            {loading && <Progress className={classes.loading} size={15} />}
        </Box>
    );


    if (valueLeftAligned) {
        field = (
            <Grid container className={classes.container} {...containerProps} style={{ columnGap: gridGap ?? '0px' }}>
                <Grid xs={gridLabel as GridSize ?? 3}>
                    {content}
                </Grid>
                <Grid>

                </Grid>
                <Grid xs={gridValue as GridSize ?? 7}>
                    {children}
                </Grid>
            </Grid>
        );
    }

    return field;
}

export default FieldType;
