# Smart Carbon Credit Tracking System

This repository contains the implementation of a **Smart Carbon Credit Tracking System**, an IoT-based project designed to monitor carbon emissions in real-time. Using advanced machine learning algorithms and modern web technologies, the system provides actionable insights to promote sustainable practices.

---

## Features

- **Real-Time Monitoring**: Tracks environmental parameters (temperature, humidity, pressure, gas levels) via IoT sensors.
- **Machine Learning Integration**: Predicts CO2 levels and detects anomalies using models deployed with [Edge Impulse](https://www.edgeimpulse.com/).
- **Edge Computing**: Processes data locally on an ESP32-S3 for enhanced efficiency.
- **LoRaWAN Communication**: Transmits data securely over long distances using SX1278 LoRa modules.
- **Modern Web Application**: Built with React and Next.js for real-time data visualization and alerting.
- **PostgreSQL Database**: Stores and manages historical data for analytics and reporting.
- **MQTT Communication**: Facilitates lightweight and efficient messaging between devices and the backend.

---

## System Architecture

The system consists of:

1. **IoT Node**:
   - ESP32-S3 with BME680 Sensor:
     - Collects environmental data.
     - Performs on-device ML predictions and anomaly detection.
     - Sends data via LoRa to the gateway ESP32.

2. **Gateway Node**:
   - Receives LoRa data and forwards it to the backend over MQTT.

3. **Backend**:
   - Manages MQTT communication.
   - Stores data in a PostgreSQL database.
   - Provides APIs for the frontend.

4. **Frontend**:
   - Real-time dashboard for monitoring and analytics.
   - Built with React and Next.js for optimal performance and scalability.

---

## Technologies Used

### Hardware

- ESP32-S3 WROOM 1 N8R2
- SX1278 LoRa modules
- Bosch BME680 sensor

### Software

- **Frontend**: React.js, Next.js
- **Backend**: Flask, Python, MQTT
- **Database**: PostgreSQL
- **Development Environment**: PlatformIO
- **Machine Learning**: Edge Impulse

---

## Setup Instructions

### Prerequisites

- Install [PlatformIO](https://platformio.org/) for ESP32 development.
- Set up an MQTT broker (e.g., [Mosquitto](https://mosquitto.org/)).
- Install PostgreSQL for database management.
- Install [Node.js](https://nodejs.org/) for React and Next.js.

---


