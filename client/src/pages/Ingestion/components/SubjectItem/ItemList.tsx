/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * ItemList
 *
 * This component renders item list used in SubjectItem component.
 */
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem, Typography } from '@material-ui/core';
import { grey } from '@material-ui/core/colors';
import { makeStyles, createStyles } from '@material-ui/core/styles';
import React from 'react';
import { DebounceInput } from 'react-debounce-input';
import { RiCheckboxBlankCircleLine, RiRecordCircleFill } from 'react-icons/ri';
import { BsPlusCircle } from 'react-icons/bs';
import { StateItem, useItemStore, useSubjectStore } from '../../../../store';
import { palette } from '../../../../theme';
import lodash from 'lodash';

const useStyles = makeStyles(({ palette, typography }) => createStyles({
    container: {
        maxHeight: '18vh',
        backgroundColor: palette.background.paper
    },
    headerText: {
        position: 'sticky',
        top: 0,
        fontSize: '0.8em',
        backgroundColor: '#d1e7fa', // palette.primary.light, //palette.background.paper,
        color: palette.primary.dark, //contrastText,
        zIndex: 10,
        // [breakpoints.down('lg')]: {
        //     padding: '5px 16px',
        // }
    },
    body: {
        overflow: 'auto'
    },
    emptyList: {
        textAlign: 'center',
        color: palette.grey[500],
        fontStyle: 'italic',
        // marginTop: spacing(4)
    },
    selected: {
        cursor: 'pointer',
    },
    nameInput: {
        width: '100%',
        border: 'none',
        outline: 'none',
        padding: '0px 2px',
        fontSize: '0.75rem',
        fontWeight: 400,
        fontFamily: typography.fontFamily,
        '&:focus': {
            outline: 'none',
        },
        '&::placeholder': {
            fontStyle: 'italic'
        },
        '&::-moz-placeholder': {
            fontStyle: 'italic'
        }
    },
    projectSelect: {
        width: '100%',
        height: 'fit-content',
        backgroundColor: palette.background.paper,
        fontSize: '0.75rem'
    },
    text: {
        fontSize: '0.75rem',
        fontWeight: 400,
        fontFamily: typography.fontFamily
    }
}));

function ItemList(): React.ReactElement {
    const classes = useStyles();
    const [items, hasNewItem, newItem, addNewItem, projectList, updateNewItemSubtitle, updateNewItemEntireSubject, updateNewItemProject, updateSelectedItem] = useItemStore(state => [state.items, state.hasNewItem, state.newItem, state.addNewItem, state.projectList, state.updateNewItemSubtitle, state.updateNewItemEntireSubject, state.updateNewItemProject, state.updateSelectedItem]);
    const [subjects] = useSubjectStore(state => [state.subjects]);

    const getItemsList = (item: StateItem, index: number) => {
        const { id, selected, subtitle, entireSubject, projectName } = item;

        return (
            <ItemListItem
                key={index}
                subtitle={subtitle}
                selected={selected}
                entireSubject={entireSubject as boolean}
                projectName={projectName}
                onUpdateSelected={updateSelectedItem}
                id={id}
            />
        );
    };


    return (
        <TableContainer className={classes.container}>
            <Table style={{ tableLayout: 'fixed' }}>
                <TableHead>
                    <TableRow>
                        <TableCell className={classes.headerText} style={{ width: 60 }} align='left'>SELECTED</TableCell>
                        <TableCell className={classes.headerText} align='left'>PROJECT</TableCell>
                        <TableCell className={classes.headerText} style={{ width: 100 }} align='center'>FULL SUBJECT?</TableCell>
                        <TableCell className={classes.headerText} align='left'>NAME/SUBTITLE</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody className={classes.body}>
                    {(items && items.length > 0) && items.map(getItemsList)}
                    {hasNewItem ? (
                        <ItemListNewItem
                            item={newItem}
                            onUpdateEntireSubject={updateNewItemEntireSubject}
                            onUpdateName={updateNewItemSubtitle}
                            onUpdateSelected={updateSelectedItem}
                            onUpdateProject={updateNewItemProject}
                            projects={projectList}
                            hasMultipleSubjects={subjects.length > 1}
                        />
                    ) : (
                        <ItemListEmptyItem onAddItem={addNewItem} />
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

interface ItemListItemProps {
    selected: boolean;
    entireSubject: boolean;
    subtitle: string;
    children?: React.ReactNode;
    projectName: string;
    id: string;
    onUpdateSelected: (id: string) => void;
}

function ItemListItem(props: ItemListItemProps) {
    const classes = useStyles();
    const { selected, subtitle, entireSubject, projectName, onUpdateSelected, id } = props;

    const cellStyle = {
        width: 100,
    };

    return (
        <TableRow>
            <TableCell style={cellStyle} align='center'>
                {!selected && <RiCheckboxBlankCircleLine className={classes.selected} onClick={() => onUpdateSelected(id)} size={20} color={grey[400]} />}
                {selected && <RiRecordCircleFill className={classes.selected} onClick={() => onUpdateSelected(id)} size={20} color={palette.primary.main} />}
            </TableCell>
            <TableCell>
                <Typography className={classes.text}>{projectName}</Typography>
            </TableCell>
            <TableCell style={cellStyle} align='center'>
                <Typography className={classes.text}>{entireSubject ? 'Yes' : 'No'}</Typography>
            </TableCell>
            <TableCell>
                <Typography className={classes.text}>{subtitle.length ? subtitle : 'None'}</Typography>
            </TableCell>
        </TableRow>
    );
}

interface ItemListEmptyItemProps {
    onAddItem: () => void;
}

function ItemListEmptyItem(props: ItemListEmptyItemProps) {
    const classes = useStyles();
    const { onAddItem } = props;

    const cellStyle = {
        width: 100,
    };

    return (
        <TableRow>
            <TableCell style={cellStyle} align='center'>
                <BsPlusCircle className={classes.selected} onClick={onAddItem} size={17} color={palette.primary.main} />
            </TableCell>
            <TableCell>
                <span className={classes.emptyList}>Add new media group here</span>
            </TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
        </TableRow>
    );
}

interface ItemListNewItemProps {
    item: StateItem;
    onUpdateSelected: (id: string) => void;
    onUpdateEntireSubject: (entire: boolean) => void;
    onUpdateName: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onUpdateProject: (idProject: number) => void;
    hasMultipleSubjects: boolean;
    projects: any[];
}

function ItemListNewItem(props: ItemListNewItemProps) {
    const { item: { subtitle, entireSubject, idProject, projectName, id, selected }, onUpdateEntireSubject, onUpdateName, onUpdateProject, onUpdateSelected, projects, hasMultipleSubjects } = props;
    const classes = useStyles();

    const uniqueSortedProjects = lodash.uniqBy(lodash.orderBy(projects, 'Name', 'asc'), 'Name');

    const cellStyle = {
        width: 100,
    };

    return (
        <TableRow>
            <TableCell style={cellStyle} align='center'>
                {!selected && <RiCheckboxBlankCircleLine className={classes.selected} onClick={() => onUpdateSelected(id)} size={20} color={grey[400]} />}
                {selected && <RiRecordCircleFill className={classes.selected} onClick={() => onUpdateSelected(id)} size={20} color={palette.primary.main} />}
            </TableCell>
            <TableCell>
                <Select
                    value={idProject}
                    className={classes.projectSelect}
                    renderValue={() => `${projectName || 'None'}`}
                    onChange={({ target: { value } }) => onUpdateProject(value as number)}
                    disableUnderline
                >
                    <MenuItem value={-1} disabled>None</MenuItem>
                    {uniqueSortedProjects.map(({ idProject, Name }, index: number) => <MenuItem key={index} value={idProject}>{Name}</MenuItem>)}
                </Select>
            </TableCell>
            <TableCell style={cellStyle} align='center'>
                {hasMultipleSubjects ? (
                    <Typography style={{ fontSize: '0.75rem' }}>No</Typography>
                ) : (
                    <Select
                        value={entireSubject === null ? -1 : !entireSubject ? 0 : 1}
                        disabled={idProject < 0}
                        className={classes.projectSelect}
                        renderValue={() => entireSubject === null ? 'Yes/No' : !entireSubject ? 'No' : 'Yes'}
                        disableUnderline
                        style={{ width: 'fit-content' }}
                        onChange={(e) => onUpdateEntireSubject(Number(e.target.value) > 0 ? true : false) }
                    >
                        <MenuItem value={-1} disabled><em>Yes/No</em></MenuItem>
                        <MenuItem value={0}>No</MenuItem>
                        <MenuItem value={1}>Yes</MenuItem>
                    </Select>
                )}
            </TableCell>
            <TableCell>
                {(idProject > -1) && (
                    <DebounceInput
                        value={subtitle}
                        className={classes.nameInput}
                        onChange={onUpdateName}
                        debounceTimeout={500}
                        placeholder={`Add subtitle ${hasMultipleSubjects || !entireSubject ? '[required]' : '[optional]'}`}
                    />
                )}
            </TableCell>
        </TableRow>
    );
}

export default ItemList;