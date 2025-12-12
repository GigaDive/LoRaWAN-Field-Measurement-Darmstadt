import React from "react";
import { useState, useEffect } from 'react';
import { useAppDispatch } from '../../hooks/hooks';
import { useSelector } from 'react-redux';
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import SensorsIcon from '@mui/icons-material/Sensors';


function createData(
    name: string,
    timestamp: string,
    lastSeen: number,
    gw: number,
    rssi: number,
    snr: number,
    sf: string,
) {
    return { name, timestamp, lastSeen, gw, rssi, snr, sf };
}

/**
 * Providing a realtime updated list of nodes that are currently transmitting data. 
 * Useful to know when the last packet from a given node was received by any gateway. Node gets removed after 600 seconds.
 */
export default function OnlineStatusNodeList() {
    const [page, setPage] = useState(0);
    const [rowsActiveDevices, setRowsActiveDevices] = useState([]);
    const dispatch = useAppDispatch();
    const active_devices = useSelector<any>((state) => state.history.gw_node_lists.active_devices);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const emptyRows =
        page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rowsActiveDevices.length) : 0;

    useEffect(() => {
        let rows = []
        let active = active_devices as any[]
        active.forEach((device) => {
            rows.push(createData(device.deviceName, device.timestamp, device.lastSeen, device._gws, device._avg_rssi, device._avg_snr, device._SF))
        })
        setRowsActiveDevices(rows.sort((a, b) => (a.name < b.name ? -1 : 1)))
    }, [active_devices])

    const handleChangePage = (
        event: React.MouseEvent<HTMLButtonElement> | null,
        newPage: number,
    ) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // console.log("Rerender triggered node box")
    return (
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                    <TableRow>
                        <TableCell></TableCell>
                        <TableCell align="left">Device Name</TableCell>
                        <TableCell align="left">Last Seen</TableCell>
                        <TableCell align="left">Timestamp</TableCell>
                        <TableCell align="left">GWs&nbsp;(#)</TableCell>
                        <TableCell align="left">RSSI&nbsp;(avg)</TableCell>
                        <TableCell align="left">SNR&nbsp;(avg)</TableCell>
                        <TableCell align="left">SF</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rowsActiveDevices.map((row) => (
                        <TableRow
                            key={row.name}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                            <TableCell align="left"><SensorsIcon /></TableCell>
                            <TableCell align="left">{row.name}</TableCell>
                            <TableCell align="left">{row.lastSeen}</TableCell>
                            <TableCell align="left">{row.timestamp}</TableCell>
                            <TableCell align="left">{row.gw}</TableCell>
                            <TableCell align="left">{row.rssi}</TableCell>
                            <TableCell align="left">{row.snr}</TableCell>
                            <TableCell align="left">{row.sf}</TableCell>

                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
