#define LMIC_DEBUG_LEVEL 1
// #define IMPLEMENT_SPI_PORT_SELECTION ´1
#define TX_OUTPUT_POWER 14 
#include "gps.h"
#include "lora_mod.h"
#include "sdcard.h"

void setup()
{
    Serial.begin(9600);
    Serial.println(F("Starting"));
    init_sdcard();
    GPS::gps_init();
    init_lora();
}

void loop()
{
    //gps.encode(SerialGPS.read());
    GPS::gps_loop();
    lora_loop();
    sdcard_loop();
}
