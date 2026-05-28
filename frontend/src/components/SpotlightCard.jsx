import React, { useState } from 'react';

export default function SpotlightCard({ children, className = '', ...props }) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.05] to-white/[0.01] transition-all duration-300 hover:border-[#5E6AD2]/30 hover:shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_80px_rgba(94,106,210,0.08)] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_2px_20px_rgba(0,0,0,0.4),0_0_40px_rgba(0,0,0,0.2)] ${className}`}
      {...props}
    >
      {/* Radial Spotlight Glow layer positioned under content */}
      <div
        className="absolute pointer-events-none rounded-full transition-opacity duration-300 -z-0"
        style={{
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(94, 106, 210, 0.15) 0%, rgba(94, 106, 210, 0) 70%)',
          left: `${coords.x - 150}px`,
          top: `${coords.y - 150}px`,
          opacity: isHovered ? 1 : 0,
        }}
      />
      {/* Relative content wrapper to sit above background glow */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
}
