const WebSocket = require('ws');
const mqtt = require('mqtt');
const { PrismaClient } = require('@prisma/client'); // Import Prisma client

const prisma = new PrismaClient(); // Initialize Prisma client

// MQTT broker configuration
const mqttServer = 'mqtt://192.168.23.10'; // Replace with your MQTT broker address
const mqttTopic = 'lora/data'; // MQTT topic to subscribe to

// Create WebSocket server
const wss = new WebSocket.Server({ port: 8080 });
console.log('WebSocket server is running on ws://localhost:8080');

// Connect to MQTT broker
const mqttClient = mqtt.connect(mqttServer);

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  mqttClient.subscribe(mqttTopic, (err) => {
    if (err) {
      console.error('Failed to subscribe to MQTT topic:', err);
    } else {
      console.log(`Subscribed to MQTT topic: ${mqttTopic}`);
    }
  });
});

// Helper function to parse plain text MQTT messages
function parseMessage(message) {
  const messageStr = message.toString();

  // Handle "Prediction result" message
  if (messageStr.startsWith("Prediction result")) {
    const match = messageStr.match(/Predicted eCO2: ([\d.]+)/);
    if (match) {
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() + 1); // Adjust to UTC+1
      return {
        type: "prediction",
        timestamp: timestamp.toISOString(),
        predictedEmission: parseFloat(match[1]), // Predicted gas emission
      };
    }
  }

  // Handle "Date and Time" message
  if (messageStr.startsWith("Date and Time")) {
    const match = messageStr.match(
      /Date and Time: ([\d/ :]+), Temperature: ([\d.]+) °C, Humidity: ([\d.]+) %, Pressure: ([\d.]+) hPa, eCO2: ([\d.]+) ppm/
    );
    if (match) {
      const timestamp = new Date(match[1]);
      timestamp.setHours(timestamp.getHours() + 1); // Adjust to UTC+1
      return {
        type: "sensor",
        timestamp: timestamp.toISOString(),
        temperature: parseFloat(match[2]),
        humidity: parseFloat(match[3]),
        pressure: parseFloat(match[4]),
        gasEmission: parseFloat(match[5]),
      };
    }
  }

  // If the message format is unknown, return null
  return null;
}

// Function to save parsed data to the database
async function saveToDatabase(parsedMessage) {
  try {
    if (parsedMessage.type === "sensor") {
      await prisma.sensorData.create({
        data: {
          timestamp: new Date(parsedMessage.timestamp),
          temperature: parsedMessage.temperature,
          humidity: parsedMessage.humidity,
          pressure: parsedMessage.pressure,
          gasEmission: parsedMessage.gasEmission,
        },
      });
    } else if (parsedMessage.type === "prediction") {
      await prisma.predictionData.create({
        data: {
          timestamp: new Date(parsedMessage.timestamp),
          predictedEmission: parsedMessage.predictedEmission,
        },
      });
    }
    console.log("Data saved to database:", parsedMessage);
  } catch (error) {
    console.error("Failed to save data to database:", error);
  }
}

// Forward MQTT messages to WebSocket clients and save to database
mqttClient.on('message', async (topic, message) => {
  console.log(`Received message from MQTT: ${message.toString()}`);

  // Parse the MQTT message
  const parsedMessage = parseMessage(message);

  if (parsedMessage) {
    const formattedMessage = JSON.stringify(parsedMessage);

    // Save to database
    await saveToDatabase(parsedMessage);

    // Send the formatted message to WebSocket clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(formattedMessage);
      }
    });
  } else {
    console.error('Failed to parse MQTT message: Invalid format');
  }
});
