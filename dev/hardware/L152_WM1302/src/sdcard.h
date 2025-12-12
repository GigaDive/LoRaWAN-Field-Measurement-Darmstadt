#pragma once
// #define USE_STANDARD_SPI_LIBRARY 2
#include <Arduino.h>

// #define USE_STANDARD_SPI_LIBRARY 2
// #include <SPI.h>
#include "SdFat.h"

#include "FreeStack.h"

void init_sdcard(void);
void sdcard_loop(void);
void logData(void);
void fcnt_up(uint32_t);