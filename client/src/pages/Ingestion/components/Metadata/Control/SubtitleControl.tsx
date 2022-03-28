import React from 'react';
import { SubtitleFields, eSubtitleOption } from '../../../../../store/metadata/metadata.types';
import { Box, makeStyles, Typography, Table, TableBody, TableCell, TableContainer, TableRow, fade } from '@material-ui/core';
import { RiCheckboxBlankCircleLine, RiRecordCircleFill } from 'react-icons/ri';
import { grey } from '@material-ui/core/colors';
import { palette } from '../../../../../theme';
import { DebounceInput } from 'react-debounce-input';
import clsx from 'clsx';

interface SubtitleControlProps {
    subtitles: SubtitleFields;
    objectName: string;
    onSelectSubtitle: (id: number) => void;
    onUpdateCustomSubtitle: (event: React.ChangeEvent<HTMLInputElement>, id: number) => void;
    hasPrimaryTheme: boolean
}

const useStyles = makeStyles(({ palette, typography }) => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: (hasPrimaryTheme) => hasPrimaryTheme ? palette.primary.light : palette.secondary.light,
        width: 'fit-content',
        minWidth: 300
    },
    selected: {
        cursor: 'pointer',
    },
    cell: {
        border: 'none',
        padding: '1px 10px',
        height: 30
    },
    labelCell: {
        width: 50
    },
    optionContainer: {
        display: 'flex',
        padding: '0 16px 0 0',
        alignItems: 'center'
    },
    input: {
        height: 18,
        border: `1px solid ${fade(palette.primary.contrastText, 0.4)}`,
        fontFamily: typography.fontFamily,
        fontSize: '0.8rem',
        padding: '0px 10px',
        borderRadius: 5,
    },
    text: {
        fontSize: '0.75rem'
    }
}));

function SubtitleControl(props: SubtitleControlProps): React.ReactElement {
    const { objectName, subtitles, onUpdateCustomSubtitle, onSelectSubtitle, hasPrimaryTheme } = props;
    const classes = useStyles(hasPrimaryTheme);
    const selectedSubtitle = subtitles.find(subtitle => subtitle.selected === true)?.value;
    const selectedSubtitlesName = selectedSubtitle ? `: ${selectedSubtitle}` : '';
    const sortedSubtitles: SubtitleFields = subtitles.sort((a, b) => a.subtitleOption - b.subtitleOption);


    const renderSubtitleOptions = (subtitles: SubtitleFields): React.ReactElement => {
        console.log('subtitles', subtitles,'objectName', objectName);
        // Case: forced
        if (subtitles.some(option => option.subtitleOption === eSubtitleOption.eForced))
            return (
                <TableRow>
                    <TableCell className={clsx(classes.labelCell, classes.cell)}>
                        <Typography className={classes.text}>Name:</Typography>
                    </TableCell>
                    <TableCell className={classes.cell}>
                        <Typography className={classes.text}>{`${objectName}${selectedSubtitlesName}`}</Typography>
                    </TableCell>
                </TableRow>
            );

        // Case: optional subtitle
        if (objectName && subtitles.length === 1 && subtitles.find(option => option.subtitleOption === eSubtitleOption.eInput)) {
            const { id, value } = subtitles[0];
            return (
                <>
                <TableRow>
                    <TableCell className={clsx(classes.labelCell, classes.cell)}>
                        <Typography className={classes.text}>Name:</Typography>
                    </TableCell>
                    <TableCell className={classes.cell}>
                        <Typography className={classes.text}>{`${objectName}${selectedSubtitlesName}`}</Typography>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell className={clsx(classes.labelCell, classes.cell)}>
                        <Typography className={classes.text}>Subtitle:</Typography>
                    </TableCell>
                    <TableCell className={classes.cell}>
                        <DebounceInput
                            onChange={(e) => onUpdateCustomSubtitle(e, id)}
                            element='input'
                            value={value}
                            className={classes.input}
                            debounceTimeout={400}
                            title={`subtitle-input-${value}`}
                        />
                    </TableCell>
                </TableRow>
            </>
            );
        }

        // Case: mandatory name input
        if (subtitles.length === 1 && subtitles.find(option => option.subtitleOption === eSubtitleOption.eInput)) {
            const { id, value } = subtitles[0];
            return (
                <TableRow>
                    <TableCell className={clsx(classes.labelCell, classes.cell)}>
                        <Typography className={classes.text}>Name:</Typography>
                    </TableCell>
                    <TableCell className={classes.cell}>
                        <DebounceInput
                            onChange={(e) => onUpdateCustomSubtitle(e, id)}
                            element='input'
                            value={value}
                            className={classes.input}
                            debounceTimeout={400}
                            title={`subtitle-input-${value}`}
                        />
                    </TableCell>
                </TableRow>
            );
        }

        // Case: mixed
        const options = (
            <>
                <TableRow>
                    <TableCell className={clsx(classes.labelCell, classes.cell)}>
                        <Typography className={classes.text}>Name:</Typography>
                    </TableCell>
                    <TableCell className={classes.cell}>
                        <Typography className={classes.text}>{`${objectName}${selectedSubtitlesName}`}</Typography>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell className={clsx(classes.labelCell, classes.cell)}>
                        <Typography className={classes.text}>Subtitle:</Typography>
                    </TableCell>
                    <TableCell>
                        <div style={{ display: 'flex', height: '100%' }}>
                            {
                                sortedSubtitles.map(({ selected, value, id, subtitleOption }, key) => (
                                    <div className={classes.optionContainer} key={key}>
                                        {!selected && <RiCheckboxBlankCircleLine className={classes.selected} onClick={() => onSelectSubtitle(id)} size={18} color={grey[400]} />}
                                        {selected && <RiRecordCircleFill className={classes.selected} onClick={() => onSelectSubtitle(id)} size={18} color={palette.primary.main} />}
                                        {subtitleOption === eSubtitleOption.eNone && <Typography className={classes.text}>None</Typography>}
                                        {subtitleOption === eSubtitleOption.eInherit && <Typography className={classes.text}>{value.length ? value : 'None'}</Typography>}
                                        {subtitleOption === eSubtitleOption.eInput && (
                                            <DebounceInput
                                                onChange={(e) => onUpdateCustomSubtitle(e, id)}
                                                element='input'
                                                value={value}
                                                className={classes.input}
                                                debounceTimeout={400}
                                                title={`subtitle-input-${value}`}
                                            />
                                        )}
                                    </div>
                                ))
                            }
                        </div>
                    </TableCell>
                </TableRow>
            </>
        );

        return <React.Fragment>{options}</React.Fragment>;
    };

    return (
        <Box className={classes.container}>
            <TableContainer>
                <Table>
                    <TableBody>
                        {renderSubtitleOptions(subtitles)}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default SubtitleControl;
