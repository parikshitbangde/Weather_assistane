import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react'; // Removed Volume2Off
import axios from 'axios';
import { WeatherDisplay } from './WeatherDisplay';

interface WeatherData {
  temperature: number;
  description: string;
  city: string;
  humidity: number;
  windSpeed: number;
}

export const VoiceWeatherAssistant: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = true;
  recognition.interimResults = true;

  const speak = useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const processVoiceCommand = async (text: string) => {
    try {
      
      setIsProcessing(true);
      const response = await axios.post('http://localhost:8000/process-command', {
        command: text
      });

      if (response.data.weather) {
        setWeatherData(response.data.weather);
        const weatherResponse = `The weather in ${response.data.weather.city} is ${response.data.weather.description} with a temperature of ${Math.round(response.data.weather.temperature)}°C`;
        setResponse(weatherResponse);
        speak(weatherResponse);
      } else {
        setResponse("I couldn't understand the location. Please try again.");
        speak("I couldn't understand the location. Please try again.");
      }
    } catch (err) {
      setError('Failed to process your request. Please try again.');
      console.error('API Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognition.stop();
    } else {
      setError(null);
      recognition.start();
    }
    setIsListening(!isListening);
  };

  useEffect(() => {
    recognition.onresult = (event: SpeechRecognitionResult | any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      setTranscript(transcript);
      if (event.results[current].isFinal) {
        processVoiceCommand(transcript); // Only process if it's final
        setIsListening(false);
      }
    };
  
    recognition.onend = () => {
      if (isListening) {
        processVoiceCommand(transcript);
        setIsListening(false);
      }
    };
  
    recognition.onerror = (event: Event) => { // Use Event type
      const error = (event as any).error; // Cast to any to access the error property
      setError(`Error occurred in recognition: ${error}`);
      setIsListening(false);
    };
  
    return () => {
      recognition.stop();
    };
  }, [transcript, isListening]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-8 shadow-xl border border-gray-700">
          <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Weather Voice Assistant
          </h1>

          <WeatherDisplay weather={weatherData} loading={isProcessing} />

          <div className="space-y-6 mt-8">
            <div className="flex justify-center space-x-4">
              <button
                onClick={toggleListening}
                className={`p-4 rounded-full transition-all duration-200 ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
                disabled={isProcessing}
              >
                {isListening ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </button>

              <button
                onClick={() => window.speechSynthesis.cancel()}
                className={`p-4 rounded-full transition-all duration-200 ${
                  isSpeaking
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {isSpeaking ? (
                  <Volume2 className="w-6 h-6" />
                ) : (
                  <Volume2 className="w-6 h-6" /> // Replace with a suitable icon if Volume2Off is unavailable
                )}
              </button>
            </div>

            {isProcessing && (
              <div className="flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {transcript && (
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h2 className="text-sm text-gray-400 mb-2">You said:</h2>
                  <p className="text-lg">{transcript}</p>
                </div>
              )}

              {response && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                  <h2 className="text-sm text-gray-400 mb-2">Assistant:</h2>
                  <p className="text-lg">{response}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-400">
            {isListening ? (
              <p className="animate-pulse">Listening... Try saying "What's the weather in London?"</p>
            ) : (
              <p>Click the microphone and ask about the weather in any city</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
