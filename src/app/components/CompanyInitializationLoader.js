// src/app/components/CompanyInitializationLoader.js
import React, { useState, useEffect } from 'react';

export default function CompanyInitializationLoader({ onComplete, onError }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Initializing company...');
  const [isComplete, setIsComplete] = useState(false);

  const initializationSteps = [
    { step: 'Creating core accounting accounts...', progress: 10 },
    { step: 'Setting up inventory categories...', progress: 25 },
    { step: 'Configuring default roles...', progress: 40 },
    { step: 'Initializing company settings...', progress: 60 },
    { step: 'Setting up warehouses...', progress: 75 },
    { step: 'Finalizing company setup...', progress: 90 },
    { step: 'Company initialization completed!', progress: 100 }
  ];

  useEffect(() => {
    let currentIndex = 0;

    const runInitialization = async () => {
      try {
        // Simulate initialization steps with delays
        for (const step of initializationSteps) {
          setCurrentStep(step.step);
          setProgress(step.progress);

          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 800));

          currentIndex++;
        }

        setIsComplete(true);

        // Wait a moment before calling onComplete
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 1000);

      } catch (error) {
        console.error('Initialization error:', error);
        if (onError) onError(error);
      }
    };

    runInitialization();
  }, [onComplete, onError]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          {/* Logo or Icon */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Setting Up Your Company
            </h2>
            <p className="text-gray-600">
              This will only take a moment...
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">{currentStep}</p>
            <p className="text-xs text-gray-500 mt-1">{progress}% complete</p>
          </div>

          {/* Loading Animation */}
          {!isComplete && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Completion Checkmark */}
          {isComplete && (
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}

          {/* Footer Text */}
          <div className="mt-6 text-xs text-gray-500">
            <p>Creating 39 core accounts, inventory structure, and default settings</p>
          </div>
        </div>
      </div>
    </div>
  );
}