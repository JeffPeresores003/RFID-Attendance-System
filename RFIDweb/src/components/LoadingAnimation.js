import React, { useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const LoadingAnimation = ({ message = 'Loading...', portal = 'teacher' }) => {
  const [useFallback, setUseFallback] = useState(false);
  
  // Debug: Log when component renders
  console.log('🎬 LoadingAnimation rendered:', { message, portal });
  
  // Portal-specific gradient colors
  const gradientColors = {
    teacher: 'from-emerald-600 via-teal-600 to-cyan-600',
    admin: 'from-purple-600 via-pink-600 to-red-600',
    student: 'from-blue-600 via-indigo-600 to-purple-600'
  };

  const bgColors = {
    teacher: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600',
    admin: 'bg-gradient-to-r from-purple-600 via-pink-600 to-red-600',
    student: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600'
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full mx-4 text-center transform scale-100 transition-all duration-300">
        {/* Loading Animation or Spinner */}
        <div className="w-64 h-64 mx-auto mb-6 flex items-center justify-center">
          {!useFallback ? (
            <DotLottieReact
              src="https://lottie.host/f3528c88-e797-467c-8544-90c84cd712f2/lVRgxXrlPf.lottie"
              loop
              autoplay
              style={{ width: '100%', height: '100%' }}
              onLoadError={() => {
                console.log('❌ Lottie failed to load, using fallback');
                setUseFallback(true);
              }}
            />
          ) : (
            <div className="relative w-40 h-40">
              <div className={`absolute inset-0 rounded-full border-8 border-slate-200`}></div>
              <div className={`absolute inset-0 rounded-full border-8 border-transparent ${
                portal === 'teacher' ? 'border-t-emerald-600 border-r-teal-600' :
                portal === 'admin' ? 'border-t-purple-600 border-r-pink-600' :
                'border-t-blue-600 border-r-indigo-600'
              } animate-spin`}></div>
            </div>
          )}
        </div>
        
        {/* Message */}
        <div>
          <h3 className={`text-3xl font-bold mb-3 ${bgColors[portal] || bgColors.teacher} bg-clip-text text-transparent`}>
            {message}
          </h3>
          <p className="text-slate-700 text-base font-medium">Please wait a moment...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;

