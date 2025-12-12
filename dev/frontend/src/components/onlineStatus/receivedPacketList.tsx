import React from "react";
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAppDispatch } from '../../hooks/hooks';
import { useSelector } from 'react-redux';
import { DataGrid, GridColDef } from '@mui/x-data-grid';



function createData(id: string, devname: string, location: string, sf: string, deviceProfileName: string, fCnt: number, rssi: number, snr: number, number_of_gws: number, gw_names: string[], dist: number[]) {
    return { id, devname, location, sf, deviceProfileName, fCnt, rssi, snr, number_of_gws, gw_names, dist };
}

const useStyles = {
    root: {
        width: "100%"
    },
    container: {
        maxHeight: 440
    }
};

const columns: GridColDef[] = [
    { field: 'id', headerName: 'Timestamp', width: 240, description: "Timestamp when the packet arrived at the backend" },
    { field: 'devname', headerName: 'Name', width: 180, description: "Name of the lora device" },
    { field: 'location', headerName: 'Location', width: 200, description: "GPS Location coordinates" },
    { field: 'sf', headerName: 'SF', width: 15, description: "Spreading factor used for the measurement point" },
    { field: 'deviceProfileName', headerName: 'Dev Profile Name', width: 160, description: "Name of the end device profile settings used in chirpstack" },
    { field: 'fCnt', headerName: 'FCount', width: 100, description: "Incremented frame count number" },
    { field: 'rssi', headerName: 'RSSI', width: 150, description: "Received signal strength indicator" },
    { field: 'snr', headerName: 'SNR', width: 150, description: "Signal to noise ratio as an indicator for signal quality" },
    { field: 'gw_names', headerName: 'GWs', width: 260, description: "List of gateways that received the packet", resizable: true },
    { field: 'dist', headerName: 'Distance', width: 200, description: "List of distances from the end device to every gateway that received the packet" },
];
/**
 * More detailed view of the currently visible packets. Data is saved inside the history store @ state.history.visible_data.features
 */

export default function ReceivedPacketList() {
    const classes = useStyles;
    const [page, setPage] = React.useState(0);
    const [rowsActiveDevices, setRowsActiveDevices] = useState([]);
    const dispatch = useAppDispatch();
    const visible_data = useSelector<any>((state) => state.history.visible_data.features);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);
    const emptyRows =
        page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rowsActiveDevices.length) : 0;


    useEffect(() => {
        let rows = []
        let active = visible_data as any[]
        active.reverse().forEach((packet) => {
            let location = `${packet.geometry.coordinates[1]}, ${packet.geometry.coordinates[0]}, ${packet.geometry.coordinates[2]}`;
            let distances = [];
            let gw_names = [];

            packet.properties.rxInfo.forEach((data) => {
                if ("distance" in data) {
                    distances.push(data.distance.toFixed(2));
                }
                if ("gwcoord" in data) {
                    gw_names.push(data.gwcoord.name);
                }
            })
            let number_of_gws = packet.properties.rxInfo.length;
            rows.push(createData(packet.properties.timestamp, packet.properties.deviceName, location, packet.properties._SF, packet.properties.deviceProfileName, packet.properties.fCnt, packet.properties._rssi_total, packet.properties._snr_total, number_of_gws, gw_names, distances))
        })

        setRowsActiveDevices(rows.sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1)).reverse());
    }, [visible_data])

    return (
        <DataGrid sx={{
            border: 0, height: 500, width: '100%'
        }}
            rows={rowsActiveDevices}
            columns={columns}
            // pageSize={25}
            rowsPerPageOptions={[10, 25, 100]}
            pagination
        />
    );
}
