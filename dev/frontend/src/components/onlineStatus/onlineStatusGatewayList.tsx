import React from "react";
import { useState, useEffect } from 'react';
import { useAppDispatch } from '../../hooks/hooks';
import { useSelector } from 'react-redux';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { setGatewayFilter } from '../../actions/history';

function createData(
    id: string,
    name: string,
    packets: number,

) {
    return { id, name, packets };
}
const columns: GridColDef[] = [
    { field: 'name', headerName: 'Gateway Name', width: 250 , description: "Descriptive name of the lora gateway" },
    { field: 'id', headerName: 'ID', width: 100 , description: "Unique identification string" },
    { field: 'packets', headerName: '# of recv. Packets', width: 130 , description: "Amount of packets received by the gateway" },

];

/**
 * Child component providing a realtime updated list of gateways that received packets under the current filter settings. 
 * If a gateway is deselected, then #packets can still show some packets visible. This occurs because some packets are received
 * by multiple gateways and if one of them in the rxInfo field is selected, then this packet is also counted towards the deselected
 * gateway.
 */
export default function GatewayList() {
    const [page, setPage] = useState(0);
    const [rowsActiveGateways, setRowsActiveGateways] = useState([]);
    const dispatch = useAppDispatch();
    const active_gateways = useSelector<any>((state) => state.history.gw_node_lists.active_gateways);

    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedGateways, setSelectedGateways] = useState([]);
    const [usableSelectionModel, setUsableSelectionModel] = useState([]);
    const [availableGateways, setAvailableGateways] = useState([]);

    useEffect(() => {
        let active = active_gateways as any[]
        let rows = []
        let available_gateways = []
        for (const [key, value] of Object.entries(active)) {
            rows.push(createData(key, value.name, value.packets))
            available_gateways.push(key)
        }
        setAvailableGateways(available_gateways)
        rows.sort((a, b) => (a.id > b.id ? -1 : 1))
        setRowsActiveGateways(rows)
        if (selectedGateways.length == 0) setUsableSelectionModel(Object.keys(active))
    }, [active_gateways])

    useEffect(() => {
        setUsableSelectionModel(selectedGateways)
        dispatch(setGatewayFilter(selectedGateways) as any)
    }, [selectedGateways])


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
            rows={rowsActiveGateways}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10,25,100]}
            onSelectionModelChange={(model) => setSelectedGateways(model)}
            selectionModel={usableSelectionModel}
            checkboxSelection
            keepNonExistentRowsSelected
        />
    );
}
