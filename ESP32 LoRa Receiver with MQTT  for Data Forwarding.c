#include <SPI.h>
#include <LoRa.h>
#include <WiFi.h>
#include <PubSubClient.h>

// WiFi credentials
const char* ssid = "Orange TN";           // Replace with your WiFi SSID
const char* password = "Raaaed03";        // Replace with your WiFi password

// MQTT broker credentials
const char* mqttServer = "192.168.23.10"; // Replace with your Mosquitto broker IP/hostname
const int mqttPort = 1883;                // Default Mosquitto port
const char* mqttTopic = "lora/data";      // MQTT topic to publish messages

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// LoRa Pins
#define SS      16
#define RST     17
#define DIO0    2
#define SCK     15  // SPI Clock
#define MISO    12  // Master In Slave Out
#define MOSI    13  // Master Out Slave In

void setup() {
  Serial.begin(9600);
  while (!Serial); // Wait for Serial to initialize
  Serial.println("Initializing LoRa receiver...");

  // Initialize LoRa
  SPI.begin(SCK, MISO, MOSI, SS);
  LoRa.setPins(SS, RST, DIO0);
  if (!LoRa.begin(433E6)) {
    Serial.println("Failed to initialize LoRa!");
    while (1);
  }

  // Configure LoRa settings
  LoRa.setSyncWord(0x34);                // Sync word must match the transmitter
  LoRa.setSpreadingFactor(7);            // Spreading factor (7-12)
  LoRa.setSignalBandwidth(125E3);        // Bandwidth (125 kHz)
  LoRa.setTxPower(20);                   // Transmit power (2-20 dBm)
  Serial.println("LoRa receiver initialized successfully!");

  // Initialize WiFi
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting...");
  }
  Serial.println("WiFi connected!");

  // Initialize MQTT
  mqttClient.setServer(mqttServer, mqttPort);
  while (!mqttClient.connected()) {
    Serial.println("Connecting to MQTT...");
    if (mqttClient.connect("LoRa_MQTT_Client")) {
      Serial.println("MQTT connected!");
    } else {
      Serial.print("Failed to connect. State: ");
      Serial.println(mqttClient.state());
      delay(2000);
    }
  }
}

void loop() {
  static int messageCounter = 0; // Counter for received messages

  // Check if a LoRa packet is received
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    // Read the incoming packet
    String receivedMessage = "";
    while (LoRa.available()) {
      receivedMessage += (char)LoRa.read();
    }
  
    // Increment message counter
    messageCounter++;

    // Print the received message with the counter
    Serial.print("Message #");
    Serial.print(messageCounter);
    Serial.print(": ");
    Serial.println(receivedMessage);
    Serial.println("-------------------------");

    // Publish the received message to MQTT
    if (mqttClient.publish(mqttTopic, receivedMessage.c_str())) {
      Serial.println("Message sent to MQTT!");
    } else {
      Serial.println("Failed to send message to MQTT!");
    }
  }

  // Maintain MQTT connection
  mqttClient.loop();
}

