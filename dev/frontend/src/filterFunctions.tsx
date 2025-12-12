
export const filterByRssi = (rawData, filteredData, selected) => {
    rawData.filter((elem) => {
        return elem[3] <= selected;
    }).then((elem) => {
        filteredData.push(elem)
    })
}
/**
 * Helperfunction to apply the selected filter settings. The output of this should be the visible part of the stored data. 
 */
export const applyCombinedFilter = (geodata, filter) => {
    let newgeojson = { ...geodata };
    newgeojson.features = newgeojson.features.filter((element) => {
        let _every_rssi = [];
        let gateway_ids = [];

        element.properties.rxInfo.forEach((gw) => {
            _every_rssi.push(gw.rssi);
            if ("gwcoord" in gw) {
                gateway_ids.push(gw.gwcoord.id)
            } else {
               // console.log("Missing gwcoord field: ",gw); // Verbose output 
            }
        })
        let rssi_from = _every_rssi.some(rssi => rssi <= filter.rssi.from);
        let rssi_to = _every_rssi.some(rssi => rssi >= filter.rssi.to);
        let filter_gateway = true;
        if (filter.gateway.length > 0) {
            filter_gateway = filter.gateway.some(e => gateway_ids.includes(e));
        }
        return rssi_from && rssi_to && filter_gateway;
    }).filter((element) => {
        let _every_snr = [];
        element.properties.rxInfo.forEach((gw) => _every_snr.push(gw.loRaSNR));
        let snr_from = _every_snr.some(snr => snr >= filter.snr.from)
        let snr_to = _every_snr.some(snr => snr <= filter.snr.to)
        return snr_from && snr_to
    }).filter((element) => {
        return element.geometry.coordinates[2] >= filter.altitude.from &&
            element.geometry.coordinates[2] <= filter.altitude.to;
    }).filter((element) => {
        let sf = element.properties.txInfo.loRaModulationInfo.spreadingFactor;
        return sf >= filter.sf.from && sf <= filter.sf.to;
    }).filter((element) => {
        if (filter.nowChecked) {
            return filter.date.from < element.properties.timestamp;
        } else {
            return filter.date.from < element.properties.timestamp && element.properties.timestamp < filter.date.to;
        }
    }).filter((element) => {
        let filter_client = true;
        if (filter.client.length > 0) {
            filter_client = filter.client.includes(element.properties.devEUI)
        }
        return filter_client
    })
    return newgeojson
}
export let dr_to_sf = [12, 11, 10, 9, 8, 7];
