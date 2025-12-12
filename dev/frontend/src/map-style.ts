import type {HeatmapLayer} from 'react-map-gl';
/**
 * Containing multiple mapstyles that affect the appearance of the rendered data. 
 * The radio buttons on the control panel for selecting SNR or SF are used to switch between the mapstyles. 
 */

export const heatmapLayer: HeatmapLayer = {
 'id': 'heatmap',
'type': 'heatmap',
'source': 'geojson',
'maxzoom': 19,
'paint': {
// Increase the heatmap weight based on frequency and property magnitude
'heatmap-weight': [
'interpolate',
['linear'],
['get', 'mag'],
0,
    0,
  6,
0
],
// Increase the heatmap color weight weight by zoom level
// heatmap-intensity is a multiplier on top of heatmap-weight
'heatmap-intensity': [
'interpolate',
['linear'],
['zoom'],
0,
4,
7,
2
],
// Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
// Begin color ramp at 0-stop with a 0-transparancy color
// to create a blur-like effect.
'heatmap-color': [
'interpolate',
['linear'],
['heatmap-density'],
0,
'rgba(33,102,172,0)',
0.2,
'rgb(103,169,207)',
0.4,
'rgb(209,229,240)',
0.6,
'rgb(253,219,199)',
0.8,
'rgb(239,138,98)',
1,
'rgb(178,24,43)'
],
// Adjust the heatmap radius by zoom level
'heatmap-radius': [
'interpolate',
['linear'],
['zoom'],
8,
20,
  17,
  20,
],
// Transition from heatmap to circle layer by zoom level
'heatmap-opacity': [
'interpolate',
['linear'],
['zoom'],
7,
1,
16,
0
]
}
}


export const pointStyle_SNR_RSSI = {
    id: 'point',
    type: 'circle' as 'sky',
    source: 'geojson',
    minzoom: 13,
    paint: {
      // increase the radius of the circle as the zoom level and dbh value increases
     'circle-radius': {
        type: 'exponential',
        property: '_rssi_avg',
        stops: [
          [-120, 3],
          [-108, 6],
          [-100, 10],
          [-90, 15],
          [0, 20],
        ]
      },
      'circle-color': {
        property: '_snr_avg',
        // type: 'interval', // CATEGORICAL is a step functions or == equals
        stops: [
          [-20, 'rgb(165,15,2)'],
          [-4, 'rgb(251,106,74)'],
          [2, 'rgb(237, 237, 90)'],
          [10, 'rgb(93, 237, 90)'],
        ],
      },
      'circle-stroke-color': 'white',
      'circle-stroke-width': 2,
      'circle-opacity': {
        stops: [
          [13, 0],
          [16, 1]
        ]
      }
    }
  }


  

  export const pointStyle_SF_RSSI = {
    id: 'point',
    type: 'circle' as 'sky',
    source: 'geojson',
    minzoom: 13,
    paint: {
      // increase the radius of the circle as the zoom level and dbh value increases
      'circle-radius': {
        type: 'exponential',
        property: '_rssi_avg',
        stops: [
          [-120, 3],
          [-108, 6],
          [-100, 10],
          [-90, 15],
          [0, 20],
        ]
      },
      'circle-color': {
        property: '_SF',
        type: 'categorical', // CATEGORICAL is a step functions or == equals
        stops: [
          [7, 'rgb(242, 27, 231)'],
          [8, 'rgb(240, 16, 31)'],
          [9, 'rgb(240, 94, 31)'],
          [10, 'rgb(240, 225, 17)'],
          [11, 'rgb(36, 240, 17)'],
          [12, 'rgb(16, 220, 235)'],

        ],
      },
      'circle-stroke-color': 'white',
      'circle-stroke-width': 2,
      'circle-opacity': {
        stops: [
        [13, 0],
          [16, 1]
        ]
      }
    }
  }