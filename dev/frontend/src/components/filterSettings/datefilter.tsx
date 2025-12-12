import React from "react";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

/**
 * Filter component using material ui datetimepicker component. Handing over the date to the parent component.
 */
export default function DateTimeFilter(props) {
  const { label, datestate } = props;
  const [value, setValue] = datestate;

  return (
    <>
      <Box sx={{ pt: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DateTimePicker
            renderInput={(props) => <TextField {...props} />}
            label={label}
            value={value}
            onChange={(newValue) => {
              setValue(newValue);
            }}
          />
        </LocalizationProvider>
      </Box>
    </>
  );
}
