import React from "react";
import { useState, useEffect} from 'react';
import { useAppDispatch } from '../../hooks/hooks';
import { useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import { setDateFilter, setNowChecked } from '../../actions/history';
import DateTimeFilter from './datefilter';
import Checkbox from '@mui/material/Checkbox';
import moment from 'moment';
import { Typography } from "@mui/material";

/**
 * Parent component for selecting and using the time element. Also using and setting the time filter state in the store. 
 */
export default function DateFilterBox() {
  const dispatch = useAppDispatch();
  const [fromDate, setFromDate] = React.useState<Date | null>(moment().subtract(7, 'd').toDate());
  const [toDate, setToDate] = React.useState<Date | null>(moment().toDate());
  const timeNowCheckedSelector = useSelector<any>(state => state.history.filter.nowChecked);
  const [timeNowChecked, setTimeNowChecked] = useState<any>(timeNowCheckedSelector);

  useEffect(() => {
    dispatch(setNowChecked(timeNowChecked) as any)
  }, [timeNowChecked])

  useEffect(() => {
    let fromIsoDate = new Date(fromDate.getTime() - (fromDate.getTimezoneOffset() * 60000)).toISOString();
    let toIsoDate = new Date(toDate.getTime() - (toDate.getTimezoneOffset() * 60000)).toISOString();
    dispatch(setDateFilter({ from: fromIsoDate, to: toIsoDate }) as any)
  }, [fromDate, toDate])


  return (
    <>
      <Box sx={{ p: 2,}}>
        <Checkbox
          sx={{ display: 'inline', width: "30px",}}
          checked={timeNowChecked}
          onChange={ev => setTimeNowChecked(ev.target.checked)}
        />
        <Typography sx={{ display: 'inline', pt: -1, justifyContent: "left", textAlign: 'left', fontWeight: 'light', fontSize: '14px' }}>
          Override to-Timeframe (everything till now)
        </Typography>
        <DateTimeFilter
          label={'From'}
          datestate={[fromDate, setFromDate]}
        />
        <DateTimeFilter
          label={'To'}
          datestate={[toDate, setToDate]}
        />
      </Box>
    </>
  );
}
