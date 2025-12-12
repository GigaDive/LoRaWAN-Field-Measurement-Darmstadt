import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../hooks/hooks';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import { setFilter, followCameraViewState, changeMapStyle } from '../../actions/history';

/**
 * Using and setting the RSSI, Altitutde, SNR and SF filter value in the store. Using material ui slider. 
 */
function FilterSlider(props) {
    const dispatch = useAppDispatch();
    const { minSignal, maxSignal, rawData, filteredData, setFilteredData } = props;

    const [rssiSliderValue, setRssiSliderValue] = useState<number[]>([
        useSelector<any>(state => state.history.filter.rssi.from) as number,
        useSelector<any>(state => state.history.filter.rssi.to*-1) as number]);
    const [altitudeSliderValue, setAltitudeSliderValue] = useState<number[]>([
        useSelector<any>(state => state.history.filter.altitude.from) as number,
        useSelector<any>(state => state.history.filter.altitude.to) as number]);
    const [snrSliderValue, setSnrSliderValue] = useState<number[]>([
        useSelector<any>(state => state.history.filter.snr.from) as number,
        useSelector<any>(state => state.history.filter.snr.to) as number]);
    const [sfSliderValue, setSfSliderValue] = useState<number[]>([7, 12]);

    const handleRssiChange = (event: Event, newValue: number | number[]) => {
        setRssiSliderValue(newValue as number[]);
    };
    const handleSNRChange = (event: Event, newValue: number | number[]) => {
        setSnrSliderValue(newValue as number[]);
    };
    const handleAltitudeChange = (event: Event, newValue: number | number[]) => {
        setAltitudeSliderValue(newValue as number[]);
    };
    const handleSFChange = (event: Event, newValue: number | number[]) => {
        setSfSliderValue(newValue as number[]);
    };
    const followCameraSelector = useSelector((state: any) => state.history.viewState.followCamera);
    const [followCameraCheckbox, setFollowCameraCheckbox] = useState(followCameraSelector);

    useEffect(() => {
        dispatch(setFilter({
            rssi: { from: rssiSliderValue[0] * -1, to: rssiSliderValue[1] * -1 },
            snr: { from: snrSliderValue[0], to: snrSliderValue[1] },
            sf: { from: sfSliderValue[0], to: sfSliderValue[1] },
            altitude: { from: altitudeSliderValue[0], to: altitudeSliderValue[1] },
        }) as any)
    }, [rssiSliderValue, snrSliderValue, altitudeSliderValue, sfSliderValue])

    useEffect(() => {
        dispatch(followCameraViewState(followCameraCheckbox) as any)
    }, [followCameraCheckbox])

    const onRadioButton = (event) => {
        dispatch(changeMapStyle({ pointStyle: event.target.value }) as any);
    };

    return (
        <Box sx={{ p: 2, spacing: 1, fontSize: 'default' }}>
            <Typography sx={{ fontWeight: 'bold', pb: 1, textAlign: "left" }}>Filter by Values</Typography>
            <Typography align='center'>RSSI (DB): {rssiSliderValue[0] * -1} /  {rssiSliderValue[1] * -1}  </Typography>
            <Slider defaultValue={rssiSliderValue[1]} min={0} max={160} value={rssiSliderValue} 
                onChange={handleRssiChange} getAriaLabel={() => 'RSSI range'} valueLabelDisplay="auto" disableSwap />
            <Typography align='center'>Altitude (m): {altitudeSliderValue[0]} / {altitudeSliderValue[1]}</Typography>
            <Slider defaultValue={300} min={0} max={300} value={altitudeSliderValue}
                onChange={handleAltitudeChange} getAriaLabel={() => 'Altitude range'} valueLabelDisplay="auto" disableSwap />
            <Typography align='center'>SNR: {snrSliderValue[0]} / {snrSliderValue[1]}</Typography>
            <Slider defaultValue={0} min={-25} max={25} value={snrSliderValue}
                onChange={handleSNRChange} getAriaLabel={() => 'SNR range'} valueLabelDisplay="auto" disableSwap />
            <Typography align='center'>Spreading Factor: {sfSliderValue[0]} / {sfSliderValue[1]} </Typography>
            <Slider
                getAriaLabel={() => 'Spreading Factor range'}
                defaultValue={7}
                min={7}
                max={12}
                value={sfSliderValue}
                onChange={handleSFChange}
                marks={sfMarks}
                disableSwap
            />
        </Box>)
}

export const sfMarks = [
    {
        value: 7,
        label: 'SF7',
    },
    {
        value: 8,
        label: 'SF8',
    },
    {
        value: 9,
        label: 'SF9',
    },
    {
        value: 10,
        label: 'SF10',
    }, {
        value: 11,
        label: 'SF11',
    }, {
        value: 12,
        label: 'SF12',
    },
];

export default FilterSlider;