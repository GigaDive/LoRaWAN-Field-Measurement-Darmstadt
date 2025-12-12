#define SPI2_NSS_PIN PB12 // SPI_2 Chip Select pin is PB12. You can change it to the STM32 pin you want.

#include "sdcard.h"
#include "gps.h"
#include "lora_mod.h"
// set ENABLE_EXTENDED_TRANSFER_CLASS non-zero to use faster EX classes

// Use first SPI port

#define SPI_SPEED 4
// SPIClass SPI_2(PB15, PB14, PB13);
#define SD_PIN PB12
SPIClass SPI_2(PB15, PB14, PB13);
// SPIClass SD_SPI(2);
SdFat sd(&SPI_2);
// SHARED_SPI

// #define SD_CONFIG SdSpiConfig(SD_PIN, DEDICATED_SPI, SD_SCK_MHZ(SPI_SPEED), &SPI_2)
//#define SD_CONFIG SdSpiConfig(SD_PIN, SDCARD_SPI, SD_SCK_MHZ(SPI_SPEED), 2)

// SdFat sd((SPIClass *)&SPI_2);
// SdFat sd1;
// SdFatEX sd1;
const uint8_t SD1_CS = SD_PIN; // chip select for sd1
const uint8_t chipSelect = SD_PIN;
const uint32_t SAMPLE_INTERVAL_MS = 1000;

// Use second SPI port
// SPIClass SPI_2(2);
// SdFat sd2(&SPI_2);
// SdFatEX sd2(&SPI_2);

const uint8_t BUF_DIM = 100;
uint8_t buf[BUF_DIM];

const uint32_t FILE_SIZE = 1000000;
const uint16_t NWRITE = FILE_SIZE / BUF_DIM;
#define FILE_BASE_NAME "Data"
// File system object.
// Log file.
SdFile file;
File fCountFile;
// Time in micros for next data record.
uint32_t logTime;
String filename;
//==============================================================================
// User functions.  Edit writeHeader() and logData() for your requirements.
const uint8_t ANALOG_COUNT = 5;
//------------------------------------------------------------------------------
// print error msg, any SD error codes, and halt.
// store messages in flash
#define errorExit(msg) errorHalt(F(msg))
#define initError(msg) initErrorHalt(F(msg))

int fCountABP;

// Writing file header for logging data
void writeHeader()
{
    file.print(F("fcount,timestamp,latitude,longitude,altitude,satellites,speed"));
    file.println();
    file.close();
}

// log gps data to sd card
void logData()
{
    if (!file.open(filename.c_str(), O_CREAT | O_WRITE | O_APPEND))
    {
        Serial.println("[!!] Write error logdata");
    }
    
    file.print(LMIC.seqnoUp);
    file.print(',');
    GPS::get_timestamp(&file);
    file.print(",");
    GPS::get_location(&file);
    file.print(",");
    GPS::get_auxiliary_data(&file);
    file.println();

    file.close();
}

//==============================================================================
// Error messages stored in flash.
#define error(msg) sd.errorHalt(F(msg))
//------------------------------------------------------------------------------

// Inits sd card, checks for free file name and writes the header to the file
void init_sdcard()
{

    const uint8_t BASE_NAME_SIZE = sizeof(FILE_BASE_NAME) - 1;
    char fileName[13] = FILE_BASE_NAME "00.csv";
    delay(500);

    if (!sd.begin(SD_PIN, SD_SCK_MHZ(SPI_SPEED)))
    {
        sd.initErrorHalt();
    }

    // Find an unused file name.
    if (BASE_NAME_SIZE > 6)
    {
        error("FILE_BASE_NAME too long");
    }
    while (sd.exists(fileName))
    {
        if (fileName[BASE_NAME_SIZE + 1] != '9')
        {
            fileName[BASE_NAME_SIZE + 1]++;
        }
        else if (fileName[BASE_NAME_SIZE] != '9')
        {
            fileName[BASE_NAME_SIZE + 1] = '0';
            fileName[BASE_NAME_SIZE]++;
        }
        else
        {
            error("Can't create file name");
        }
    }
    if (!file.open(fileName, O_WRONLY | O_CREAT | O_EXCL))
    {
        error("file.open");
    }
    filename = fileName;
    // Read any Serial data.
    do
    {
        delay(10);
    } while (Serial.available() && Serial.read() >= 0);

    Serial.print(F("Logging to: "));
    Serial.println(filename);

    // Write data header.
    writeHeader();
    // Start on a multiple of the sample interval.
    logTime = micros() / (1000UL * SAMPLE_INTERVAL_MS) + 1;
    logTime *= 1000UL * SAMPLE_INTERVAL_MS;
}

// ONLY USED FOR ABP
// After every packet is sent, the function gets called and logs the current fcount on the sd card
// Whenever the node restarts, it checks the sd card for an old fCount an uses that instead of starting at 0 again
// prevents fcount collisions
void fcnt_up(uint32_t sqnumber)
{   
    char fCountFileName[11] = "fcount.txt";
    char fCount[10];

    if (sd.exists(fCountFileName)) {
        Serial.println("File exists, not overwriting");
        // has to be opened without write permissions, otherwise weird stuff happens
        fCountFile = sd.open(fCountFileName);

        Serial.println("--------------------------------------------------");
        Serial.println("Contents of File");

        if (fCountFile) {
        int counter = 0;
            // read number until new line
            while (fCountFile.available()) {
                char currentChar = fCountFile.read();
                if(currentChar == '\n'){
                    break;
                } else {
                    fCount[counter] = currentChar;
                    counter++;
                }
            }
            // convert and increase fCount value
            Serial.print("fCount Value read from file: ");
            Serial.println(fCount);
            fCountABP = atoi(fCount);
            fCountABP++;
            // fCount Value after Increase
            Serial.print("fCount value after increase:");
            Serial.println(fCountABP);
            fCountFile.close();

            // Delete old file and Write new counter value to it
            sd.remove(fCountFileName);
            fCountFile = sd.open(fCountFileName, FILE_WRITE);
            fCountFile.print(fCountABP);
            fCountFile.println();
            fCountFile.close();
        }

    }
    else {
        fCountFile = sd.open(fCountFileName, FILE_WRITE);
        Serial.println("File doesn't exist");

        fCountABP = 0;
        fCountFile.println(fCountABP);
        fCountFile.close();
    }
    // set fCount to right value
    LMIC.seqnoUp = fCountABP;
}


void sdcard_loop()
{
}
