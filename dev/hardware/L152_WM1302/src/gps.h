#pragma once
#include <Arduino.h>
#include <TinyGPSPlus.h>
#include <HardwareSerial.h>
#include "sdcard.h"
namespace GPS
{
    struct gpsval
    {
        float latitude;
        float longitude;
        float altitude;
        float speed;
        int8_t satellites;
        bool valid_position;
        bool valid_time;
    };
    extern uint32_t GPSBaud;
    extern TinyGPSPlus gps;
    extern HardwareSerial SerialGPS;
    void get_timestamp(SdFile*);
    void get_location(SdFile*);
    void get_auxiliary_data(SdFile *);

    void gps_init(void);
    void gps_loop(void);
    // gpsval get_gps(void);
    void display_info(void);

}