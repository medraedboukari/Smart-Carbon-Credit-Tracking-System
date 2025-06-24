"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Moon, Sun, Thermometer, Droplets, Gauge, Wind } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatedCard } from "@/components/animated-card";
import { EmissionWarning } from "@/components/emission-warning";

interface SensorData {
  timestamp: string;
  temperature: number;
  humidity: number;
  pressure: number;
  gasEmission: number;
}

interface PredictionData {
  timestamp: string;
  predictedEmission: number;
}

const GAS_EMISSION_THRESHOLD = 1000; // ppm

export default function SmartCarbonDashboard() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [predictedEmissionData, setPredictedEmissionData] = useState<PredictionData[]>([]);
  const [currentData, setCurrentData] = useState<SensorData | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onmessage = (event) => {
      try {
        const newData = JSON.parse(event.data);

        if (newData.type === "sensor") {
          // Update sensor data
          setSensorData((prevData) => [...prevData, newData].slice(-50)); // Keep last 50 data points
          setCurrentData(newData);
        } else if (newData.type === "prediction") {
          // Update predicted emission data
          setPredictedEmissionData((prevData) => [...prevData, newData].slice(-50)); // Keep last 50 data points
        } else {
          console.error("Unknown data type:", newData);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", event.data, error);
      }
    };

    return () => ws.close();
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const isHighEmission = currentData && currentData.gasEmission > GAS_EMISSION_THRESHOLD;

  // Function to trigger a vocal warning
  const triggerVocalWarning = () => {
    if (isHighEmission) {
      const message = `Warning! Gas emission has exceeded the threshold of ${GAS_EMISSION_THRESHOLD} ppm. Current emission is ${currentData.gasEmission.toFixed(
        1
      )} ppm.`;
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = "en-US"; // Set the language to English
      utterance.rate = 1; // Set the speed of the speech
      speechSynthesis.speak(utterance);
    }
  };

  // Trigger the vocal warning when `isHighEmission` changes
  useEffect(() => {
    triggerVocalWarning();
  }, [isHighEmission]);

  return (
    <div className={`min-h-screen p-4 ${isDarkMode ? "dark" : ""}`}>
      <div className="fixed top-0 left-0 right-0 z-50">
        <AnimatePresence>
          {isHighEmission && <EmissionWarning emission={currentData.gasEmission} threshold={GAS_EMISSION_THRESHOLD} />}
        </AnimatePresence>
      </div>

      <motion.div animate={{ marginTop: isHighEmission ? "80px" : "0px" }} transition={{ duration: 0.3 }}>
        <motion.header
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-8"
        >
          <h1 className="text-3xl font-bold">Smart Carbon Tracking System</h1>
          <Button variant="outline" size="icon" onClick={toggleDarkMode}>
            {isDarkMode ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
          </Button>
        </motion.header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <AnimatedCard
            title="Temperature"
            icon={<Thermometer className="h-4 w-4 text-muted-foreground" />}
            value={currentData ? currentData.temperature.toFixed(1) : "N/A"}
            unit="°C"
            timestamp={currentData?.timestamp || ""}
          />
          <AnimatedCard
            title="Humidity"
            icon={<Droplets className="h-4 w-4 text-muted-foreground" />}
            value={currentData ? currentData.humidity.toFixed(1) : "N/A"}
            unit="%"
            timestamp={currentData?.timestamp || ""}
          />
          <AnimatedCard
            title="Pressure"
            icon={<Gauge className="h-4 w-4 text-muted-foreground" />}
            value={currentData ? currentData.pressure.toFixed(1) : "N/A"}
            unit="hPa"
            timestamp={currentData?.timestamp || ""}
          />
          <AnimatedCard
            title="Gas Emission"
            icon={<Wind className="h-4 w-4 text-muted-foreground" />}
            value={currentData ? currentData.gasEmission.toFixed(1) : "N/A"}
            unit="ppm"
            timestamp={currentData?.timestamp || ""}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Sensor Data Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sensorData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tick={false} />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="temperature"
                        stroke="#8884d8"
                        name="Temperature (°C)"
                      />
                      <Line yAxisId="left" type="monotone" dataKey="humidity" stroke="#82ca9d" name="Humidity (%)" />
                      <Line yAxisId="right" type="monotone" dataKey="pressure" stroke="#ffc658" name="Pressure (hPa)" />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="gasEmission"
                        stroke="#ff7300"
                        name="Gas Emission (ppm)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Predicted Gas Emission Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={predictedEmissionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tick={false} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="predictedEmission"
                        stroke="#00bfff"
                        name="Predicted Gas Emission (ppm)"
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-lg font-semibold">
                    Latest Predicted Gas Emission:{" "}
                    {predictedEmissionData.length > 0
                      ? `${predictedEmissionData[predictedEmissionData.length - 1].predictedEmission.toFixed(1)} ppm`
                      : "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
