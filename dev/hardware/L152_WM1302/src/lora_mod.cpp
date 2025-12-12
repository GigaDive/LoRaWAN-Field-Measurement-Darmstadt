#include "lora_mod.h"
#include "sdcard.h"
#include "gps.h"
#include "sdcard.h"

static const int RXPin = PD_2, TXPin = PC_12;
const unsigned TX_INTERVAL = 5;
CayenneLPP lpp(24);
uint8_t LPP_data[7] = {0x01, 0x67, 0x00, 0x00, 0x02, 0x68, 0x00}; // 0x01,0x02 is Data Channel,0x67,0x68 is Data Type
const u1_t PROGMEM APPEUI[8] = {0x00, 0x00, 0x02, 0x03, 0x00, 0x00, 0x00, 0x00};
void os_getArtEui(u1_t *buf) { memcpy_P(buf, APPEUI, 8); }
const u1_t PROGMEM DEVEUI[8] = {0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
void os_getDevEui(u1_t *buf) { memcpy_P(buf, DEVEUI, 8); }
const u1_t PROGMEM APPKEY[16] = {0xbf,0x43,0x3a,0x7a,0xcf,0x4b,0x65,0xa7,0x9f,0xe3,0x63,0x01,0xb5,0x49,0xca,0x85};
void os_getDevKey(u1_t *buf) { memcpy_P(buf, APPKEY, 16); }

osjob_t sendjob;
const lmic_pinmap lmic_pins = {
    .nss = 10,
    .rxtx = LMIC_UNUSED_PIN,
    .rst = 5,
    .dio = {2, 3, LMIC_UNUSED_PIN},
};

void printHex2(unsigned v)
{
    v &= 0xff;
    if (v < 16)
        Serial.print('0');
    Serial.print(v, HEX);
}

void onReceive()
{
    Serial.println("Daten empfangen");
    // Serial.println((int8_t)LMIC.rssi);
    if (LMIC.pendTxPort == 1)
    {
        Serial.print("MAC message:");
        for (unsigned i = 0; i < LMIC.dataBeg; ++i)
        {
            Serial.print(" ");
            Serial.print(LMIC.frame[i], HEX);
        }
        Serial.println();
        return;
    }
}

void onEvent(ev_t ev)
{
    
    Serial.print(os_getTime());
    Serial.print(": ");
    switch (ev)
    {
    case EV_SCAN_TIMEOUT:
        Serial.println(F("EV_SCAN_TIMEOUT"));
        break;
    case EV_BEACON_FOUND:
        Serial.println(F("EV_BEACON_FOUND"));
        break;
    case EV_BEACON_MISSED:
        Serial.println(F("EV_BEACON_MISSED"));
        break;
    case EV_BEACON_TRACKED:
        Serial.println(F("EV_BEACON_TRACKED"));
        break;
    case EV_JOINING:
        LMIC_setDrTxpow(DR_SF7, 14);
        Serial.println(F("EV_JOINING"));
        break;
    case EV_JOINED:
        Serial.println(F("EV_JOINED"));
        {
            u4_t netid = 0;
            devaddr_t devaddr = 0;
            u1_t nwkKey[16];
            u1_t artKey[16];
            LMIC_getSessionKeys(&netid, &devaddr, nwkKey, artKey);
            Serial.print("netid: ");
            Serial.println(netid, DEC);
            Serial.print("devaddr: ");
            Serial.println(devaddr, HEX);
            Serial.print("AppSKey: ");
            for (size_t i = 0; i < sizeof(artKey); ++i)
            {
                if (i != 0)
                    Serial.print("-");
                printHex2(artKey[i]);
            }
            Serial.println("");
            Serial.print("NwkSKey: ");
            for (size_t i = 0; i < sizeof(nwkKey); ++i)
            {
                if (i != 0)
                    Serial.print("-");
                printHex2(nwkKey[i]);
            }
            Serial.println();
        }

        // LMIC.dn2Dr = DR_SF7;
        LMIC_setDrTxpow(DR_SF7, 14);
        LMIC_setAdrMode(0);
        //  LMIC_setLinkCheckMode(0);
        break;
    /*
    || This event is defined but not used in the code. No
    || point in wasting codespace on it.
    ||
    || case EV_RFU1:
    ||     Serial.println(F("EV_RFU1"));
    ||     break;
    */
    case EV_JOIN_FAILED:
        Serial.println(F("EV_JOIN_FAILED"));
        // LMIC_setDrTxpow(DR_SF7, 14);
        break;
    case EV_REJOIN_FAILED:
        Serial.println(F("EV_REJOIN_FAILED"));
        break;
    case EV_TXCOMPLETE:
        Serial.println(F("EV_TXCOMPLETE (includes waiting for RX windows)"));
        if (LMIC.txrxFlags & TXRX_ACK)
            Serial.println(F("Received ack"));
        if (LMIC.dataLen)
        {
            Serial.print(F("Received "));
            Serial.print(LMIC.dataLen);
            Serial.println(F(" bytes of payload"));
            onReceive();
        }
        GPS::display_info();
        // Schedule next transmission
        os_setTimedCallback(&sendjob, os_getTime() + sec2osticks(TX_INTERVAL), do_send);
        break;
    case EV_LOST_TSYNC:
        Serial.println(F("EV_LOST_TSYNC"));
        break;
    case EV_RESET:
        Serial.println(F("EV_RESET"));
        break;
    case EV_RXCOMPLETE:
        // data received in ping slot
        Serial.println(F("EV_RXCOMPLETE"));
        onReceive();
        break;
    case EV_LINK_DEAD:
        Serial.println(F("EV_LINK_DEAD"));
        break;
    case EV_LINK_ALIVE:
        Serial.println(F("EV_LINK_ALIVE"));
        break;
    /*
    || This event is defined but not used in the code. No
    || point in wasting codespace on it.
    ||
    || case EV_SCAN_FOUND:
    ||    Serial.println(F("EV_SCAN_FOUND"));
    ||    break;
    */
    case EV_TXSTART:
        Serial.println(F("EV_TXSTART"));
        Serial.println((int8_t)LMIC.rssi);

        break;
    case EV_TXCANCELED:
        Serial.println(F("EV_TXCANCELED"));
        break;
    case EV_RXSTART:
        /* do not print anything -- it wrecks timing */
        break;
    case EV_JOIN_TXCOMPLETE:
        Serial.println(F("EV_JOIN_TXCOMPLETE: no JoinAccept"));
        break;

    default:
        Serial.print(F("Unknown event: "));
        Serial.println((unsigned)ev);
        break;
    }
}

void do_send(osjob_t *j)
{
    // Check if there is not a current TX/RX job running
    if (LMIC.opmode & OP_TXRXPEND)
    {
        Serial.println(F("OP_TXRXPEND, not sending"));
    }
    else
    {
        lpp.reset();
        lpp.addGPS(136, GPS::gps.location.lat(),GPS::gps.location.lng(),GPS::gps.altitude.meters());
        //lpp.addGPS(136, 0,0,0);
        logData();
        
        // Comment in for ABP fcount logging on sd card
        // so that fcount is written to sd card after every paket and can be retrieved if the node restarts
        //fcnt_up(LMIC.seqnoUp);

        if (GPS::gpsval().valid_position)
        {
            Serial.println("Valid pos");
            LMIC_setTxData2(3, lpp.getBuffer(), lpp.getSize(), 0);
        }
        else
        {
            Serial.println("Invalid pos");

            LMIC_setTxData2(2, lpp.getBuffer(), lpp.getSize(), 0);
        }
        Serial.println(F("Packet queued"));
    }
    Serial.print("EEPROM: ");
    // Serial.println(fcnt_read());
    Serial.println(LMIC.seqnoUp);
    
    // Next TX is scheduled after TX_COMPLETE event.
}

void lora_loop()
{
    os_runloop_once();
}

void init_lora()
{

#ifdef VCC_ENABLE
    // For Pinoccio Scout boards
    pinMode(VCC_ENABLE, OUTPUT);
    digitalWrite(VCC_ENABLE, HIGH);
    delay(1000);
#endif
    LMIC_setClockError(MAX_CLOCK_ERROR * 1 / 100);
    // LMIC init
    os_init();
    // Reset the MAC state. Session and pending data transfers will be discarded.
    LMIC_reset();
#ifdef PROGMEM
    // On AVR, these values are stored in flash and only copied to RAM
    // once. Copy them to a temporary buffer here, LMIC_setSession will
    // copy them into a buffer of its own again.
    // uint8_t appskey[sizeof(APPSKEY)];
    // uint8_t nwkskey[sizeof(NWKSKEY)];
    // memcpy_P(appskey, APPSKEY, sizeof(APPSKEY));
    // memcpy_P(nwkskey, NWKSKEY, sizeof(NWKSKEY));
    // LMIC_setSession(0x1, DEVADDR, nwkskey, appskey);
#else
    // If not running an AVR with PROGMEM, just use the arrays directly
    //LMIC_setSession(0x1, DEVADDR, NWKSKEY, APPSKEY);
#endif
    LMIC_setAdrMode(0);
    Serial.println(LMIC.globalDutyAvail);

    LMIC_setDrTxpow(DR_SF7, 7);
    //LMIC.datarate = SF7;

    LMIC_setupChannel(0, 868100000, DR_RANGE_MAP(DR_SF12, DR_SF7), BAND_CENTI);  // g-band
    LMIC_setupChannel(1, 868300000, DR_RANGE_MAP(DR_SF12, DR_SF7B), BAND_CENTI); // g-band
    LMIC_setupChannel(2, 868500000, DR_RANGE_MAP(DR_SF12, DR_SF7), BAND_CENTI);  // g-band
    LMIC_setupChannel(3, 867100000, DR_RANGE_MAP(DR_SF12, DR_SF7), BAND_CENTI);  // g-band
    LMIC_setupChannel(4, 867300000, DR_RANGE_MAP(DR_SF12, DR_SF7), BAND_CENTI);  // g-band
    LMIC_setupChannel(5, 867500000, DR_RANGE_MAP(DR_SF12, DR_SF7), BAND_CENTI);  // g-band
    LMIC_setupChannel(6, 867700000, DR_RANGE_MAP(DR_SF12, DR_SF7), BAND_CENTI);  // g-band
    LMIC_setupChannel(7, 867900000, DR_RANGE_MAP(DR_SF12, DR_SF7), BAND_CENTI);  // g-band
    LMIC_setupChannel(8, 868800000, DR_RANGE_MAP(DR_FSK, DR_FSK), BAND_MILLI);   // g2-band
    do_send(&sendjob);
}

