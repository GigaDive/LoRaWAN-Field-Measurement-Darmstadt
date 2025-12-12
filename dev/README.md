# Lab LoRaWAN Coverage

## Installation

The main components of our evaluation are a backend written in python, a frontend written in typescript using the react framework including a redux store and a hardware component which represents the sending node in the architecture. The backend expects packets from the network server via an HTTP post request. This
has to be configured in your specific network server, e.g. ChirpStack, TTN, etc. The backend then logs all
the packets and forwards them to the frontend where all the visualization happens.

### Config

Entries in `backend/config.py` might be changed, especially the corresponding `WEBSOCKET_URL`.  
For the frontend, there might also be an IP change necessary inside the `frontend/src/heatmapGL.tsx` file.

### Backend

First we need to start the backend of our web application. For that, please install the requirements from the requirements.txt

`pip install -r requirements.txt`

After that start the backend

`python3 lora_backend.py`

### Frontend

Now head to `frontend` and type:

`npm i`

and after

`npm run start`

Now the browser should open with the web application.

### Hardware

#### RIOT LoRa GPS Tracker

For the [lora-gps-tracker](https://dev.seemoo.tu-darmstadt.de/LoRa/lora-gps-tracker) implementation of a lora gps tracker it is necessary to edit the makefile.
Change `BOARD`, `RIOTBASE`, `DEVICEEUI`, `DEVADDR`, `NWKSKEY` and `APPSKEY` variable according to your chirpstack settings.

#### Arduino

We use the Arduino Framework and the PlatformIO IDE inside VSCode.
If this extension is already installed, then proceed the following steps:

1. Rename `example_platformio.ini` to `platformio.ini`
2. Set the upload & monitor port to the one that your system uses for the device. (This can be checked inside PIO -> Devices)
3. Set your application key inside the `src/lora_mod.cpp`

### Used libraries and code fragments

#### Backend

- [autobahn](https://github.com/crossbario/autobahn-python) asycio implementation and client.
- [geopy](https://github.com/geopy/geopy) to calculate the distance between two location coordinates.
- [async-mqtt](https://github.com/sbtinstruments/asyncio-mqtt) initially their mqtt implementation but later on the example for combining multiple async co-routines with an [AsyncExitStack](https://github.com/sbtinstruments/asyncio-mqtt#advanced-use-).

#### Frontend

- [react-map-gl](https://visgl.github.io/react-map-gl/) One of the most important parts of our application. Choosen because of its large feature set and heatmap toolset.
- [material UI](https://mui.com/material-ui/getting-started/overview/) Multiple components and their examples.
- [React useWebSocket](https://github.com/robtaussig/react-use-websocket) Used as websocket component to transcieve data.
- [react-geojson](https://github.com/mjanssen/react-geojson) Used as a type for the geojson data.

#### Hardware

- [SdFat](https://github.com/greiman/SdFat) SdFat Library by Brill Greiman
- [SdFat data logger example](https://github.com/greiman/SdFat/blob/master/examples/examplesV1/dataLogger/dataLogger.ino) SdFat data logging example
- [MCCI Catena LMIC](https://github.com/mcci-catena/arduino-lorawan) Basic LoRa functionality for Arduino platform
- [Arduino LMIC OTAA/ABP Examples](https://github.com/matthijskooijman/arduino-lmic/tree/master/examples) ABP and OTAA examples for Arduino Platform
- [TinyGPSPlus](https://github.com/mikalhart/TinyGPSPlus) Code Example and Library for GPS location pulling
- [TinyGPSPlus_DeviceExample](https://github.com/mikalhart/TinyGPSPlus/blob/master/examples/DeviceExample/DeviceExample.ino) Modified to fit our needs.

#### Documentation

- [router_icon](https://www.flaticon.com/free-icon/router_3336923?term=router&page=1&position=25&page=1&position=25&related_id=3336923&origin=search)