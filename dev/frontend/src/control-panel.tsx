import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from './hooks/hooks';
import Box from '@mui/material/Box';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { followCameraViewState, changeMapStyle, updateHistory, setDateFilter } from './actions/history';
import FilterSlider from './components/filterSettings/filterSlider';
import DateFilterBox from './components/filterSettings/datefilterbox';
import moment from 'moment';

/**
 * Control panel component which includes the filter slider, datetimepicker, a map style switch (using radiobuttons) and the download button for downloading the current filtered data. 
 * This component also accesses the story by loading the visible geojson data and size. Additionally there is a checkbox to enable the "follow camera" mode which takes control over
 * the viewStateCamera and recenters the viewport of the map. 
 */
function ControlPanel(props) {
  const dispatch = useAppDispatch();
  const { minSignal, maxSignal, rawData, filteredData, setFilteredData } = props;
  const historySizeSelector = useSelector<any>(state => state.history.history_size);
  const localSizeSelector = useSelector<any>(state => state.history.local_data_size);
  const historyTransmittedSelector = useSelector<any>(state => state.history.history_transmitted);
  const filterSelector = useSelector<any>(state => state.history.filter);
  const visibleData = useSelector<any>(state => state.history.visible_data_size);
  const visibleDataGeoJSON = useSelector<any>(state => state.history.visible_data);
  const followCameraSelector = useSelector((state: any) => state.history.viewState.followCamera);
  const [followCameraCheckbox, setFollowCameraCheckbox] = useState(followCameraSelector);

  useEffect(() => {
    dispatch(followCameraViewState(followCameraCheckbox) as any)
  }, [followCameraCheckbox])

  const onRadioButton = (event) => {
    dispatch(changeMapStyle({ pointStyle: event.target.value }) as any);
  };

  const loadDemoData = () => {
    fetch('./sample-data.csv')
      .then(response => response.text())
      .then(text => {
        const lines = text.trim().split('\n');
        const historyData = lines.map(line => JSON.parse(line));
        console.log("History Data: ", historyData.length)
        if (historyData.length > 0) {
          const timestamps = historyData.map(item => new Date(item.timestamp).getTime());
          const minTimestamp = Math.min(...timestamps);
          const maxTimestamp = Math.max(...timestamps);

          const fromDate = new Date(minTimestamp);
          const toDate = new Date(maxTimestamp);

          const fromIsoDate = new Date(fromDate.getTime() - (fromDate.getTimezoneOffset() * 60000)).toISOString();
          const toIsoDate = new Date(toDate.getTime() - (toDate.getTimezoneOffset() * 60000)).toISOString();

          dispatch(setDateFilter({ from: fromIsoDate, to: toIsoDate }) as any);
        }

        dispatch(updateHistory({ object: historyData, history_size: historyData.length }) as any);
      })
      .catch(error => console.error('Error loading demo data:', error));
  };

  const downloadFile = async () => {
    const fileName = "LoRa_" + visibleData +"_points_geojson" ;
    const json = JSON.stringify(visibleDataGeoJSON);
    const blob = new Blob([json], { type: 'application/json' });
    const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div >
      <h3>Heatmap - LoraMap</h3>
      <Button variant="outlined" onClick={loadDemoData} sx={{ mr: 2 }}>
        Load Demo Data
      </Button>
      <Button variant="outlined"
        onClick={downloadFile}>
        Download as GeoJSON</Button>
      <Typography sx={{ pt: -1, justifyContent: "center", textAlign: 'center', fontWeight: 'light', fontSize: '14px' }} >
        Map showing signal strength
        <DateFilterBox />
        <FormControl sx={{ py: 1 }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: '16px' }}>Map Color</Typography>
          <Typography sx={{ fontSize: '14px' }}>RSSI defines the size the circle</Typography>
          <RadioGroup
            aria-labelledby="demo-radio-buttons-group-label"
            defaultValue="RSSI_SNR"
            name="radio-buttons-group"
          >
            <FormControlLabel sx={{ p: -2 }} value="RSSI_SNR" control={<Radio />} label="SNR" onChange={onRadioButton} />
            <FormControlLabel value="RSSI_SF" control={<Radio />} label="SF" onChange={onRadioButton} />
          </RadioGroup>
        </FormControl>
      </Typography>
      <hr />
      <Box sx={{ display: 'flex' }}>
        <Checkbox
          checked={followCameraSelector}
          onChange={ev => setFollowCameraCheckbox(ev.target.checked)}
        />
        <Typography sx={{ pt: 1, justifyContent: "center", textAlign: 'center', fontWeight: 'medium', fontSize: '16px' }}>Follow Camera</Typography>
      </Box>
      <FilterSlider />
      <Divider />
      <Box>
        <Typography sx={{ fontSize: '14px', my: 2 }}>History Size: {historySizeSelector as any} / Visible Data: {visibleData as any} </Typography>{/*/  */}
        <Typography>
          Research Project at SeeMoo:{' '}
          <a href="https://www.seemoo.tu-darmstadt.de/">
            LoRaWAN Evaluation
          </a>
        </Typography>
      </Box>
    </div>

  );
}
export default React.memo(ControlPanel);
