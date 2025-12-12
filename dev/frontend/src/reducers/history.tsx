
import {
    SET_NOW_CHECKED_TIMER,
    SET_DATE_FILTER,
    UPDATE_HISTORY,
    SET_CLIENT_FILTER,
    SET_GATEWAY_FILTER,
    SET_VISIBLE_GEOJSON,
    TICK_ACTIVE_DEVICES,
    ADD_ACTIVE_DEVICES,
    APPEND_BROADCAST,
    SET_FILTER,
    UPDATE_VIEWSTATE,
    TOGGLE_FOLLOW_CAMERA,
    FOLLOW_VIEWSTATE,
    CHANGE_MAP_STYLE,
    SET_GEOJSON_DATA
} from '../actions/history';

const initialState = {
    type: "GeoJSON", history_size: null,
    history_transmitted: null,
    local_data_size: null,
    gw_node_lists: {
        active_devices: [],
        client_nodes: {},
        active_gateways: {},
    },
    visible_data: {
        type: "FeatureCollection",
        features: [],
    },
    visible_data_size: null,
    geojson: {
        type: "FeatureCollection",
        features: [],
    },
    time_last_packet: null,
    filter: {
        rssi: { from: 0, to: -160 },
        snr: { from: -25, to: 25 },
        sf: { from: 7, to: 12 },
        altitude: { from: 0, to: 1000 },
        date: { from: null, to: null },
        gateway: [],
        client: [],
        nowChecked: false,
    },
    viewState: {
        width: '100vw',
        height: '100vh',
        longitude: 8.6511929,
        latitude: 49.8728253,
        zoom: 12,
        followCamera: false,
    },
    mapStyle: {
        pointStyle: "RSSI_SNR",
    }
};

/**
 * Redux store global state. Shared and accessed across all components and used to maintain a common state and being able to "reactively" update components.
*/
export const updateHistoryReducer = (state = initialState, action) => {
    let state_obj = null;
    switch (action.type) {
        case SET_GEOJSON_DATA:
            state_obj = {
                ...state,
                history_size: action.data.features.length,
                history_transmitted: action.data.features.length,
                geojson: action.data,
            };
            return state_obj;
        case SET_VISIBLE_GEOJSON:
            state_obj = {
                ...state,
                visible_data: action.geojson,
                visible_data_size: action.geojson.features.length,
                gw_node_lists: {
                    ...state.gw_node_lists,
                    active_gateways: action.gateways,
                    client_nodes: action.clients,
                }
            }
            return state_obj;  
        case APPEND_BROADCAST:
            state_obj = {
                ...state,
                time_last_packet: 0,
                local_data_size: state.geojson.features.length,
                geojson: { ...state.geojson, features: [...state.geojson.features, action.frame] },

            };
            return state_obj;  
        case UPDATE_HISTORY:
            state_obj = { ...state, local_data_size: state.geojson.features.length, history_transmitted: state.history_transmitted + action.history.length, history_size: action.history_size, geojson: { ...state.geojson, features: state.geojson.features.concat(action.history) } };
            return state_obj; 
        case SET_FILTER:
            state_obj = {
                ...state, filter: {
                    ...state.filter,
                    rssi: { ...state.filter.rssi, from: action.filter.rssi.from, to: action.filter.rssi.to },
                    snr: { ...state.filter.snr, from: action.filter.snr.from, to: action.filter.snr.to },
                    sf: { ...state.filter.sf, from: action.filter.sf.from, to: action.filter.sf.to },
                    altitude: { ...state.filter.altitude, from: action.filter.altitude.from, to: action.filter.altitude.to }
                }
            };
            return state_obj;
        case UPDATE_VIEWSTATE:
            state_obj = { ...state, viewState: { ...state.viewState, longitude: action.view.longitude, latitude: action.view.latitude, zoom: action.view.zoom } };
            return state_obj; 
        case FOLLOW_VIEWSTATE:
            state_obj = { ...state, viewState: { ...state.viewState, longitude: action.view.longitude, latitude: action.view.latitude } };
            return state_obj;
        case TOGGLE_FOLLOW_CAMERA:
            state_obj = { ...state, viewState: { ...state.viewState, followCamera: action.follow.camera } };
            return state_obj;
        case CHANGE_MAP_STYLE:
            state_obj = { ...state, mapStyle: { ...state.mapStyle, pointStyle: action.state.pointStyle } };
            return state_obj;
        case ADD_ACTIVE_DEVICES:
            state_obj = { ...state };
            action.active.node.forEach((node) => {
                if (state_obj.gw_node_lists.active_devices.filter((e) => e.deviceName == node.deviceName).length > 0) {
                    let objIndex = state_obj.gw_node_lists.active_devices.findIndex((obj => obj.deviceName === node.deviceName));
                    state.gw_node_lists.active_devices[objIndex].lastSeen = 0;
                    state.gw_node_lists.active_devices[objIndex].timestamp = node.timestamp;
                    state.gw_node_lists.active_devices[objIndex]._avg_rssi = node._avg_rssi;
                    state.gw_node_lists.active_devices[objIndex]._avg_snr = node._avg_snr;
                    state.gw_node_lists.active_devices[objIndex]._SF = node._SF;
                    state.gw_node_lists.active_devices[objIndex]._gws = node._gws;
                } else {
                    state_obj = {
                        ...state, gw_node_lists: {
                            ...state.gw_node_lists,
                            active_devices: [...state.gw_node_lists.active_devices, node]
                        }
                    };
                }
            })
            return state_obj;
        case TICK_ACTIVE_DEVICES:
            state_obj = { ...state };
            state_obj.gw_node_lists.active_devices.forEach((node) => {
                if (node.lastSeen < action.limit) {
                    node.lastSeen++;
                }
            })
            state_obj.gw_node_lists.active_devices = state_obj.gw_node_lists.active_devices.filter((e) => e.lastSeen < action.limit)
            return state_obj;
        case SET_DATE_FILTER:
            state_obj = {
                ...state, filter: {
                    ...state.filter, 
                    nowChecked: false,
                    date: {
                        from: action.from,
                        to: action.to,
                    }
                }
            };
            return state_obj;
        case SET_CLIENT_FILTER:
            state_obj = {
                ...state, filter: {
                    ...state.filter, client: action.client
                }
            };
            return state_obj;
        case SET_NOW_CHECKED_TIMER:
            state_obj = { ...state, filter: { ...state.filter, nowChecked: action.nowChecked } };
            return state_obj;
        case SET_GATEWAY_FILTER:
            state_obj = {
                ...state, filter: {
                    ...state.filter, gateway: action.gateways
                }
            };
            return state_obj;
        default:
            return state;
    }

}