import React, { useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const LoadingAnimation = ({ message = 'Loading...', portal = 'teacher' }) => {
  const [useFallback, setUseFallback] = useState(false);
  
  // Debug: Log when component renders
  console.log('🎬 LoadingAnimation rendered:', { message, portal });
  
  // Portal-specific gradient colors - Official San Jose Elementary School Palette
  const gradientColors = {
    teacher: 'from-[#0F5C4B] via-[#6E8B6D] to-[#0F5C4B]',
    admin: 'from-[#E0B23C] via-[#6E8B6D] to-[#E0B23C]',
    student: 'from-[#6E8B6D] via-[#0F5C4B] to-[#6E8B6D]'
  };

  const bgColors = {
    teacher: 'bg-gradient-to-r from-[#0F5C4B] via-[#6E8B6D] to-[#0F5C4B]',
    admin: 'bg-gradient-to-r from-[#E0B23C] via-[#6E8B6D] to-[#E0B23C]',
    student: 'bg-gradient-to-r from-[#6E8B6D] via-[#0F5C4B] to-[#6E8B6D]'
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
              <div className={`absolute inset-0 rounded-full border-8 border-[#F7F5EF]`}></div>
              <div className={`absolute inset-0 rounded-full border-8 border-transparent ${
                portal === 'teacher' ? 'border-t-[#0F5C4B] border-r-[#6E8B6D]' :
                portal === 'admin' ? 'border-t-[#E0B23C] border-r-[#6E8B6D]' :
                'border-t-[#6E8B6D] border-r-[#0F5C4B]'
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

