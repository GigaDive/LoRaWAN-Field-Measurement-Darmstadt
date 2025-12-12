import * as React from 'react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import MapGL, { Source, Layer, Popup, ScaleControl, useMap, MapRef, NavigationControl } from 'react-map-gl';
import { heatmapLayer, pointStyle_SF_RSSI, pointStyle_SNR_RSSI } from './map-style';
import { FeatureCollection } from 'geojson'
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useSelector } from 'react-redux';
import { useAppDispatch } from './hooks/hooks';
import { appendBroadcast, updateHistory, setViewState, mouseViewState, addActiveNodes, setVisibleGeojson } from './actions/history';
import { applyCombinedFilter } from './filterFunctions';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';


const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

const styles = theme => ({
  root: {
    display: "flex"
  },

  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 0,
    padding: theme.spacing.unit * 0
  }
});

function HeatmapGL() {
  const mapRef = useRef<MapRef>();
  const dispatch = useAppDispatch();
  const history_transmitted = useSelector<any>((state) => state.history.history_transmitted);
  const history_size = useSelector<any>((state) => state.history.history_size);
  const local_size = useSelector<any>((state) => state.history.local_data_size);
  const visibleDataSizeSelector = useSelector<any>(state => state.history.visible_data_size);

  const geojson_store = useSelector((state: any) => state.history.geojson);
  const filter_store = useSelector((state: any) => state.history.filter);
  const viewState = useSelector((state: any) => state.history.viewState);
  const mapStyle = useSelector((state: any) => state.history.mapStyle);

  const followCameraSelector = useSelector((state: any) => state.history.viewState.followCamera);
  const [geodata, setGeodata] = useState<FeatureCollection>();
  const [pointStyle, setPointStyle] = useState<any>(pointStyle_SF_RSSI);
  const [hoverInfo, setHoverInfo] = useState({ rssi: null, snr: null, n_samples: null, n_features: null, avg_dist: null, gateway_name_list: [], sf: null, x: null, y: null } as any);
  const [localViewState, setLocalViewState] = useState({
    longitude: viewState.longitude,
    latitude: viewState.latitude,
    zoom: viewState.zoom,
    followCamera: false,
  } as any);



  const [showPopup, setShowPopup] = useState(true);

  // const [geodata, setGeodata] = useState<FeatureCollection>();
  const [rssiRange, setRssiRange] = useState([]);

  //Public API that will echo messages sent to it back to the client
  // >>>> CHANGE THIS IP
  const [socketUrl, setSocketUrl] = useState(process.env.WEBSOCKET_URL);

  const onNewLocation = ({ longitude, latitude }) => {
    mapRef.current?.flyTo({ center: [longitude, latitude], zoom: viewState.zoom, duration: 2000, curve: 1 });
  };

  const {
    sendMessage,
    sendJsonMessage,
    lastMessage,
    lastJsonMessage,
    readyState,
    getWebSocket,
  } = useWebSocket(socketUrl, {
    onOpen: () => {
      sendMessage('request_history');
      console.log('opened')
    },
    onMessage: (msg) => {
      let element = JSON.parse(msg.data);
      if (element.type == 'broadcast') {
        dispatch(appendBroadcast(element.object) as any)
        dispatch(addActiveNodes(element.object) as any)
        // console.log(Number(history_size) + " " + Number(history_transmitted) + " " + visibleDataSizeSelector)
        // console.log("Calling from heatmapGL.tsx onMessage something " + element.object.objectJSON.gpsLocation["136"].latitude + " " + element.object.objectJSON.gpsLocation["136"].longitude)
        //  if (followCameraSelector) dispatch(setViewState(element.object) as any)
        if (followCameraSelector) onNewLocation({ longitude: element.object.objectJSON.gpsLocation["136"].longitude, latitude: element.object.objectJSON.gpsLocation["136"].latitude })
      } else if (element.type == 'history') {
        if (history_size == null && history_transmitted == null || Number(history_transmitted) <= Number(history_size)) {
          dispatch(updateHistory(element) as any)
        }




      }
    },
    //Will attempt to reconnect on all close events, such as server shutting down
    shouldReconnect: (closeEvent) => true,
  });



  const handleClickSendMessage = useCallback(() => sendMessage('Hello'), []);
  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];
  // console.log("Rerender HeatmapGL")
  useEffect(() => {
    //TODO: NICHT JEDES MAL STORE KOMPLETT FILTERN; SONDERN NUR EINGEHENDE PAKETE UND BISHERIG GEFILTERTE

    let visible_geojson = applyCombinedFilter(geojson_store, filter_store);
    setGeodata(visible_geojson);
    dispatch(setVisibleGeojson(visible_geojson, geojson_store) as any);
  }, [geojson_store, filter_store, history_transmitted])

  useEffect(() => {
    dispatch(mouseViewState(localViewState) as any)
  }, [localViewState])


  useEffect(() => {
    if (mapStyle.pointStyle == 'RSSI_SNR') setPointStyle(pointStyle_SNR_RSSI);
    if (mapStyle.pointStyle == 'RSSI_SF') setPointStyle(pointStyle_SF_RSSI);
  }, [mapStyle])

  const onHoverFn = useCallback((event) => {

    const {
      features,
      point: { x, y },
      lngLat,
    } = event;
    const hoveredFeature = features && features[0];
    let rxInfos = features;
    let rssis = [];
    let snrs = [];
    let dists:number[] = [];
    let n_samples = 0;
    let _gw_name_list = new Set();
    features.forEach(element => {
      let rxInfo = JSON.parse(element.properties.rxInfo);
      n_samples += rxInfo.length;
      rxInfo.forEach(gateway => {
        if ("gwcoord" in gateway) {
          _gw_name_list.add(gateway.gwcoord.name)
        }
        rssis.push(gateway.rssi);
        snrs.push(gateway.loRaSNR);
        if (gateway["distance"] !== undefined) { 
          dists.push(gateway.distance);
        }
      })
    })
    let _avg_dist = [];
    if (dists.length > 0) {
      // _avg_dist = dists.reduce(function (avg, value, _, { length }) {
      //   return avg + value / length;
      // }, 0).toFixed(2);
      _avg_dist = [Math.min(...dists).toFixed(2), Math.max(...dists).toFixed(2)];
    }

    let _snr = Math.round(100 * ((snrs.reduce((a, b) => a + b, 0) / snrs.length) || 0)) / 100;
    let _rssi = Math.round((rssis.reduce((a, b) => a + b, 0) / rssis.length) || 0);
    let _SF = hoveredFeature.properties._SF;

    setHoverInfo({
      rssi: _rssi, snr: _snr, n_samples: n_samples, n_features: features.length,
      avg_dist: _avg_dist,
      gateway_name_list: _gw_name_list,
      sf: _SF,
      x: lngLat.lng,
      y: lngLat.lat
    });
  }, []);


  const onClosePopup = (event) => {
  }

  return (
    <>
      <MapGL
        // style={{ width: 800, height: 600 }}
        // onMouseMove={onMapLoad}
        reuseMaps
        {...viewState}
        ref={mapRef}
        onMove={evt => setLocalViewState(evt.viewState)}
        onMouseMove={onHoverFn}
        interactiveLayerIds={['heatmap', 'point']}
        initialViewState={{
          latitude: viewState.latitude,
          longitude: viewState.longitude,
          // outerWidth: "80%",
          //   outerHeight: "80%",
          zoom: viewState.zoom,
        }}
        mapStyle="mapbox://styles/mapbox/dark-v9"
        mapboxAccessToken={MAPBOX_TOKEN}
      //  style={{ position: "relative", top: 0, left:0,width: "100%" }}
      >

        {geodata && (
          <Source id="lorauplinks" type="geojson" data={geodata}>

            <Layer {...pointStyle} />
            <Layer  {...heatmapLayer} />
          </Source>
        )}
        {showPopup && (
          <Popup longitude={hoverInfo.x} latitude={hoverInfo.y}
            anchor="bottom"
            closeButton={false}
            closeOnClick={false}
            offset={[0, -10]}
            onClose={onClosePopup}
          >
            <div>#features: {hoverInfo.n_features}</div>
            <div>SNR: {hoverInfo.snr}</div>
            <div>RSSI: {(hoverInfo.rssi)}</div>
            <div>SF: {(hoverInfo.sf)}</div>
            <div>Min/Max Dist: {"[" + hoverInfo.avg_dist + "]"}</div>
            <div>GWs: {"[" + [...hoverInfo.gateway_name_list].join(',') + "]"} </div>
          </Popup>)}
        <NavigationControl position="top-left" />
        <ScaleControl />
      </MapGL>
    </>
  );
}

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

export default React.memo(HeatmapGL);