import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import AgentPanel from '../components/AgentPanel';

export default function Processing({ formData, setRoadmapData }) {
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState({ profile: 'WAITING', goal: 'WAITING', investment: 'WAITING', coach: 'WAITING' });
  const [useSimulation, setUseSimulation] = useState(false);
  const started = useRef(false);

  const saveRoadmapToUser = (roadmapData) => {
    const activeUser = localStorage.getItem('wealthpath_user');
    if (!activeUser) return;
    try {
      const user = JSON.parse(activeUser);
      const dbStr = localStorage.getItem('wealthpath_users_db') || '[]';
      const db = JSON.parse(dbStr);
      const userIndex = db.findIndex(u => u.email === user.email);
      if (userIndex !== -1) {
        if (!db[userIndex].roadmaps) db[userIndex].roadmaps = [];
        db[userIndex].roadmaps.unshift({
          roadmap: roadmapData,
          profile: formData,
          timestamp: new Date().toISOString()
        });
        db[userIndex].roadmaps = db[userIndex].roadmaps.slice(0, 10);
        localStorage.setItem('wealthpath_users_db', JSON.stringify(db));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatCurrency = (n) => {
    n = parseInt(n);
    const sym = formData.currencySymbol || '$';
    const cur = formData.currency || 'USD';
    
    if (cur === 'INR') {
      if (n >= 10000000) return `₹${(n/10000000).toFixed(2)} Cr`;
      if (n >= 100000) return `₹${(n/100000).toFixed(2)} Lakh`;
      return `₹${n.toLocaleString('en-IN')}`;
    }
    
    if (n >= 1000000) return `${sym}${(n/1000000).toFixed(2)}M`;
    if (n >= 1000) return `${sym}${(n/1000).toFixed(0)}K`;
    return `${sym}${n.toLocaleString()}`;
  };

  const calcCorpus = (sip, years, rate) => {
    let corpus = 0, s = sip, mr = rate / 12;
    for (let y = 0; y < years; y++) {
      for (let m = 0; m < 12; m++) corpus = (corpus + s) * (1 + mr);
      s *= 1.10;
    }
    return Math.round(corpus);
  };

  useEffect(() => {
    if (!formData.income || formData.income <= 0) { navigate('/onboard'); return; }
    if (started.current) return;
    started.current = true;

    const runSimulation = () => {
      setUseSimulation(true);
      const { income, expenses, emis, age, retirement_age, risk, monthly_investment } = formData;
      const surplus = income - expenses - emis;
      const healthScore = Math.min(100, Math.max(10, Math.round((Math.max(0, surplus / income) * 70) + (Math.max(0, 1 - emis / income) * 30))));
      const years = Math.min(30, Math.max(1, retirement_age - age)); // Cap at 30 years max
      const equity = risk === 'Aggressive' ? 0.14 : risk === 'Conservative' ? 0.09 : 0.12;
      const recSip = Math.min(monthly_investment, Math.max(0, surplus)); // Match user capacity, capped by surplus
      const corpus = calcCorpus(recSip, years, equity);
      const ef = Math.round(expenses * 6);

      const data = {
        health_score: healthScore, monthly_sip: recSip, emergency_fund: ef,
        projected_corpus: corpus, retirement_age,
        currency: formData.currency || 'USD',
        currencySymbol: formData.currencySymbol || '$',
        milestones: [
          { title: 'Build Emergency Fund', timeframe: 'Month 1', description: `Accumulate ${formatCurrency(ef)} in a stable low-risk liquid fund as your safety net.` },
          { title: 'Start SIP Allocation', timeframe: 'Month 3', description: `Start ${formatCurrency(recSip)}/month in passive index mutual funds and broad global ETFs.` },
          { title: 'Increase SIP by 10%', timeframe: 'Month 6', description: 'Step up your SIP by 10% annually to accelerate compounding as your salary grows.' },
          { title: 'Add Tax Savers', timeframe: 'Year 2', description: 'Invest in tax-advantaged accounts (such as 401k, IRAs, ISAs, or local tax savers) to claim deductions.' },
          { title: 'Review & Rebalance', timeframe: 'Year 5', description: 'Rebalance from volatile equities to safer fixed-income debt instruments as you approach retirement age.' },
        ],
        investments: [
          { category: 'Mid Cap & Flexi Cap Mutual Funds', percentage: 35, details: 'Parag Parikh Flexi Cap Fund (Growth, 14-16% CAGR)' },
          { category: 'Small Cap Mutual Funds', percentage: 25, details: 'Nippon India Small Cap Fund (High volatility growth, 18-20% CAGR)' },
          { category: 'Nifty 50 Index ETFs (Large Cap)', percentage: 20, details: 'UTI Nifty 50 Index Fund or Nippon India Nifty 50 BeES ETF (Stable, 12% CAGR)' },
          { category: 'Gold & Silver ETFs', percentage: 10, details: 'Nippon India Gold BeES & HDFC Silver ETF (Inflation hedge, 8-10% CAGR)' },
          { category: 'Liquid Emergency Fund', percentage: 10, details: 'ICICI Prudential Liquid Fund or high-yield savings (Liquidity, ~6.5% interest)' },
        ],
        monthly_actions: [
          { day: 'Day 1-5', action: 'Open a demat and mutual fund account on a discount broker app.', amount: 'N/A' },
          { day: 'Day 10', action: 'Transfer 30% of emergency fund to a liquid fund.', amount: formatCurrency(Math.round(ef * 0.3)) },
          { day: 'Day 15', action: 'Set up auto-debit SIP mandate for index and flexi-cap funds.', amount: formatCurrency(recSip) },
          { day: 'Day 20', action: 'Register on retirement portals or check pension options via your employer.', amount: 'N/A' },
          { day: 'Day 25', action: 'Audit subscriptions and cut non-essential recurring expenses.', amount: 'N/A' },
          { day: 'Day 30', action: 'Schedule monthly net-worth check and confirm SIP executed.', amount: 'N/A' },
        ],
        coach_summary: `You have a solid financial foundation with a health score of ${healthScore}/100. Retiring by age ${retirement_age} is completely achievable. By investing ${formatCurrency(recSip)} every month and stepping it up 10% annually as your salary grows, compounding at ${Math.round(equity*100)}% CAGR works silently in your favour. After ${years} years, your wealth grows to ${formatCurrency(corpus)}. Start with the emergency fund — then automate your SIP and never stop. Time is your greatest asset.`
      };

      const delays = [2500, 2500, 3000, 2500];
      const steps = ['profile', 'goal', 'investment', 'coach'];
      let t = 0;
      steps.forEach((step, i) => {
        setTimeout(() => setStatuses(p => ({ ...p, [step]: 'ACTIVE' })), t);
        t += delays[i];
        setTimeout(() => setStatuses(p => ({ ...p, [step]: 'DONE' })), t);
      });
      setTimeout(() => {
        saveRoadmapToUser(data);
        localStorage.setItem('wealthpath_roadmap', JSON.stringify(data));
        setRoadmapData(data);
        setTimeout(() => navigate('/dashboard'), 800);
      }, t);
    };

    const startStream = async () => {
      try {
        const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
        const res = await fetch(`${API}/api/generate-roadmap-stream`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error('Backend unreachable');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n'); buf = lines.pop() || '';
          for (const line of lines) {
            if (!line.trim().startsWith('data:')) continue;
            try {
              const ev = JSON.parse(line.replace('data:', '').trim());
              const s = ev.status;
              if (s === 'profile_agent_active')    setStatuses({ profile: 'ACTIVE', goal: 'WAITING', investment: 'WAITING', coach: 'WAITING' });
              else if (s === 'profile_agent_done') setStatuses(p => ({ ...p, profile: 'DONE' }));
              else if (s === 'goal_agent_active')  setStatuses(p => ({ ...p, goal: 'ACTIVE' }));
              else if (s === 'goal_agent_done')    setStatuses(p => ({ ...p, goal: 'DONE' }));
              else if (s === 'investment_agent_active') setStatuses(p => ({ ...p, investment: 'ACTIVE' }));
              else if (s === 'investment_agent_done')   setStatuses(p => ({ ...p, investment: 'DONE' }));
              else if (s === 'coach_agent_active') setStatuses(p => ({ ...p, coach: 'ACTIVE' }));
              else if (s === 'coach_agent_done')   setStatuses(p => ({ ...p, coach: 'DONE' }));
              else if (s === 'completed') {
                setStatuses({ profile: 'DONE', goal: 'DONE', investment: 'DONE', coach: 'DONE' });
                const mergedData = {
                  ...ev.data,
                  currency: formData.currency || 'USD',
                  currencySymbol: formData.currencySymbol || '$'
                };
                saveRoadmapToUser(mergedData);
                localStorage.setItem('wealthpath_roadmap', JSON.stringify(mergedData));
                setRoadmapData(mergedData);
                setTimeout(() => navigate('/dashboard'), 800);
                return;
              } else if (s === 'error') throw new Error(ev.message);
            } catch {}
          }
        }
      } catch (err) {
        console.warn('Backend failed, using local simulation:', err);
        runSimulation();
      }
    };
    startStream();
  }, [formData, navigate, setRoadmapData]);

  return (
    <div className="min-h-screen bg-[#F9F8F4] dark:bg-[#0F1712] text-[#2D3A31] dark:text-[#F0F5F2] flex flex-col items-center justify-center px-6 py-12 transition-colors duration-300">
      {/* Soft organic background blob */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#8C9A84] opacity-[0.06] blur-[120px] pointer-events-none" />

      <div className="w-8 h-8 rounded-full bg-[#2D3A31] dark:bg-[#8C9A84] flex items-center justify-center mb-8 transition-colors">
        <Leaf className="w-4 h-4 text-white dark:text-[#0F1712]" strokeWidth={1.5} />
      </div>

      <div className="text-center mb-10">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#2D3A31] dark:text-white mb-3 transition-colors">
          Your AI Team is Working...
        </h1>
        <p className="text-sm text-[#8C9A84] font-sans">
          {useSimulation ? 'Running local optimization algorithms' : 'Streaming live from CrewAI agents'}
        </p>
      </div>

      <AgentPanel statuses={statuses} />

      <p className="mt-10 section-label">Estimated time: 8-12 seconds</p>
      <p className="text-xs text-[#C27B66] mt-2 font-sans">Do not refresh or close this page</p>
    </div>
  );
}
