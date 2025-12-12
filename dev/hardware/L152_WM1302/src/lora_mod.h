#pragma once
#include <Arduino.h>
#include <lmic.h>
#include <hal/hal.h>
#include <SPI.h>
#include <CayenneLPP.h>


    extern const u1_t PROGMEM APPEUI[8];
    extern const u1_t PROGMEM DEVEUI[8];
    extern const u1_t PROGMEM APPKEY[16];
    extern const lmic_pinmap lmic_pins;
    extern uint8_t LPP_data[7];
    extern osjob_t sendjob;
    void do_send(osjob_t *);
    void lora_loop(void);
    void init_lora(void);
    void printHex2(unsigned);
    void onReceive(void);
    void onEvent(ev_t);
