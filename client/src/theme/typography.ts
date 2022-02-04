/**
 * Typography
 *
 * Material UI typography overrides for packrat client.
 * https://material-ui.com/customization/breakpoints
 */
import { grey } from '@material-ui/core/colors';
import { Overrides } from '@material-ui/core/styles/overrides';

function pxToRem(value: number): string {
    return `${value / 16}rem`;
}

function createOverrides(): Overrides {
    return {
        MuiTableCell: {
            root: {
                padding: '6px 10px',
                borderBottom: `0.5px solid ${grey[100]}`
            }
        },
        MuiTypography: {
            h4: {
                fontSize: pxToRem(28)
            },
            subtitle1: {
                fontSize: pxToRem(18)
            },
            subtitle2: {
                fontSize: pxToRem(20)
            },
            body1: {
                fontSize: pxToRem(14)
            },
            body2: {
                fontSize: pxToRem(16)
            },
            caption: {
                fontSize: pxToRem(12)
            }
        },
        MuiInputBase: {
            input: {
                '&:-webkit-autofill': {
                    animationDuration: '4s'
                },
                '&:focus': {
                    outline: '0.5px solid rgba(141, 171, 196, 0.4)',
                }
            }
        },
        MuiButtonBase: {
            root: {
                '&:focus': {
                    outline: '0.5px solid rgba(141, 171, 196, 0.4)'
                }
            }
        },
        MuiButton: {
            contained: {
                '&.Mui-disabled': {
                    color: '#37474f',
                    backgroundColor: '#d3d3d3'
                }
            }
        },
        MuiIconButton: {
            root: {
                outline: '0.5px none rgba(141, 171, 196, 0.4)',
                '&:focus': {
                    outline: '0.5px solid rgba(141, 171, 196, 0.4)'
                }
            }
        },
        MuiTab: {
            root: {
                outline: '0.5px hidden rgba(141, 171, 196, 0.4)'
            }
        },
        MuiSelect: {
            select: {
                '&:focus': {
                    backgroundColor: undefined
                }
            }
        }
    };
}

export { createOverrides };
