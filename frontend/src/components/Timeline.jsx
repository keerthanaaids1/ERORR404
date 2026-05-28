import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function Timeline({ milestones = [] }) {
  // Safe defaults if empty
  const defaultMilestones = [
    { title: "Build Emergency Fund", timeframe: "Month 1", description: "Establish liquid cash reserve" },
    { title: "Start SIP", timeframe: "Month 3", description: "Initiate equity SIP allocation" },
    { title: "Increase SIP", timeframe: "Month 6", description: "Step up investment amounts" },
    { title: "Add ELSS", timeframe: "Year 2", description: "Invest in tax saver mutual funds" },
    { title: "Review & Rebalance", timeframe: "Year 5", description: "Assess goals and adjust assets" }
  ];

  const displayMilestones = milestones.length > 0 ? milestones : defaultMilestones;

  return (
    <div className="wp-card p-8 flex flex-col gap-6 w-full overflow-hidden">
      <h3 className="text-lg font-bold text-offwhite flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-accent" />
        Milestone Roadmap
      </h3>
      
      {/* Horizontal Timeline Track */}
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-4 mt-4">
        {/* Connection line for desktop */}
        <div className="absolute top-[8px] left-[5%] right-[5%] h-0.5 bg-gradient-to-r from-accent/10 via-accent to-accent/10 hidden md:block z-0" />

        {displayMilestones.map((m, idx) => (
          <div key={idx} className="flex md:flex-col items-center md:items-center gap-4 md:gap-4 w-full md:w-[18%] z-10 group">
            {/* Step circle indicator */}
            <div className="w-4 h-4 rounded-full bg-[#5E6AD2] ring-4 ring-[#5E6AD2]/20 group-hover:scale-110 transition-all duration-300">
            </div>
            
            {/* Step Details */}
            <div className="flex flex-col md:items-center text-left md:text-center">
              <span className="text-xxs font-extrabold uppercase tracking-widest text-accent mb-1">
                {m.timeframe}
              </span>
              <h4 className="text-sm font-bold text-offwhite group-hover:text-accent transition-colors duration-200">
                {m.title}
              </h4>
              <p className="text-xs text-mutedgray mt-1 leading-normal max-w-[200px] md:max-w-none">
                {m.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
