export const UPDATE_HISTORY = 'Update History';
export const APPEND_BROADCAST = 'Append Broadcast';
export const SET_FILTER = 'Set Filter';
export const UPDATE_VIEWSTATE = 'Update Viewstate';
export const TOGGLE_FOLLOW_CAMERA = 'Follow Camera';
export const FOLLOW_VIEWSTATE = 'Follow Viewstate';
export const ADD_ACTIVE_DEVICES = 'Add active Devices';
export const CHANGE_MAP_STYLE = 'Change Map style';
export const TICK_ACTIVE_DEVICES = 'TICK active devices';
export const SET_VISIBLE_GEOJSON = 'SET visible geojson';
export const SET_DATE_FILTER = 'SET date filter';
export const SET_NOW_CHECKED_TIMER = 'SET now checked';
export const SET_GATEWAY_FILTER = 'SET gateway filter';
export const SET_CLIENT_FILTER = 'SET client filter';
export const SET_GEOJSON_DATA = 'SET geojson data';


/**
 * Redux store action. Preparing incoming data for storing. 
 */
export const updateHistory = (history) => {
  return (dispatch) => {
    let historyGeojson = []

    history.object.forEach((obj) => {
      let frame = obj.object;
      let _rssi_val = [];
      let _snr_val = [];

      frame.rxInfo.forEach((gw) => _rssi_val.push(gw.rssi));
      frame.rxInfo.forEach((gw) => _snr_val.push(gw.loRaSNR));
      historyGeojson.push({
        type: "Feature",
        geometry: {
          "type": "Point",
          "coordinates": [
            frame.objectJSON.gpsLocation["136"].longitude,
            frame.objectJSON.gpsLocation["136"].latitude,
            frame.objectJSON.gpsLocation["136"].altitude
          ]
        },
        properties: {
          timestamp: frame.timestamp,
          applicationId: frame.applicationID,
          applicationName: frame.applicationName,
          deviceName: frame.deviceName,
          deviceProfileName: frame.deviceProfileName,
          deviceProfileID: frame.deviceProfileID,
          devEUI: frame.devEUI,
          adr: frame.adr,
          fCnt: frame.fCnt,
          fPort: frame.fPort,
          txInfo: frame.txInfo,
          rxInfo: frame.rxInfo,
          _rxInfo_len: frame.rxInfo.length,
          _rssi_avg: Math.round((_rssi_val.reduce((a, b) => a + b, 0) / _rssi_val.length) || 0),
          _snr_avg: Math.round(100 * ((_snr_val.reduce((a, b) => a + b, 0) / _snr_val.length) || 0)) / 100,
          _rssi_total: _rssi_val, 
          _snr_total: _snr_val,
          _SF: frame.txInfo.loRaModulationInfo.spreadingFactor,
        }
      })
    })
    dispatch({ type: UPDATE_HISTORY, history: historyGeojson, history_size: history.history_size });

  }
}

export const appendBroadcast = (frame) => {
  return (dispatch) => {
    let _rssi_val = [];
    let _snr_val = [];

    frame.rxInfo.forEach((gw) => _rssi_val.push(gw.rssi));
    frame.rxInfo.forEach((gw) => _snr_val.push(gw.loRaSNR));

    let element =
    {
      type: "Feature",
      geometry: {
        "type": "Point",
        "coordinates": [
          frame.objectJSON.gpsLocation["136"].longitude,
          frame.objectJSON.gpsLocation["136"].latitude,
          frame.objectJSON.gpsLocation["136"].altitude
        ]
      },
      properties: {
        timestamp: frame.timestamp,
        applicationId: frame.applicationID,
        applicationName: frame.applicationName,
        deviceName: frame.deviceName,
        deviceProfileName: frame.deviceProfileName,
        deviceProfileID: frame.deviceProfileID,
        devEUI: frame.devEUI,
        adr: frame.adr,
        fCnt: frame.fCnt,
        fPort: frame.fPort,
        txInfo: frame.txInfo,
        rxInfo: frame.rxInfo,
        _rxInfo_len: frame.rxInfo.length,
        _rssi_avg: Math.round((_rssi_val.reduce((a, b) => a + b, 0) / _rssi_val.length) || 0),
        _snr_avg: Math.round(100 * ((_snr_val.reduce((a, b) => a + b, 0) / _snr_val.length) || 0)) / 100,
        _SF: frame.txInfo.loRaModulationInfo.spreadingFactor,
        _rssi_total: _rssi_val,
        _snr_total: _snr_val,
      }
    }
    dispatch({ type: APPEND_BROADCAST, frame: element });
  }
}

export const setFilter = (filter) => {
  return (dispatch) => {
    dispatch({ type: SET_FILTER, filter: filter });
  }
}

export const setViewState = (state) => {
  return (dispatch) => {
    dispatch({ type: FOLLOW_VIEWSTATE, view: { longitude: state.object.gpsLocation["136"].longitude, latitude: state.object.gpsLocation["136"].latitude } });
  }

}
export const mouseViewState = (state) => {
  return (dispatch) => {
    dispatch({ type: UPDATE_VIEWSTATE, view: { longitude: state.longitude, latitude: state.latitude, zoom: state.zoom } });
  }
}

export const followCameraViewState = (state) => {
  return (dispatch) => {
    dispatch({ type: TOGGLE_FOLLOW_CAMERA, follow: { camera: state } });
  }
}
export const changeMapStyle = (state) => {
  return (dispatch) => {
    dispatch({ type: CHANGE_MAP_STYLE, state });
  }
}
export const addActiveNodes = (node) => {
  return (dispatch) => {
    let _rssi_avg = [];
    let _snr_avg = [];

    node.rxInfo.forEach((gw) => _rssi_avg.push(gw.rssi));
    node.rxInfo.forEach((gw) => _snr_avg.push(gw.loRaSNR));

    dispatch({
      type: ADD_ACTIVE_DEVICES, active: {
        node: [{
          deviceName: node.deviceName,
          lastSeen: 0,
          timestamp: node.timestamp,
          _avg_rssi: Math.round((_rssi_avg.reduce((a, b) => a + b, 0) / _rssi_avg.length) || 0),
          _avg_snr: Math.round(100 * ((_snr_avg.reduce((a, b) => a + b, 0) / _snr_avg.length) || 0)) / 100,
          _SF: node.txInfo.loRaModulationInfo.spreadingFactor,
          _gws: node.rxInfo.length
        }]
      }
    });
  }
}

export const tickActiveDevices = (limit) => {
  return (dispatch) => {
    dispatch({
      type: TICK_ACTIVE_DEVICES, limit
    });
  }
}
export const setVisibleGeojson = (geojson, rawData) => {
  let gateway_dict = {};
  let client_dict = {};
  let visible = geojson;

  // console.log("Geodata transmitted")
  rawData.features.forEach((feature) => {
    if (!(feature.properties.devEUI in client_dict)) {
        client_dict[feature.properties.devEUI] = {
        deviceName: feature.properties.deviceName,
        deviceProfileName: feature.properties.deviceProfileName,
        packets: 0,
      }
    }
    feature.properties.rxInfo.forEach((gw) => {
        if ("gwcoord" in gw) {
          if (!(gw.gwcoord.id in gateway_dict)) {
            gateway_dict[gw.gwcoord.id] = {
              packets: 0,
              name: gw.gwcoord.name,
            }
          }
        }
    })
  })

  visible.features.forEach((feature) => {
    client_dict[feature.properties.devEUI]["packets"] = client_dict[feature.properties.devEUI]["packets"] + 1;
    feature.properties.rxInfo.forEach((gw) => {
      if ("gwcoord" in gw) {
          gateway_dict[gw.gwcoord.id]["packets"] = gateway_dict[gw.gwcoord.id]["packets"] + 1;
        
      }
    })
  })

  return (dispatch) => {
    dispatch({
      type: SET_VISIBLE_GEOJSON, 
      gateways: gateway_dict,
      clients: client_dict,
      geojson
    });
  }
}

export const setDateFilter = (datefilter) => {
  return (dispatch) => {
    dispatch({
      type: SET_DATE_FILTER, from: datefilter.from, to: datefilter.to,
    });
  }
}
export const setNowChecked = (isChecked) => {
  return (dispatch) => {
    dispatch({
      type: SET_NOW_CHECKED_TIMER, nowChecked: isChecked,
    });
  }
}

export const setGatewayFilter = (gateways) => {
  return (dispatch) => {
    dispatch({
      type: SET_GATEWAY_FILTER, gateways,
    });
  }
}
export const setGeojsonData = (data) => {
  return (dispatch) => {
    dispatch({
      type: SET_GEOJSON_DATA, data,
    });
  }
}

export const setClientFilter = (client) => {
  return (dispatch) => {
    dispatch({
      type: SET_CLIENT_FILTER, client,
    });
  }
}