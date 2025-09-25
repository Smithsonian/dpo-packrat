import React from 'react';
import {
    Button,
    ButtonGroup,
    Menu,
    MenuItem,
} from '@material-ui/core';
import { ButtonProps } from '@material-ui/core/Button';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';

// ----------------------------------------------------------------
// Generic SplitActionButton
// - Left button runs a fixed default action (does NOT change)
// - Right chevron opens a menu of additional options
// - Clicking a menu item closes the menu and invokes its callback
// ----------------------------------------------------------------
export interface SplitActionOption {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    icon?: React.ReactNode;
}

export interface SplitActionButtonProps {
    options: SplitActionOption[];       // include the default option in this list
    defaultIndex?: number;              // which option is the fixed primary action (defaults to 0)
    color?: ButtonProps['color'];       // "default" | "inherit" | "primary" | "secondary"
    variant?: ButtonProps['variant'];   // "text" | "outlined" | "contained"
    size?: ButtonProps['size'];         // "small" | "medium" | "large"
    disabled?: boolean;
    mainButtonProps?: Partial<ButtonProps>;     // extra props for the main (left) button
    toggleButtonProps?: Partial<ButtonProps>;   // extra props for the arrow (right) button
}

export function SplitActionButton (props: SplitActionButtonProps): React.ReactElement {

    const {
        options,
        defaultIndex = 0,
        color = 'primary',
        variant = 'contained',
        size = 'medium',
        disabled,
        mainButtonProps,
        toggleButtonProps,
    } = props;

    // Guard: need at least one option and a valid default index
    const safeDefaultIndex = Number.isFinite(defaultIndex) && options[defaultIndex] ? defaultIndex : 0;
    const primary = options[safeDefaultIndex];
    const menuOptions = options; // show all in dropdown (including the default)

    const [menuEl, setMenuEl] = React.useState<null | HTMLElement>(null);
    const openMenu = (e: React.MouseEvent<HTMLButtonElement>) => setMenuEl(e.currentTarget);
    const closeMenu = () => setMenuEl(null);

    const handlePrimaryClick = () => {
        if (!primary?.disabled) primary?.onClick();
    };

    const handleOptionClick = (opt: SplitActionOption) => {
        closeMenu();
        if (!opt.disabled) opt.onClick();
    };

    return (
        <ButtonGroup
            variant={variant}
            color={color}
            size={size}
            disabled={!!disabled}
            style={{ boxShadow: 'none' }}
        >
            <Button
                onClick={handlePrimaryClick}
                aria-label={primary?.label || 'primary action'}
                startIcon={primary?.icon}
                {...mainButtonProps}
                style={{ marginLeft: 5, width: '200px', padding: '3px 16px', color: 'white', fontSize: '0.875rem' }}
            >
                {primary?.label || 'Action'}
            </Button>
            <Button
                aria-controls={menuEl ? 'split-action-menu' : undefined}
                aria-haspopup='true'
                aria-expanded={menuEl ? 'true' : undefined}
                onClick={openMenu}
                style={{ minWidth: 40, padding: 0, color: 'white' }}
                {...toggleButtonProps}
            >
                <ArrowDropDownIcon />
            </Button>

            <Menu id='split-action-menu'
                anchorEl={menuEl}
                keepMounted open={!!menuEl}
                onClose={closeMenu}
            >
                {menuOptions.map((opt, idx) => (
                    <MenuItem key={`${opt.label}-${idx}`} disabled={!!opt.disabled} onClick={() => handleOptionClick(opt)}>
                        {opt.label}
                    </MenuItem>
                ))}
            </Menu>
        </ButtonGroup>
    );
}

export default SplitActionButton;