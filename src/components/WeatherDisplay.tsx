import React from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind } from 'lucide-react';

interface WeatherData {
  temperature: number;
  description: string;
  city: string;
  humidity: number;
  windSpeed: number;
}

interface WeatherDisplayProps {
  weather: WeatherData | null;
  loading: boolean;
}

const getWeatherIcon = (description: string) => {
  const desc = description.toLowerCase();
  if (desc.includes('clear')) return <Sun className="w-12 h-12 text-yellow-400" />;
  if (desc.includes('rain')) return <CloudRain className="w-12 h-12 text-blue-400" />;
  if (desc.includes('snow')) return <CloudSnow className="w-12 h-12 text-blue-200" />;
  if (desc.includes('thunder')) return <CloudLightning className="w-12 h-12 text-yellow-500" />;
  if (desc.includes('wind')) return <Wind className="w-12 h-12 text-gray-400" />;
  return <Cloud className="w-12 h-12 text-gray-400" />;
};

export const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ weather, loading }) => {
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-700 rounded w-3/4"></div>
        <div className="h-24 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">{weather.city}</h2>
        {getWeatherIcon(weather.description)}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-4xl font-bold">{Math.round(weather.temperature)}°C</p>
          <p className="text-gray-400 capitalize">{weather.description}</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Humidity</span>
            <span>{weather.humidity}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Wind Speed</span>
            <span>{weather.windSpeed} m/s</span>
          </div>
        </div>
      </div>
    </div>
  );
};