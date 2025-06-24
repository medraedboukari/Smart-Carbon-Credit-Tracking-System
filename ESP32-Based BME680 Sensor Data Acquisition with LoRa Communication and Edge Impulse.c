#include <Wire.h>
#include <bsec.h>
#include <WiFi.h>
#include <ESP32Time.h> 
#include <CO2_Prediction_inferencing.h> // Edge Impulse library
#include <SPI.h>
#include <LoRa.h>

#define SS      16
#define RST     17
#define DIO0    2
#define SCK     15  // SPI Clock
#define MISO    12  // Master In Slave Out
#define MOSI    13  // Master Out Slave In

// Create an object for the BME680 sensor
Bsec iaqSensor;

// Define I2C pins
#define SDA_PIN 20
#define SCL_PIN 21

const char* ssid = "Orange TN"; // Replace with your Wi-Fi SSID
const char* password = "Raaaed03"; // Replace with your Wi-Fi password

// ESP32Time object
ESP32Time rtc;

// Edge Impulse variables
static float features[EI_CLASSIFIER_DSP_INPUT_FRAME_SIZE]; // Buffer for sensor data
unsigned long lastPredictionTime = 0; // Track the last prediction time
const unsigned long predictionInterval = 5000; // 5 seconds in milliseconds

// Number of readings before making a prediction
const int numReadings = 10;
int readingCounter = 0;
float accumulatedTemperature = 0.0;
float accumulatedHumidity = 0.0;
float accumulatedPressure = 0.0;

// Helper function to check BSEC errors
void checkIaqSensorStatus(void) {
  if (iaqSensor.bsecStatus != BSEC_OK) {
    Serial.println("BSEC error code: " + String(iaqSensor.bsecStatus));
    while (1); // Halt if there's an error
  }

  if (iaqSensor.bme68xStatus != BME68X_OK) {
    Serial.println("BME680 error code: " + String(iaqSensor.bme68xStatus));
    while (1); // Halt if there's an error
  }
}

// Function to perform Edge Impulse inference
void performInference(float temperature, float humidity, float pressure) {
  // Fill the features array with sensor data
  features[0] = temperature;  // Temperature (°C)
  features[1] = humidity;     // Humidity (%)
  features[2] = pressure / 100.0; // Pressure (hPa)

  // Debugging: Print features
  Serial.print("Features: ");
  Serial.print(features[0]); Serial.print(" °C, ");
  Serial.print(features[1]); Serial.print(" %, ");
  Serial.print(features[2]); Serial.println(" hPa");

  // Perform inference
  ei_impulse_result_t result;
  signal_t signal;
  numpy::signal_from_buffer(features, EI_CLASSIFIER_DSP_INPUT_FRAME_SIZE, &signal);
  EI_IMPULSE_ERROR res = run_classifier(&signal, &result, false);

  // Check for inference errors
  if (res != EI_IMPULSE_OK) {
    Serial.println("Inference failed!");
    return;
  }

  // If this is a regression output, just print the predicted value
  // Print the first result from the inference output (assuming it's the eCO2 prediction)
  Serial.println("Prediction result:");
  Serial.print("Predicted eCO2: ");
  Serial.println(result.classification[0].value); // Assuming the first classification is the CO2 value

  // Send the predicted eCO2 value over LoRa
  String message = "Prediction result: ";
  message += "Predicted eCO2: ";
  message += result.classification[0].value;

  // Send the message over LoRa
  LoRa.beginPacket();
  LoRa.print(message);
  LoRa.endPacket();
  Serial.println("Message sent over LoRa: " + message);
}

// Function to send all sensor data over LoRa (without bVOC and IAQ)
void sendSensorData(float temperature, float humidity, float pressure, float eco2) {
  // Get the current date and time
  String formattedDateTime = rtc.getTime("%Y/%m/%d %H:%M:%S"); // Format YYYY/MM/DD HH:MM:SS

  // Create a message with all sensor data and date/time
  String message = "Date and Time: " + formattedDateTime + ", ";
  message += "Temperature: " + String(temperature) + " °C, ";
  message += "Humidity: " + String(humidity) + " %, ";
  message += "Pressure: " + String(pressure / 100.0) + " hPa, ";
  message += "eCO2: " + String(eco2) + " ppm";

  // Send the message over LoRa
  LoRa.beginPacket();
  LoRa.print(message);
  LoRa.endPacket();

  // Print the sent message to Serial Monitor
  Serial.println("Sent message: " + message);
}

void setup() {
  Serial.begin(9600);
  while (!Serial); // Wait for Serial to initialize
  Serial.println("Initializing BME680, Wi-Fi, and LoRa...");

  // Initialize custom I2C pins
  Wire.begin(SDA_PIN, SCL_PIN);

  // Initialize the BME680 sensor
  iaqSensor.begin(BME68X_I2C_ADDR_HIGH, Wire); // Use BME68X_I2C_ADDR_LOW for SDO = GND
  checkIaqSensorStatus(); // Check for errors

  // Configure the sensor outputs (removed IAQ and bVOC related outputs)
  bsec_virtual_sensor_t sensorList[7] = {
    BSEC_OUTPUT_RAW_TEMPERATURE,
    BSEC_OUTPUT_RAW_PRESSURE,
    BSEC_OUTPUT_RAW_HUMIDITY,
    BSEC_OUTPUT_RAW_GAS,
    BSEC_OUTPUT_CO2_EQUIVALENT, // eCO2 output
    BSEC_OUTPUT_SENSOR_HEAT_COMPENSATED_TEMPERATURE,
    BSEC_OUTPUT_SENSOR_HEAT_COMPENSATED_HUMIDITY,
  };

  iaqSensor.updateSubscription(sensorList, 7, BSEC_SAMPLE_RATE_LP);
  checkIaqSensorStatus(); // Check for errors

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to Wi-Fi!");

  // Initialize LoRa
  SPI.begin(SCK, MISO, MOSI, SS);
  LoRa.setPins(SS, RST, DIO0);
  if (!LoRa.begin(433E6)) {
    Serial.println("Failed to initialize LoRa!");
    while (1);
  }
  LoRa.setSyncWord(0x34);
  LoRa.setTxPower(20);
  LoRa.setSpreadingFactor(7);
  LoRa.setSignalBandwidth(125E3);
  Serial.println("LoRa transmitter initialized");

  // Configure NTP and synchronize time
  configTime(3600, 0, "pool.ntp.org"); // GMT+1, no DST
  Serial.println("Synchronizing time with NTP server...");

  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Failed to obtain time");
    return;
  }

  rtc.setTimeStruct(timeinfo);
  Serial.println("BME680, LoRa, and ESP32Time initialized successfully!");
}

void loop() {
  // Check if new data is available
  if (iaqSensor.run()) {
    // Read sensor data (only temperature, humidity, pressure, and eCO2)
    float temperature = iaqSensor.temperature;
    float humidity = iaqSensor.humidity;
    float pressure = iaqSensor.pressure; // Pressure in Pascals (Pa)
    float eco2 = iaqSensor.co2Equivalent; // eCO2 value

    // Accumulate readings
    accumulatedTemperature += temperature;
    accumulatedHumidity += humidity;
    accumulatedPressure += pressure;
    readingCounter++;

    // Check if we've accumulated enough readings
    if (readingCounter >= numReadings) {
      // Calculate the average sensor readings
      float avgTemperature = accumulatedTemperature / numReadings;
      float avgHumidity = accumulatedHumidity / numReadings;
      float avgPressure = accumulatedPressure / numReadings;

      // Perform inference based on the average values
      performInference(avgTemperature, avgHumidity, avgPressure);

      // Send all sensor data over LoRa (without IAQ and bVOC)
      sendSensorData(avgTemperature, avgHumidity, avgPressure, eco2);

      // Reset the counter and accumulated values
      readingCounter = 0;
      accumulatedTemperature = 0.0;
      accumulatedHumidity = 0.0;
      accumulatedPressure = 0.0;
    }

    // Print the latest readings (without IAQ and bVOC)
    String formattedDateTime = rtc.getTime("%Y/%m/%d %H:%M:%S"); // Format YYYY/MM/DD HH:MM:SS
    Serial.print("Date and Time: "); Serial.println(formattedDateTime);
    Serial.print("Temperature: "); Serial.print(temperature); Serial.println(" °C");
    Serial.print("Humidity: "); Serial.print(humidity); Serial.println(" %");
    Serial.print("Pressure: "); Serial.print(pressure / 100.0); Serial.println(" hPa");
    Serial.print("eCO2: "); Serial.println(eco2);
    Serial.println("------");
  }
  
  delay(500); // Wait before taking the next reading
}
