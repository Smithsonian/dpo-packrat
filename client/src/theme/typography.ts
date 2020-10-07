import { grey } from '@material-ui/core/colors';
import { Breakpoints } from '@material-ui/core/styles/createBreakpoints';
import { Overrides } from '@material-ui/core/styles/overrides';

function pxToRem(value: number): string {
    return `${value / 16}rem`;
}

// https://material-ui.com/customization/breakpoints/
function createTypographyOverrides(breakpoints: Breakpoints): Overrides {
    return {
        MuiTableCell: {
            root: {
                padding: '6px 10px',
                borderBottom: `0.5px solid ${grey[100]}`
            }
        },
        MuiTypography: {
            h4: {
                fontSize: pxToRem(36),
                [breakpoints.down('lg')]: {
                    fontSize: pxToRem(28)
                }
            },
            subtitle1: {
                fontSize: pxToRem(22),
                [breakpoints.down('lg')]: {
                    fontSize: pxToRem(18)
                }
            },
            subtitle2: {
                fontSize: pxToRem(22),
                [breakpoints.down('lg')]: {
                    fontSize: pxToRem(20)
                }
            },
            body1: {
                fontSize: pxToRem(16),
                [breakpoints.down('lg')]: {
                    fontSize: pxToRem(14)
                }
            },
            body2: {
                fontSize: pxToRem(18),
                [breakpoints.down('lg')]: {
                    fontSize: pxToRem(16)
                }
            },
            caption: {
                fontSize: pxToRem(14),
                [breakpoints.down('lg')]: {
                    fontSize: pxToRem(12)
                }
            }
        }
    };
}

export { createTypographyOverrides };
