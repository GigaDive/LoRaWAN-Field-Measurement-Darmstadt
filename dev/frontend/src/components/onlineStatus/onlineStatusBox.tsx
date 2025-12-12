import * as React from 'react';
import { useEffect } from 'react';
import { useAppDispatch } from '../../hooks/hooks';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { tickActiveDevices } from '../../actions/history';
import OnlineStatusNodeList from './onlineStatusNodeList';
import ReceivedPacketList from './receivedPacketList';
import GatewayList from './onlineStatusGatewayList';
import UserFilterList from './UserFilterList';

/**
 * Parent component for grouping and updating the Gateway table, visible client table, active client table and received packet list. 
 */
function OnlineStatusBox(props) {
  const dispatch = useAppDispatch();
  const { listLengthPagination } = props;

  useEffect(() => {
    const interval = setInterval(() => { dispatch(tickActiveDevices(60 * 10) as any); }, 1000)
    return () => {
      clearInterval(interval);
    };
  }, []);

  const gridContainer = {
    display: "grid",
    gridTemplateColumn: "repeat(5, 1fr)",
    gridAutoFlow: "column"
  };

  const gridItem = {
    margin: "8px",
    // border: "1px solid red",

  };

  return (
    <Box>
      <Box sx={gridItem}>
      </Box>
      <Box sx={gridContainer}>
        <Box sx={gridItem}>
          <Typography sx={{ fontSize: "16px", fontWeight: "900", mb: "10px" }} >Used Gateways</Typography>
          <GatewayList />
        </Box>
        <Box sx={gridItem}>
          <Typography sx={{ fontSize: "16px", fontWeight: "900" }}>
            Active Nodes (recent 10min)
          </Typography>
          <OnlineStatusNodeList />
        </Box>
      </Box>
      <Box sx={gridItem}>
        <Typography sx={{ fontSize: "16px", fontWeight: "900" }}>
          Visible End Devices
        </Typography>
        < UserFilterList />
      </Box>
      <Box sx={gridItem}>
        <Typography sx={{ fontSize: "16px", fontWeight: "900" }}>
          Received packets
        </Typography>
        < ReceivedPacketList />
      </Box>
    </Box>
  );
}

export default React.memo(OnlineStatusBox);
