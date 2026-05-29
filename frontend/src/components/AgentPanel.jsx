import React from 'react';
import { Check, Loader2, User, Target, BarChart2, MessageSquare } from 'lucide-react';

const agents = [
  { id: 'profile',    name: 'Profile Agent',    role: 'Analyzer',   icon: User,         desc: 'Analyzes your financial health, savings rate, and surplus.' },
  { id: 'goal',       name: 'Goal Agent',       role: 'Planner',    icon: Target,       desc: 'Calculates corpus needed, SIP required, and retirement timeline.' },
  { id: 'investment', name: 'Investment Agent', role: 'Researcher', icon: BarChart2,    desc: 'Searches live Indian market for best SIPs, ELSS, and FD rates.' },
  { id: 'coach',      name: 'Coach Agent',      role: 'Adviser',    icon: MessageSquare,desc: 'Translates everything into plain English steps you can act on.' },
];

export default function AgentPanel({ statuses = {} }) {
  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-4 relative">
      <div className="absolute left-9 top-10 bottom-10 w-px border-l border-dashed border-[#8C9A84]/30 -z-10" />

      {agents.map((agent) => {
        const state = statuses[agent.id] || 'WAITING';
        const Icon = agent.icon;
        return (
          <div key={agent.id}
            className={`flex items-start gap-5 p-5 rounded-3xl border transition-all duration-500 ${
              state === 'ACTIVE'
                ? 'bg-white dark:bg-[#18231C] border-[#8C9A84] shadow-med translate-x-1 text-[#2D3A31] dark:text-white'
                : state === 'DONE'
                ? 'bg-[#F2F0EB] dark:bg-[#121C16] border-[#8C9A84]/40 dark:border-[#24352B]/40 text-[#2D3A31] dark:text-white'
                : 'bg-white/50 dark:bg-[#18231C]/50 border-[#E6E2DA] dark:border-[#24352B] opacity-40 text-[#8C9A84]/60'
            }`}>
            <div className="relative flex-shrink-0">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                state === 'ACTIVE' ? 'bg-[#8C9A84]/15 border-[#8C9A84] text-[#8C9A84]'
                : state === 'DONE'  ? 'bg-[#2D3A31]/10 dark:bg-[#8C9A84]/20 border-[#2D3A31] dark:border-[#8C9A84]/30 text-[#2D3A31] dark:text-[#8C9A84]'
                : 'bg-[#E6E2DA] dark:bg-[#24352B] border-[#E6E2DA] dark:border-[#24352B] text-[#8C9A84] dark:text-[#8C9A84]/60'
              }`}>
                <Icon className="w-5 h-5" strokeWidth={1.5} />
              </div>
              {state === 'DONE' && (
                <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#2D3A31] dark:bg-[#8C9A84] flex items-center justify-center transition-colors">
                  <Check className="w-3 h-3 text-white dark:text-[#0F1712] stroke-[3]" />
                </div>
              )}
              {state === 'ACTIVE' && (
                <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#8C9A84] flex items-center justify-center animate-spin">
                  <Loader2 className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            <div className="flex-grow">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className={`font-serif font-bold text-sm ${state === 'WAITING' ? 'text-[#8C9A84]' : 'text-[#2D3A31] dark:text-white'}`}>
                  {agent.name}
                </h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border uppercase tracking-wider ${
                  state === 'ACTIVE' ? 'bg-[#8C9A84]/15 border-[#8C9A84]/30 text-[#8C9A84]'
                  : state === 'DONE' ? 'bg-[#2D3A31]/10 dark:bg-[#8C9A84]/20 border-[#2D3A31]/20 dark:border-[#8C9A84]/30 text-[#2D3A31] dark:text-[#8C9A84]'
                  : 'bg-[#E6E2DA] dark:bg-[#24352B] border-[#E6E2DA] dark:border-[#24352B] text-[#8C9A84]'
                }`}>{agent.role}</span>
              </div>
              <p className="text-xs text-[#8C9A84] mt-1 leading-relaxed font-sans">{agent.desc}</p>
              {state === 'ACTIVE' && (
                <div className="mt-3 w-full bg-[#E6E2DA] dark:bg-[#24352B] rounded-full h-1 overflow-hidden transition-colors">
                  <div className="bg-[#8C9A84] h-full w-1/3 rounded-full animate-[progress_1.5s_infinite_ease-in-out]" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
