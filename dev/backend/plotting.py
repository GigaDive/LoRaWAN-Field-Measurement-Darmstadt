import os, json, glob
import math
import matplotlib.pyplot as plt
import numpy as np
import geopy.distance
import matplotlib as mpl
from config import GATEWAY_METADATA, GENERATE_TESTDATA, CHUNK_SIZE,WEBSOCKET_URL,HTTP_ENABLED



def seek_data():
    dataset = []
    if os.path.exists('logging'):
        print("logging exists")
        for filename in glob.glob('logging/*.csv'):
            #print(filename)
            with open(os.path.join(os.getcwd(), filename), 'r') as f: # open in readonly mode
                dataset.extend([json.loads(line.rstrip()) for line in f.readlines()])

        len_history = len(dataset)
    return dataset


def get_bearing(lat1,lon1,lat2,lon2):
    dLon = lon2 - lon1;
    y = math.sin(dLon) * math.cos(lat2);
    x = math.cos(lat1)*math.sin(lat2) - math.sin(lat1)*math.cos(lat2)*math.cos(dLon);
    brng = np.rad2deg(math.atan2(y, x));
    if brng < 0:
        brng+= 360
    
    return brng

def filter_by_gateway(data,gw_id):
    filtered = []
    for record in data:
        for gw in record["object"]["rxInfo"]:
            if gw["gatewayID"] == gw_id: 
                filtered.append(record)
    return filtered

def filter_distances(data,gw_id):
    distances = []
    rssi = []
    snr=[]
    publishedat = []
    for gw in data:
        for rx in gw["object"]["rxInfo"]:
            measurement_coord = gw["object"]["objectJSON"]["gpsLocation"]["136"]
            if rx["gatewayID"] == gw_id:
                gateway_coord = GATEWAY_METADATA[gw_id]
                gw_coord = (gateway_coord["latitude"], gateway_coord["longitude"])
                m_coord = (measurement_coord["latitude"], measurement_coord["longitude"])
                rssi.append(rx["rssi"])
                snr.append(rx["loRaSNR"])
                distances.append(geopy.distance.geodesic(gw_coord, m_coord).m)
    return distances, rssi, snr


def diy_histogram(rssi_list, dist_list,bins,method):
    if method == "AVG_RSSI":
        bin_avgs = []
        previous_bin = 0
        n_per_bin = []
        for current_bin in bins:
            current_vals = []
            for (dist, rssi) in zip(dist_list,rssi_list):
                if dist > previous_bin and dist <= current_bin:
                    current_vals.append(rssi)
            previous_bin = current_bin
            n_per_bin.append(len(current_vals))
            if len(current_vals) > 0:
                bin_avgs.append((np.min(current_vals),np.average(current_vals),np.max(current_vals)))
        return bin_avgs,n_per_bin
    if method == "AVG_SNR":
        bin_avgs = []
        previous_bin = 0
        n_per_bin = []
        for current_bin in bins:
            current_vals = []
            for (dist, rssi) in zip(dist_list,rssi_list):
                if dist > previous_bin and dist <= current_bin:
                    current_vals.append(rssi)
            previous_bin = current_bin
            n_per_bin.append(len(current_vals))
            if len(current_vals) > 0:
                bin_avgs.append((np.min(current_vals),np.average(current_vals),np.max(current_vals)))
        return bin_avgs,n_per_bin
    return None

def print_rssi_bins(data,gw_id,bins):
    gw = filter_by_gateway(data,gw_id)
    distances, rssi, snr = filter_distances(gw,gw_id)
    avgs_rssi,n_bins = diy_histogram(rssi,distances,bins,"AVG_RSSI")
    avgs_snr,n_bins = diy_histogram(snr,distances,bins,"AVG_SNR")

    for (dist, rssi, snr ,n_packets) in zip(bins,avgs_rssi,avgs_snr,n_bins):
        print(f"{dist} & {n_packets}  & {round(snr[1],2)} & {snr[0]} & {snr[2]} & {round(rssi[1],2)} & {rssi[0]} & {rssi[2]} \\\\")


def rf_coverage():
    data = seek_data()
    #chris_gw = filter_by_gateway(data,"0000000000000000")
    # chris_gw = filter_by_gateway(data,"b0d620a6cddb6962")
    
    
    print("ChrisGW")
    bins = [200,400,600,800,1000,1200,1400,1600,1800]
    print_rssi_bins(data,"0000000000000000",bins)
        
    print("Morneweg")
    bins = [300,600,900,1200,1500,1800,2100]
    print_rssi_bins(data,"0100000000000000",bins)

    print("Cysec")
    bins = [200,400,600,800,1000,1200,1400,1600,1800]
    print_rssi_bins(data,"b0d620a6cddb6962",bins)


    # print(len(list(filter(lambda x: x > 50 and x <= 100 ,distances))))
    # print(np.histogram(distances, [200,400,800,1000,1200]))
    # plt.hist2d(distances, rssi,log=True, bins=(60, 60), norm=mpl.colors.LogNorm(), cmap=plt.cm.jet)
    # plt.ylabel('RSSI (dBm)')
    # plt.xlabel('Range (m)');
    # plt.colorbar()
    # plt.show()

if __name__ == "__main__":
    rf_coverage()