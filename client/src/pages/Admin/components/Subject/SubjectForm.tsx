/* eslint-disable react/jsx-max-props-per-line */

import { Box, Button, Select, MenuItem } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { FieldType, InputField } from '../../../../components';
import { useSubjectStore } from '../../../../store';
import SearchList from '../../../Ingestion/components/SubjectItem/SearchList';
import SubjectList from '../../../Ingestion/components/SubjectItem/SubjectList';
import { RotationOriginInput, RotationQuaternionInput } from '../../../Repository/components/DetailsView/DetailsTab/SubjectDetails';
import { getUnitsList } from '../../hooks/useAdminview';
import * as yup from 'yup';
import { toast } from 'react-toastify';
// import IdentifierList from '../../../../components/shared/IdentifierList';
// import AssetIdentifiers from '../../../../components/shared/AssetIdentifiers';

const useStyles = makeStyles(({ palette }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        overflow: 'auto',
        maxHeight: 'calc(100vh - 60px)'
    },
    content: {
        display: 'flex',
        flex: 1,
        width: '52vw',
        flexDirection: 'column',
        padding: 20,
        paddingBottom: 0
    },
    filesLabel: {
        color: palette.primary.dark,
        marginRight: 20
    },
    fileChip: {
        marginRight: 10,
        marginBottom: 5
    },
    btn: {
        backgroundColor: '#687DDB',
        color: 'white',
        width: '90px',
        height: '30px'
    }
}));

/*
    Create state for:
        xName
        xUnit
        Identifiers (gotta fetch the correct ones)
        xLatitude
        xLongitude
        xAltitude
        xRotation Origin
        xRotation Quaternion

    Component workflow
        xWhen component is mounted, fetch unit list for the drop down
        xWhen fields are filled out, update the UI to indicate change
        xIf a subject is searched,
            xHold on to the results
            xIf the subject we want to use is in there, add it
                xAdding will fill out the state for Name, Unit, and Identifiers

    Methods/Functions
        xUpdating state
        xSelecting the correct unit
        Creating the subject and geolocation
        xRevising the searchIngestionSubject

    Validation:
        xName
        xUnit
        Identifier
*/

function SubjectForm(): React.ReactElement {
    const classes = useStyles();

    const [subjectError, setSubjectError] = useState(false);
    const [subjectName, setSubjectName] = useState('');
    const [subjectUnit, setSubjectUnit] = useState(0);
    const [unitList, setUnitList] = useState<any>([]);
    const [coordinateValues, setCoordinateValues] = useState({ Latitude: 0, Longitude: 0, Altitude: 0, TS0: 0, TS1: 0, TS2: 0, R0: 0, R1: 0, R2: 0, R3: 0 });
    const [validName, setValidName] = useState(true);
    const [validUnit, setValidUnit] = useState(true);
    // const [validIdentifiers, setValidIdentifiers] = useState(true);

    const subjects = useSubjectStore(state => state.subjects);

    const schema = yup.object().shape({
        subjectName: yup.string().min(1),
        subjectUnit: yup.number().positive()
        // subjectIdentifiers: yup.array().min(1)
    });

    useEffect(() => {
        const fetchUnitList = async () => {
            const { data } = await getUnitsList();
            if (data?.getUnitsFromNameSearch.Units && data?.getUnitsFromNameSearch.Units.length) {
                // manipulate the data and then set it to state
                const fetchedUnitList = data?.getUnitsFromNameSearch.Units.slice();
                if (fetchedUnitList && fetchedUnitList.length) fetchedUnitList.sort((a, b) => a.Name.localeCompare(b.Name));
                setUnitList(fetchedUnitList);
            }
        };
        fetchUnitList();
    }, []);

    // console.log('unitList', unitList);
    useEffect(() => {
        if (subjects.length > 0) {
            const { name, unit } = subjects[subjects.length - 1];
            setSubjectName(name);
            console.log('unit', unit);
            // setSubjectUnit(unit);
            // setSubjectIdentifiers(arkId);
        }
    }, [subjects]);

    useEffect(() => {
        if (subjects.length > 0) {
            setSubjectError(false);
        }
    }, [subjects]);

    const validateFields = async (): Promise<boolean | void> => {
        try {
            const isValidName = await schema.isValid({ subjectName });
            setValidName(isValidName);
            if (!isValidName) toast.warn('Creation Failed: Name Cannot Be Empty');

            const isValidUnit = await schema.isValid({ subjectUnit });
            setValidUnit(isValidUnit);
            if (!isValidUnit) toast.warn('Create Failed: Unit Cannot Be Empty');

            // TODO validate identifiers

            return isValidName && isValidUnit;
        } catch (error) {
            toast.warn(error);
        }
    };

    const handleCoordinateChange = ({ target }) => {
        const name = target.name;
        const value = target.value;
        setCoordinateValues({ ...coordinateValues, [name]: value });
    };

    const handleUnitSelectChange = ({ target }) => {
        setSubjectUnit(target.value);
    };

    const onCreateSubject = async () => {
        const validFields = await validateFields();
        if (!validFields) return;
        // start by validating the fields
        // create the geolocation
        // creat the subject

        // try {

        // } catch (error) {

        // } finally {

        // }
    };

    return (
        <Box className={classes.container}>
            <Box className={classes.content}>
                <SearchList EdanOnly />
                <FieldType error={subjectError} required label='Subject(s) Selected' marginTop={2}>
                    <SubjectList subjects={subjects} selected emptyLabel='Search and select subject from above' />
                </FieldType>
                <Box style={{ marginTop: '10px', marginBottom: '10px', width: '600px' }}>
                    <InputField viewMode required label='Name' value={subjectName} name='Name' onChange={({ target }) => setSubjectName(target.value)} updated={!validName} />
                    <FieldType width='auto' direction='row' label='Unit' required containerProps={{ justifyContent: 'space-between' }}>
                        <Select value={subjectUnit} onChange={handleUnitSelectChange} error={!validUnit}>
                            <MenuItem value={0} key={0}>
                                None
                            </MenuItem>
                            {unitList.map(unit => (
                                <MenuItem value={unit.idUnit} key={unit.idUnit}>
                                    {unit.Name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FieldType>
                    {/* {validUnit === false && <FormHelperText style={{ backgroundColor: '#EFF2FC', color: '#f44336' }}>Required</FormHelperText>} */}
                    <InputField viewMode required type='number' label='Latitude' value={coordinateValues.Latitude} name='Latitude' onChange={handleCoordinateChange} />
                    <InputField viewMode required type='number' label='Longitude' value={coordinateValues.Longitude} name='Longitude' onChange={handleCoordinateChange} />
                    <InputField viewMode required type='number' label='Altitude' value={coordinateValues.Altitude} name='Altitude' onChange={handleCoordinateChange} />
                    <RotationOriginInput TS0={coordinateValues.TS0} TS1={coordinateValues.TS1} TS2={coordinateValues.TS2} onChange={handleCoordinateChange} ignoreUpdate />
                    <RotationQuaternionInput
                        R0={coordinateValues.R0}
                        R1={coordinateValues.R1}
                        R2={coordinateValues.R2}
                        R3={coordinateValues.R3}
                        onChange={handleCoordinateChange}
                        ignoreUpdate
                    />
                </Box>
                {/* Identifier grid */}
                {/* <IdentifierList /> */}
                {/* <AssetIdentifiers /> */}
                <Button className={classes.btn} onClick={onCreateSubject}>
                    Create
                </Button>
            </Box>
        </Box>
    );
}

export default SubjectForm;
