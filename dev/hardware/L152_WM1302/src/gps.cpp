#include <Arduino.h>
#include <TinyGPSPlus.h>
#include <HardwareSerial.h>
#include "gps.h"
namespace GPS
{
    uint32_t GPSBaud = 9600;
    TinyGPSPlus gps;
    HardwareSerial SerialGPS(PC11, PC10);
    struct gpsval gps_measurements;

    void gps_init()
    {
        SerialGPS.begin(GPSBaud);
        gps_measurements.latitude = 0.0;
        
    }

    long printcounter = millis();
    
    void gps_loop()
    {
        while (SerialGPS.available() > 0)
            gps.encode(SerialGPS.read());
        gps_measurements.latitude = gps.location.lat();
        gps_measurements.longitude = gps.location.lng();
        gps_measurements.altitude = gps.altitude.meters();
        gps_measurements.speed = gps.speed.kmph();
        gps_measurements.satellites = gps.satellites.value();
        gps_measurements.valid_position = gps.location.isValid();
        gps_measurements.valid_time = gps.time.isValid();

        if (millis() > 5000 && gps.charsProcessed() < 10)
        {
            Serial.println(F("No GPS detected: check wiring."));
            while(true);
        }
    }

    void display_info()
    {
        Serial.print(F("Location: "));
        if (gps.location.isValid())
        {
            Serial.print(gps.location.lat(), 6);
            Serial.print(F(","));
            Serial.print(gps.location.lng(), 6);
        }
        else
        {
            Serial.print(F("INVALID"));
        }

        Serial.print(F("  Date/Time: "));
        if (gps.date.isValid())
        {
            Serial.print(gps.date.month());
            Serial.print(F("/"));
            Serial.print(gps.date.day());
            Serial.print(F("/"));
            Serial.print(gps.date.year());
        }
        else
        {
            Serial.print(F("INVALID"));
        }

        Serial.print(F(" "));
        if (gps.time.isValid())
        {
            if (gps.time.hour() < 10)
                Serial.print(F("0"));
            Serial.print(gps.time.hour());
            Serial.print(F(":"));
            if (gps.time.minute() < 10)
                Serial.print(F("0"));
            Serial.print(gps.time.minute());
            Serial.print(F(":"));
            if (gps.time.second() < 10)
                Serial.print(F("0"));
            Serial.print(gps.time.second());
            Serial.print(F("."));
            if (gps.time.centisecond() < 10)
                Serial.print(F("0"));
            Serial.print(gps.time.centisecond());
        }
        else
        {
            Serial.print(F("INVALID"));
        }
        Serial.print(" Satellites: ");
        Serial.print(gps.satellites.value());
        Serial.println();
    }

    void get_auxiliary_data(SdFile *file){
        file->print(gps.satellites.value());
        file->print(F(","));
        file->print(gps.speed.kmph());
    }

    void get_location(SdFile *file)
    {
        if (gps.location.isValid())
        {
            file->print(gps.location.lat(), 6);
            file->print(F(","));
            file->print(gps.location.lng(), 6);
            file->print(F(","));
            file->print(gps.altitude.meters(), 2);
        }
        else
        {
            file->print(F("0.00000,0.00000,0.00"));
        }
    }

    void get_timestamp(SdFile *file)
    {
        if (gps.date.isValid())
        {
            file->print(gps.date.month());
            file->print(F("/"));
            file->print(gps.date.day());
            file->print(F("/"));
            file->print(gps.date.year());
        }
        else
        {
            file->print(0);
            file->print(F("/"));
            file->print(0);
            file->print(F("/"));
            file->print(0);
        }

        file->print(F(" "));
        if (gps.time.isValid())
        {
            if (gps.time.hour() < 10)
                file->print(F("0"));
            file->print(gps.time.hour());
            file->print(F(":"));
            if (gps.time.minute() < 10)
                file->print(F("0"));
            file->print(gps.time.minute());
            file->print(F(":"));
            if (gps.time.second() < 10)
                file->print(F("0"));
            file->print(gps.time.second());
            file->print(F("."));
            if (gps.time.centisecond() < 10)
                file->print(F("0"));
            file->print(gps.time.centisecond());
        }
        else
        {
            file->print(F("00:00:00.00"));
        }
        // Serial.print(" Satellites: ");
        // Serial.print(gps.satellites.value());
        // Serial.println();
    }
}