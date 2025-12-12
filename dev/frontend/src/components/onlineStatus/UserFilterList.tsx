import React from "react";
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAppDispatch } from '../../hooks/hooks';
import { useSelector } from 'react-redux';
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import { setClientFilter } from '../../actions/history';


function createData(
    id: string,
    name: string,
    deviceProfileName: string,
    packets: number,
) {
    return { id, name, deviceProfileName, packets };
}

const columns: GridColDef[] = [
    { field: 'name', headerName: 'Client Name', width: 250, description: "Descriptive name of the end device" },
    { field: 'id', headerName: 'ID', width: 100, description: "Unique device identification string (devEUI)" },
    { field: 'deviceProfileName', headerName: 'deviceProfileName', width: 250, description: "Name of the end device profile settings used in chirpstack" },
    { field: 'packets', headerName: '# packets', width: 200, description: "Number of packets sent by the end device" },
];

/**
 * Same component as the GatewayList but used for selecting nodes that should be visible.
 */
export default function UserFilterList() {
    const [page, setPage] = useState(0);
    const [rowsActiveClients, setRowsActiveClients] = useState([]);
    const dispatch = useAppDispatch();
    const active_clients = useSelector<any>((state) => state.history.gw_node_lists.client_nodes);
    const [selectedClients, setSelectedClients] = useState([]);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [usableSelectionModel, setUsableSelectionModel] = useState([]);
    const [availableClients, setAvailableClients] = useState([]);

    const emptyRows =
        page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rowsActiveClients.length) : 0;

    useEffect(() => {
        let active = active_clients as any[]
        let rows = []
        let available_clients = []
        for (const [key, value] of Object.entries(active)) {
            rows.push(createData(key, value.deviceName, value.deviceProfileName, value.packets))
            if (!(key in availableClients)) availableClients.push(key)
        }
        setAvailableClients(available_clients)
        rows.sort((a, b) => (a.id > b.id ? -1 : 1))
        setRowsActiveClients(rows)
        if (selectedClients.length == 0) setUsableSelectionModel(Object.keys(active))
    }, [active_clients])

    useEffect(() => {
        setUsableSelectionModel(selectedClients)
        dispatch(setClientFilter(selectedClients) as any)
    }, [selectedClients])

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

    return (
        <DataGrid sx={{
            border: 0, height: 350, width: '100%'
        }}
            rows={rowsActiveClients}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 100]}
            onSelectionModelChange={(model) => setSelectedClients(model)}//setUsableSelectionModel(availableClients.filter((e) => model.includes(e)))}
            selectionModel={usableSelectionModel}
            checkboxSelection
            keepNonExistentRowsSelected
        />
    );
}
