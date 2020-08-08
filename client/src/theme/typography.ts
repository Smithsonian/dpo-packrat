import { Breakpoints } from '@material-ui/core/styles/createBreakpoints';
import { Overrides } from '@material-ui/core/styles/overrides';

function pxToRem(value: number): string {
    return `${value / 16}rem`;
}

// https://material-ui.com/customization/breakpoints/
function createTypographyOverrides(breakpoints: Breakpoints): Overrides {
    return {
        MuiTypography: {
            h4: {
                fontSize: pxToRem(36),
                [breakpoints.down('xs')]: {
                    fontSize: pxToRem(28)
                }
            },
            subtitle1: {
                fontSize: pxToRem(22),
                [breakpoints.down('xs')]: {
                    fontSize: pxToRem(18)
                }
            },
            subtitle2: {
                fontSize: pxToRem(22),
                [breakpoints.down('xs')]: {
                    fontSize: pxToRem(20)
                }
            },
            body1: {
                fontSize: pxToRem(16),
                [breakpoints.down('xs')]: {
                    fontSize: pxToRem(14)
                }
            },
            body2: {
                fontSize: pxToRem(18),
                [breakpoints.down('xs')]: {
                    fontSize: pxToRem(16)
                }
            },
            caption: {
                fontSize: pxToRem(14),
                [breakpoints.down('xs')]: {
                    fontSize: pxToRem(12)
                }
            }
        }
    };
}

export { createTypographyOverrides };
