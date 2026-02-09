import React from 'react';

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-bg-primary" aria-hidden="true">
      {/* 1. Subtle Grid Layer */}
      <div className="absolute inset-0 bg-grid-pattern animate-grid-pulse" />

      {/* 2. Top-Left Primary Orb */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-primary/10 blur-[100px] animate-float-slow mix-blend-screen" />

      {/* 3. Bottom-Right Secondary Orb */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-secondary/10 blur-[100px] animate-float-delayed mix-blend-screen" />

      {/* 4. Center Accent Glow (Subtle depth) */}
      <div className="absolute top-1/2 left-1/2 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-accent/5 blur-[80px] animate-pulse-center transform -translate-x-1/2 -translate-y-1/2" />

    </div>
  );
};

export default AnimatedBackground;