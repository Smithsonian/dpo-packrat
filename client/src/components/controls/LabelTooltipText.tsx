import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, TypographyProps, Tooltip, PropTypes } from '@material-ui/core';
import { HelpOutline } from '@material-ui/icons';

const useStyles = makeStyles(({ palette, spacing }) => ({
    container: {
        display: 'flex',
        padding: ({ padding }: LabelTooltipTextProps ) => padding ? padding : '0px 10px',
        //borderRadius: 5,
        //border: `1px dashed #0086ff`,
        width: ({ width }: LabelTooltipTextProps ) => width || '100%',
        marginTop: ({ marginTop }: LabelTooltipTextProps ) => spacing(marginTop || 0),
        //backgroundColor: ({ required, error }: LabelTooltipTextProps ) => (error ? fade(palette.error.light, 0.3) : required ? palette.primary.light : palette.secondary.light)
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

interface LabelTooltipTextProps {
    error?: boolean;
    label?: string;
    labelProps?: TypographyProps;
    labelTooltipTxt: string;
    marginTop?: number;
    padding?: string;
    renderLabel?: boolean;
    width?: string;
    align?: PropTypes.Alignment;
}

function LabelTooltipText(props: LabelTooltipTextProps): React.ReactElement {
    const { label, labelTooltipTxt, labelProps, renderLabel, align = 'left', } = props;
    const classes = useStyles(props);

    let content: React.ReactNode = (
        <>
            <Typography align={align} className={classes.label} variant='caption'>
                {label}
            </Typography>
        </>
    );

    if (labelTooltipTxt) {
        const tooltipContent = (
            <>
                <Typography align={align} className={classes.label} variant='caption' {...labelProps}>
                    {label}
                    <Tooltip title={labelTooltipTxt}>
                        <HelpOutline fontSize='small' style={{ alignSelf: 'center', cursor: 'pointer', verticalAlign: 'middle', padding: '20px 5px' }} />
                    </Tooltip>
                </Typography>
            </>
        );
        content = tooltipContent;
    }

    if (renderLabel === false) {
        content = null;
    }

    return <div> {content} </div>;
}

export default LabelTooltipText;