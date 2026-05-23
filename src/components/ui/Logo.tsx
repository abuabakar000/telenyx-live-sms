import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'center';
}

export function Logo({ className, size = 'md', align = 'left' }: LogoProps) {
  const sizes = {
    sm: {
      text: 'text-xl',
      labs: 'text-[7px] tracking-[0.25em] -mt-1',
      dot: 'w-[4px] h-[4px] top-[2px] left-[4px]',
    },
    md: {
      text: 'text-2xl',
      labs: 'text-[9px] tracking-[0.35em] -mt-1',
      dot: 'w-[5px] h-[5px] top-[3px] left-[5px]',
    },
    lg: {
      text: 'text-4.5xl font-black',
      labs: 'text-[11px] tracking-[0.45em] -mt-1.5',
      dot: 'w-[9px] h-[9px] top-[6px] left-[9px]',
    }
  };

  const current = sizes[size];
  const isCentered = align === 'center';

  return (
    <div className={`flex flex-col ${isCentered ? 'items-center' : 'items-start'} font-sans select-none ${className}`}>
      <div className={`flex items-baseline font-black tracking-tight text-white leading-none ${current.text}`}>
        {/* 'i' letter with custom red dot */}
        <span className="relative inline-block text-white lowercase leading-none font-bold">
          i
          <span className={`absolute rounded-full bg-[#ef4444] shadow-md shadow-red-500/50 ${current.dot}`} />
        </span>
        {/* 'NEX' with a special red accent in X */}
        <span className="uppercase tracking-tight leading-none font-extrabold ml-[1px]">
          NE
          <span className="relative inline-block text-white font-extrabold">
            X
            {/* Red accent slash inside X diagonal */}
            <span 
              className="absolute bg-[#ef4444] rounded-full transform rotate-[42deg] shadow-sm shadow-red-500/20"
              style={{
                bottom: '12%',
                left: '32%',
                width: '16%',
                height: '52%',
              }}
            />
          </span>
        </span>
      </div>
      <span className={`font-bold text-slate-500 uppercase leading-none ${current.labs} ${isCentered ? 'pl-[0.45em]' : ''}`}>
        LABS
      </span>
    </div>
  );
}
