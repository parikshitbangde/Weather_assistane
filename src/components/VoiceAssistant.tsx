// VoiceWeatherAssistant.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import OpenAI from 'openai';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const VoiceAssistant: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  useEffect(() => {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      setIsApiKeyMissing(true);
      setError('OpenAI API key is not configured. Please add it to your environment variables.');
    }
  }, []);

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = true;
  recognition.interimResults = true;

  const speak = useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const processAudioInput = async (text: string) => {
    if (isApiKeyMissing) {
      setError('OpenAI API key is not configured. Please add it to your environment variables.');
      return;
    }

    try {
      setIsProcessing(true);
      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: text }],
        model: 'gpt-3.5-turbo',
      });
      
      const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not process that.';
      setResponse(aiResponse);
      speak(aiResponse);
    } catch (err) {
      setError('Failed to process your request. Please try again.');
      console.error('OpenAI API Error:', err);
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
      const transcript = event.results[event.resultIndex][0].transcript;
      setTranscript(transcript);
    };

    recognition.onend = () => {
      if (isListening) {
        processAudioInput(transcript);
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      setError(`Error occurred in recognition: ${event.error}`);
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
            AI Voice Assistant
          </h1>

          <div className="space-y-6">
            <div className="flex justify-center space-x-4">
              <button
                onClick={toggleListening}
                className={`p-4 rounded-full transition-all duration-200 ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
                disabled={isProcessing || isApiKeyMissing}
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
                <Volume2 className="w-6 h-6" />
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
              <p className="animate-pulse">Listening...</p>
            ) : (
              <p>Click the microphone to start speaking</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
