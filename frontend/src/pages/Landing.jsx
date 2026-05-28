import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Leaf, TrendingUp, Shield, MessageCircle, Target, Sprout, Star } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import Navbar from '../components/Navbar';

const chartData = [
  { age: '25', wealth: 5 }, { age: '30', wealth: 28 },
  { age: '35', wealth: 85 }, { age: '40', wealth: 210 },
  { age: '45', wealth: 480 }, { age: '50', wealth: 980 },
];

const agents = [
  { num: '01', name: 'Profile Agent',    role: 'Analyzer',   icon: Target,        desc: 'Analyzes your complete financial picture — income, expenses, EMIs, and current savings.' },
  { num: '02', name: 'Goal Agent',       role: 'Planner',    icon: TrendingUp,    desc: 'Sets retirement targets and computes corpus needed using inflation-adjusted projections.' },
  { num: '03', name: 'Investment Agent', role: 'Researcher', icon: Sprout,        desc: 'Searches live 2026 Indian market rates for the best SIPs, ELSS, and FD opportunities.' },
  { num: '04', name: 'Coach Agent',      role: 'Adviser',    icon: MessageCircle, desc: 'Translates everything into plain, jargon-free English with a step-by-step action plan.' },
];

const features = [
  { icon: Shield,      title: 'India-Specific',  desc: 'Built for Indian earners — accounts for ELSS 80C deductions, FD rates, SIP step-up, and 6% inflation.' },
  { icon: MessageCircle, title: 'No Jargon',     desc: 'We replace complex financial terminology with plain, actionable language you can understand immediately.' },
  { icon: Sprout,      title: '4 AI Agents',     desc: 'A coordinated crew of specialized agents, each validating the others to give you the most accurate plan.' },
  { icon: Star,        title: '100% Free',       desc: 'Generate your roadmap, tweak inputs, and download a beautiful PDF — no subscription ever needed.' },
];

const ChartTooltip = ({ active, payload }) => {
  if (active && payload?.length) return (
    <div className="bg-white border border-[#E6E2DA] rounded-2xl p-3 shadow-soft">
      <p className="text-xs font-serif font-bold text-[#2D3A31]">Age {payload[0].payload.age}</p>
      <p className="text-sm font-bold text-[#8C9A84]">₹{payload[0].value}L</p>
    </div>
  );
  return null;
};

export default function Landing() {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const saved = localStorage.getItem('wealthpath_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F8F4]">
      <Navbar />

      {/* ── HERO ── */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-32 flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 text-center lg:text-left">
          <span className="section-label mb-6 block">Personalized Financial Planning</span>
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-[#2D3A31] leading-tight mb-6">
            Your Money.<br />
            Your <span className="italic text-[#8C9A84]">Retirement.</span><br />
            Your Rules.
          </h1>
          <p className="text-[#8C9A84] text-lg leading-relaxed max-w-xl mb-10">
            Tell us your income and goals. Our 4 AI agents build a personalized roadmap to financial freedom — in seconds, in plain English.
          </p>
          {user && (
            <p className="text-xs text-[#8C9A84] mb-4 font-semibold font-sans uppercase tracking-wider">
              🟢 Logged in as {user.name}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button onClick={() => navigate('/onboard')} className="btn-primary">
              Build My Roadmap <ArrowRight className="w-4 h-4" />
            </button>
            <a href="#how-it-works" className="btn-secondary">See How It Works</a>
          </div>


        </div>

        {/* Swarm Agent Network - Describes and visualizes the agents */}
        <div className="flex-1 flex justify-center w-full">
          <div className="bg-white border border-[#E6E2DA] rounded-3xl p-6 shadow-large w-full max-w-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#8C9A84] opacity-[0.08] blur-[40px] rounded-full pointer-events-none" />
            
            <div className="flex items-center justify-between pb-4 border-b border-[#E6E2DA] mb-6">
              <div>
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest font-sans flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> CrewAI Crew Online
                </span>
                <h3 className="font-serif text-lg font-bold text-[#2D3A31] mt-0.5">4 AI Agents Cooperating</h3>
              </div>
              <span className="text-[10px] bg-[#2D3A31] text-white px-2.5 py-1 rounded-full font-semibold">Active Crew</span>
            </div>

            <div className="flex flex-col gap-6 relative">
              {/* Connector lines between agents */}
              <div className="absolute left-6 top-5 bottom-5 w-0.5 bg-gradient-to-b from-[#8C9A84] to-[#2D3A31] opacity-30 border-dashed border-l border-[#8C9A84]" />

              {[
                { name: 'Profile Agent', role: 'Analyzer', desc: 'Analyzes cash flow, savings rate, and calculates your health score.', color: '#8C9A84', details: 'Income, EMIs, Expenses, Surplus' },
                { name: 'Goal Agent', role: 'Planner', desc: 'Calculates early retirement corpus adjusted for inflation.', color: '#C27B66', details: 'SWR math, SIP compound model' },
                { name: 'Investment Agent', role: 'Researcher', desc: 'Finds top mutual funds, ETFs, gold & bonds.', color: '#DCCFC2', details: 'Specific fund names & yields' },
                { name: 'Coach Agent', role: 'Advisor', desc: 'Synthesizes everything into a jargon-free early retirement plan.', color: '#2D3A31', details: 'Interactive chat & instructions' },
              ].map((agent, i) => (
                <div key={i} className="flex gap-4 items-start relative group hover:scale-[1.01] transition-transform duration-300">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xs select-none shadow-soft transition-all duration-300 z-10"
                       style={{ backgroundColor: agent.color, color: i === 2 ? '#2D3A31' : 'white' }}>
                    0{i+1}
                  </div>
                  <div className="flex-1 bg-[#F9F8F4] border border-[#E6E2DA] p-3.5 rounded-2xl">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-serif font-bold text-sm text-[#2D3A31]">{agent.name}</h4>
                      <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-[#8C9A84]">{agent.role}</span>
                    </div>
                    <p className="text-xs text-[#8C9A84] leading-relaxed mb-1.5">{agent.desc}</p>
                    <span className="text-[10px] text-[#2D3A31] font-semibold font-mono bg-white border border-[#E6E2DA] px-2 py-0.5 rounded-md inline-block">
                      ⚙️ {agent.details}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-white py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label mb-3 block">The Workflow</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#2D3A31]">
              Four AI Agents.<br /><span className="italic text-[#8C9A84]">One Perfect Plan.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {agents.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className={`card-botanical p-7 ${i % 2 === 1 ? 'md:translate-y-8' : ''}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-full bg-[#F2F0EB] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#8C9A84]" strokeWidth={1.5} />
                    </div>
                    <span className="font-serif text-3xl font-bold text-[#E6E2DA]">{a.num}</span>
                  </div>
                  <span className="section-label">{a.role}</span>
                  <h3 className="font-serif text-xl font-bold text-[#2D3A31] mt-2 mb-3">{a.name}</h3>
                  <p className="text-sm text-[#8C9A84] leading-relaxed">{a.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-32 px-6 md:px-12 bg-[#F9F8F4]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            <div>
              <span className="section-label mb-4 block">Why WealthPath</span>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#2D3A31] leading-tight">
                Not Generic Advice.<br />
                <span className="italic text-[#8C9A84]">Your</span> Advice.
              </h2>
            </div>
            <div className="bg-white rounded-3xl p-8 shadow-large border border-[#E6E2DA]">
              <p className="section-label mb-3">Wealth Growth Trajectory</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8C9A84" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8C9A84" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="age" stroke="#DCCFC2" fontSize={11} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="wealth" stroke="#8C9A84" strokeWidth={2.5} fill="url(#gr)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="card-botanical p-8 flex items-start gap-5">
                  <div className="w-12 h-12 rounded-full bg-[#F2F0EB] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#8C9A84]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="font-serif text-xl font-bold text-[#2D3A31] mb-2">{f.title}</h4>
                    <p className="text-sm text-[#8C9A84] leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#2D3A31] py-32 px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <Leaf className="w-10 h-10 text-[#8C9A84] mx-auto mb-6" strokeWidth={1.5} />
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Start your journey to<br /><span className="italic text-[#8C9A84]">financial freedom</span> today.
          </h2>
          <p className="text-[#8C9A84] text-lg mb-10 leading-relaxed">
            It takes 2 minutes. Your 4 AI agents do the rest.
          </p>
          <button onClick={() => navigate('/onboard')}
            className="inline-flex items-center gap-2 bg-[#8C9A84] text-white text-sm tracking-widest uppercase rounded-full px-10 py-4 font-medium hover:bg-[#C27B66] transition-all duration-300 shadow-xl">
            Build My Roadmap <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#F9F8F4] border-t border-[#E6E2DA] py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#2D3A31] flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
            </div>
            <span className="font-serif font-bold text-[#2D3A31]">WealthPath <span className="italic text-[#8C9A84]">AI</span></span>
          </div>
          <p className="text-xs text-[#8C9A84]">Built at Agentathon 2026 · Powered by CrewAI + Groq</p>
        </div>
      </footer>
    </div>
  );
}
