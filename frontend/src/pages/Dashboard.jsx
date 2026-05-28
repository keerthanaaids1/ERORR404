import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, TrendingUp, Shield, Target, Calendar, Zap, Download, Edit3, Heart, X, MessageSquare, Send, ArrowLeft } from 'lucide-react';
import DonutChart from '../components/DonutChart';

export default function Dashboard() {
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [profile, setProfile] = useState(null);

  // Chatbot State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'model', text: `Hi! I am your WealthPath AI Coach. Ask me any questions about your early retirement roadmap, mutual funds, ETFs, SWPs, inflation, or how to set up your investments.` }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Step-Up Strategy State
  const [useStepUp, setUseStepUp] = useState(true);
  const [stepUpRate, setStepUpRate] = useState(10);
  const [allocationMode, setAllocationMode] = useState('split');
  const [skipLowReturn, setSkipLowReturn] = useState(false);

  useEffect(() => {
    const r = localStorage.getItem('wealthpath_roadmap');
    const p = localStorage.getItem('wealthpath_profile');
    if (r) { try { setRoadmap(JSON.parse(r)); } catch { navigate('/onboard'); } }
    else navigate('/onboard');
    if (p) { try { setProfile(JSON.parse(p)); } catch {} }
  }, [navigate]);

  if (!roadmap) return (
    <div className="min-h-screen bg-[#F9F8F4] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#8C9A84] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const pCurrency = roadmap?.currency || profile?.currency || 'USD';
  const pSymbol = roadmap?.currencySymbol || profile?.currencySymbol || '$';

  const fmtCurrency = (n) => {
    if (!n && n !== 0) return `${pSymbol}0`;
    n = parseInt(n);
    if (pCurrency === 'INR') {
      if (n >= 10000000) return `₹${(n/10000000).toFixed(2)} Cr`;
      if (n >= 100000) return `₹${(n/100000).toFixed(2)} Lakh`;
      return `₹${n.toLocaleString('en-IN')}`;
    }
    if (n >= 1000000) return `${pSymbol}${(n/1000000).toFixed(2)}M`;
    if (n >= 1000) return `${pSymbol}${(n/1000).toFixed(0)}K`;
    return `${pSymbol}${n.toLocaleString()}`;
  };

  const fmtShort = (n) => {
    if (!n && n !== 0) return `${pSymbol}0`;
    n = parseInt(n);
    if (pCurrency === 'INR') {
      if (n >= 10000000) return `₹${(n/10000000).toFixed(2)}Cr`;
      if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`;
      return `₹${n.toLocaleString('en-IN')}`;
    }
    if (n >= 1000000) return `${pSymbol}${(n/1000000).toFixed(2).replace(/0$/, '').replace(/\.$/, '')}M`;
    if (n >= 1000) return `${pSymbol}${(n/1000).toFixed(0)}K`;
    return `${pSymbol}${n.toLocaleString()}`;
  };

  const parseAmt = (a) => {
    if (!a || a === 'N/A') return null;
    let clean = a.replace(/[^\d.]/g, '');
    let n = parseFloat(clean);
    if (isNaN(n)) return null;
    if (a.toLowerCase().includes('cr')) n *= 10000000;
    else if (a.toLowerCase().includes('lakh')) n *= 100000;
    else if (a.toLowerCase().includes('m')) n *= 1000000;
    else if (a.toLowerCase().includes('k')) n *= 1000;
    return fmtCurrency(n);
  };

  const pct = (v, t) => t > 0 ? Math.round((v/t)*100) : 0;

  const highlightCurrency = (t, isDark = false) => {
    if (!t || typeof t !== 'string') return '';
    const color = isDark ? '#DCCFC2' : '#2D3A31';
    const pattern = new RegExp(`[${pSymbol}₹\\$€£][\\d,.]+(?:\\s*(?:Cr|Lakh|L|M|K))?`, 'g');
    return t.replace(pattern, `<span style="color:${color};font-weight:700">$&</span>`).replace(/\.0(?=\b)/g,'');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      const API_HOST = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const historyPayload = chatMessages.map(m => ({ role: m.role, text: m.text }));

      const response = await fetch(`${API_HOST}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMsg,
          history: historyPayload,
          context: {
            profile: profile,
            roadmap: roadmap
          }
        })
      });

      if (!response.ok) throw new Error('Failed to get response');
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'model', text: data.response || 'No response received' }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'model', text: 'Sorry, I am having trouble connecting to the coach agent. Please check if the backend server is running.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const income = profile?.income || 0;
  const expenses = profile?.expenses || 0;
  const emis = profile?.emis || 0;
  const age = profile?.age || 26;
  const retireAge = roadmap?.retirement_age || profile?.retirement_age || 60;
  const sip = roadmap?.monthly_sip || 0;
  const freeCash = Math.max(0, income - expenses - emis - sip);
  const risk = profile?.risk || 'Balanced';
  
  // Calculate dynamic CAGR depending on Allocation Mode, Hedges skipping, and Risk Appetite
  let equity = 0.12;
  if (allocationMode === 'split') {
    if (skipLowReturn) {
      // Excludes Gold (10%) and Liquid Fund (10%) and Index ETFs (20%), reallocating to Mid/Small-cap
      equity = risk === 'Aggressive' ? 0.172 : risk === 'Conservative' ? 0.130 : 0.158;
    } else {
      equity = risk === 'Aggressive' ? 0.14 : risk === 'Conservative' ? 0.09 : 0.12;
    }
  } else {
    // Single fund has 100% equity exposure (higher return, higher volatility, no safety hedges)
    equity = risk === 'Aggressive' ? 0.152 : risk === 'Conservative' ? 0.11 : 0.135;
  }
  const cagrLabel = `${(equity * 100).toFixed(1).replace(/\.0$/, '')}%`;
  const years = Math.min(30, Math.max(1, retireAge - age)); // Cap at 30 years max

  // Year-by-year checkpoints
  const checkpoints = [];
  const targets = [...new Set([1,5,10,Math.round(years/2),years].filter(y=>y>=1&&y<=years))].sort((a,b)=>a-b);
  
  let corpusWith = 0, stepSipWith = sip, mr = equity/12;
  let corpusWithout = 0;
  
  for(let y=1;y<=years;y++){
    for(let m=0;m<12;m++) {
      corpusWith = (corpusWith + stepSipWith) * (1 + mr);
      corpusWithout = (corpusWithout + sip) * (1 + mr);
    }
    if (targets.includes(y)) {
      checkpoints.push({
        year: y,
        corpus: useStepUp ? Math.round(corpusWith) : Math.round(corpusWithout),
        sip: useStepUp ? Math.round(stepSipWith) : sip
      });
    }
    stepSipWith *= (1 + (stepUpRate / 100));
  }
  const mathCorpusWith = Math.round(corpusWith);
  const mathCorpusWithout = Math.round(corpusWithout);
  const mathCorpus = useStepUp ? mathCorpusWith : mathCorpusWithout;
  const stepUpDifference = mathCorpusWith - mathCorpusWithout;

  const baseValue = pCurrency === 'INR' ? 10000000 : 1000000;
  const erodedValue = pCurrency === 'INR' ? 1313000 : 131300;
  const assetTerm = pCurrency === 'INR' ? 'villa or land' : 'luxury home or estate';

  // Dynamic investments based on skipLowReturn selection
  const baseInvestments = roadmap?.investments || [];
  const displayedInvestments = (allocationMode === 'split' && skipLowReturn)
    ? [
        { category: "Mid Cap & Flexi Cap Mutual Funds", percentage: 55, details: "Parag Parikh Flexi Cap Fund (Growth, 14-16% CAGR)" },
        { category: "Small Cap Mutual Funds", percentage: 45, details: "Nippon India Small Cap Fund (High volatility growth, 18-20% CAGR)" }
      ]
    : baseInvestments;

  return (
    <div className="min-h-screen bg-[#F9F8F4] text-[#2D3A31] pb-24 print:bg-white relative">

      {/* Soft background blob */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[#8C9A84] opacity-[0.05] blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">

        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 border-b border-[#E6E2DA] pb-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3 cursor-pointer" onClick={() => navigate('/')}>
              <span className="font-serif font-bold text-[#2D3A31]">WealthPath <span className="italic text-[#8C9A84]">AI</span></span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#2D3A31] leading-tight">Your WealthPath Roadmap</h1>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <button onClick={() => navigate('/')}
              className="flex items-center gap-2 bg-white border border-[#E6E2DA] text-[#2D3A31] px-5 py-2.5 rounded-full text-sm hover:border-[#8C9A84] transition-all shadow-soft">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </button>
            <button onClick={() => navigate('/onboard')}
              className="flex items-center gap-2 bg-white border border-[#E6E2DA] text-[#2D3A31] px-5 py-2.5 rounded-full text-sm hover:border-[#8C9A84] transition-all shadow-soft">
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
            <button onClick={() => window.print()}
              className="btn-primary text-xs py-2.5 px-6">
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </header>

        {/* Retire badge & Step-up strategy switcher */}
        <div className="flex flex-col gap-6 mb-10">
          <div>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D3A31] text-white rounded-full text-sm font-medium shadow-soft">
              <Target className="w-4 h-4 text-[#8C9A84]" strokeWidth={1.5} /> Retire by age {retireAge} 🎯
            </span>
          </div>

          <div className="bg-white border border-[#E6E2DA] rounded-3xl p-6 shadow-soft flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-serif font-bold text-[#2D3A31] text-lg mb-1">Select Investment Strategy</h4>
                <p className="text-xs text-[#8C9A84]">Choose whether to increase your monthly investment annually (Step-Up) or keep it flat.</p>
              </div>
              <div className="flex bg-[#F2F0EB] p-1.5 rounded-full self-start md:self-auto select-none">
                <button 
                  type="button"
                  onClick={() => { setUseStepUp(true); if (stepUpRate === 0) setStepUpRate(10); }}
                  className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                    useStepUp 
                      ? 'bg-[#2D3A31] text-white shadow-soft' 
                      : 'text-[#8C9A84] hover:text-[#2D3A31]'
                  }`}
                >
                  Annual Step-Up
                </button>
                <button 
                  type="button"
                  onClick={() => { setUseStepUp(false); }}
                  className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                    !useStepUp 
                      ? 'bg-[#C27B66] text-white shadow-soft' 
                      : 'text-[#8C9A84] hover:text-[#2D3A31]'
                  }`}
                >
                  Flat SIP (No Step-Up)
                </button>
              </div>
            </div>

            {useStepUp && (
              <div className="border-t border-[#E6E2DA] pt-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-[#2D3A31]">Choose Annual Step-Up Rate</span>
                    <span className="text-xs font-serif font-bold text-[#8C9A84] bg-[#8C9A84]/10 px-3 py-1 rounded-full">{stepUpRate}%</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="1" 
                      max="25" 
                      value={stepUpRate} 
                      onChange={(e) => setStepUpRate(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-[#F2F0EB] rounded-lg appearance-none cursor-pointer accent-[#2D3A31] focus:outline-none"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8C9A84] font-medium mr-1">Presets:</span>
                  {[5, 6, 10, 15].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setStepUpRate(rate)}
                      className={`w-9 h-9 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-200 border ${
                        stepUpRate === rate 
                          ? 'bg-[#2D3A31] border-[#2D3A31] text-white shadow-sm' 
                          : 'bg-white border-[#E6E2DA] text-[#8C9A84] hover:border-[#8C9A84] hover:text-[#2D3A31]'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Monthly SIP Needed', val: fmtCurrency(sip), sub: 'Auto-invested monthly compound engine' },
            { label: 'Emergency Fund', val: fmtCurrency(roadmap?.emergency_fund||0), sub: '6× monthly expenses buffer in liquid assets' },
            { 
              label: 'Projected Corpus', 
              val: fmtCurrency(mathCorpus), 
              sub: useStepUp 
                ? `${fmtCurrency(sip)}/mo × ${years} yrs × ${cagrLabel} CAGR + ${stepUpRate}% step-up` 
                : `${fmtCurrency(sip)}/mo × ${years} yrs × ${cagrLabel} CAGR (Flat)` 
            },
          ].map((c, i) => (
            <div key={i} className="card-botanical p-7">
              <p className="section-label mb-3">{c.label}</p>
              <p className="font-serif text-4xl font-bold text-[#8C9A84] mb-2">{c.val}</p>
              <p className="text-xs text-[#8C9A84]">{c.sub}</p>
            </div>
          ))}
        </section>

        {/* ── SURPLUS BREAKDOWN ── */}
        <section className="bg-white rounded-3xl border border-[#E6E2DA] shadow-soft p-8 mb-12">
          <h3 className="font-serif text-xl font-bold text-[#2D3A31] mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#8C9A84]" strokeWidth={1.5} /> Your Monthly Money Breakdown
          </h3>
          <div className="flex flex-col gap-4">
            {[
              { label: 'Income', val: income, color: '#8C9A84', w: income > 0 ? 100 : 0 },
              { label: 'Expenses', val: expenses, color: '#C27B66', w: pct(expenses,income) },
              { label: 'EMIs', val: emis, color: '#DCCFC2', w: pct(emis,income) },
              { label: 'Monthly SIP', val: sip, color: '#2D3A31', w: pct(sip,income) },
              { label: 'Free Cash', val: freeCash, color: '#E6E2DA', w: pct(freeCash,income) },
            ].map((r, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-[#8C9A84] font-sans">{r.label}</span>
                  <span className="text-[#2D3A31] font-semibold">{fmtCurrency(r.val)} ({r.w}%)</span>
                </div>
                <div className="w-full bg-[#F2F0EB] h-2 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${r.w}%`, backgroundColor: r.color }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── MATH + YEAR TABLE ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-3xl border border-[#E6E2DA] shadow-soft p-8">
            <h3 className="font-serif text-xl font-bold text-[#2D3A31] mb-1">The Math Behind {fmtCurrency(mathCorpus)}</h3>
            <p className="text-xs text-[#8C9A84] mb-6">How {fmtCurrency(sip)}/month multiplies over time</p>
            <div className="flex flex-col divide-y divide-[#E6E2DA]">
              {[
                { label: 'Monthly SIP', val: fmtCurrency(sip) },
                { label: 'Annual Step-up', val: useStepUp ? `${stepUpRate}% every year` : '0% (Flat SIP)' },
                { label: 'Expected CAGR', val: `${cagrLabel} (${risk} portfolio)` },
                { label: 'Time Horizon', val: `${years} years (age ${age} → ${retireAge})` },
                { label: 'Final Corpus', val: fmtCurrency(mathCorpus) },
              ].map((r, i) => (
                <div key={i} className="flex justify-between py-3 text-sm">
                  <span className="text-[#8A8F98]">{r.label}</span>
                  <span className="text-[#2D3A31] font-semibold">{r.val}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#8C9A84] mt-4 pt-4 border-t border-[#E6E2DA] italic">
              Using SIP future value formula with {cagrLabel} CAGR + {stepUpRate}% annual step-up
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#E6E2DA] shadow-soft p-8">
            <h3 className="section-label mb-6">Year by Year Growth</h3>
            <div className="flex flex-col">
              <div className="flex justify-between text-xs font-sans tracking-widest text-[#8C9A84] uppercase pb-3 border-b border-[#E6E2DA] mb-2">
                <span>Year</span><span>Corpus</span><span>Monthly SIP</span>
              </div>
              {checkpoints.map((cp, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-[#E6E2DA] text-sm last:border-0">
                  <span className="text-[#8C9A84]">Year {cp.year}</span>
                  <span className="font-serif font-bold text-[#8C9A84]">{fmtShort(cp.corpus)}</span>
                  <span className="text-[#2D3A31] font-semibold">{fmtShort(cp.sip)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COACH SUMMARY ── */}
        <section className="bg-[#2D3A31] rounded-3xl p-8 mb-12">
          <div className="flex items-center justify-between mb-5">
            <span className="section-label text-[#8C9A84]">Coach Agent Says</span>
            <span className="inline-flex px-3 py-1 bg-[#8C9A84]/20 rounded-full text-[#8C9A84] text-xs font-medium">
              Health Score: {roadmap?.health_score||0}/100
            </span>
          </div>
          <p className="text-base leading-relaxed text-white font-sans italic"
            dangerouslySetInnerHTML={{ __html: highlightCurrency((roadmap?.coach_summary||'').replace(/^["'“]+|["'”]+$/g,''), true) }} />
          <p className="text-xs text-[#8C9A84] mt-5 pt-5 border-t border-white/10 font-sans">
            Coach advice combines structural math, safe drawdown theory, and inflation indexing for 2026.
          </p>
        </section>

        {/* ── ASSET BREAKDOWN & 100% ALLOCATION INFO ── */}
        <section className="bg-white rounded-3xl border border-[#E6E2DA] shadow-soft p-8 mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#E6E2DA]">
            <h3 className="font-serif text-xl font-bold text-[#2D3A31] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#8C9A84]" strokeWidth={1.5} /> Asset Allocation & Stock/Fund Breakdown
            </h3>
            
            {/* Split vs Single Fund Option Selector */}
            <div className="flex bg-[#F2F0EB] p-1 rounded-full self-start md:self-auto select-none">
              <button 
                type="button"
                onClick={() => setAllocationMode('split')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                  allocationMode === 'split' 
                    ? 'bg-[#2D3A31] text-white shadow-soft' 
                    : 'text-[#8C9A84] hover:text-[#2D3A31]'
                }`}
              >
                Split Portfolio (Diversified)
              </button>
              <button 
                type="button"
                onClick={() => setAllocationMode('single')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                  allocationMode === 'single' 
                    ? 'bg-[#2D3A31] text-white shadow-soft' 
                    : 'text-[#8C9A84] hover:text-[#2D3A31]'
                }`}
              >
                Single Fund Option
              </button>
            </div>
          </div>

          {/* Split Portfolio Hedges Skip Toggle */}
          {allocationMode === 'split' && (
            <div className="mb-6 p-4 bg-[#F2F0EB]/60 rounded-2xl border border-[#E6E2DA] flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-[fadeIn_0.2s_ease-out]">
              <div>
                <h5 className="font-serif font-bold text-xs text-[#2D3A31] mb-0.5">🚀 Optimize for Maximum Returns (Skip Low-Return Hedges)</h5>
                <p className="text-[11px] text-[#8C9A84]">Excludes safe Gold (10%), Liquid Funds (10%), and Index ETFs (20%) to double-down on High-Growth Equity Mutual Funds.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none self-start sm:self-auto">
                <input 
                  type="checkbox" 
                  checked={skipLowReturn} 
                  onChange={(e) => setSkipLowReturn(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-[#E6E2DA] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2D3A31]"></div>
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: Visual Chart */}
            <div style={{ width: '100%', height: '280px' }} className="flex items-center justify-center">
              <DonutChart 
                data={
                  allocationMode === 'split' 
                    ? displayedInvestments 
                    : [{ category: 'Parag Parikh Flexi Cap Fund', percentage: 100 }]
                } 
              />
            </div>
            
            {/* Right: Asset Split/Single List */}
            <div className="flex flex-col gap-4">
              {allocationMode === 'split' ? (
                <div className="flex flex-col gap-3">
                  {displayedInvestments.map((item, idx) => {
                    const itemAmt = Math.round((item.percentage / 100) * sip);
                    
                    // Curated colors for notes matching the categories
                    let noteBg = 'bg-[#8C9A84]/10 border-[#8C9A84]/40 text-[#2D3A31]';
                    if (item.category.includes('Small')) {
                      noteBg = 'bg-[#C27B66]/10 border-[#C27B66]/40 text-[#2D3A31]';
                    } else if (item.category.includes('Nifty') || item.category.includes('Large')) {
                      noteBg = 'bg-[#DCCFC2]/45 border-[#DCCFC2]/80 text-[#2D3A31]';
                    } else if (item.category.includes('Gold') || item.category.includes('Silver')) {
                      noteBg = 'bg-amber-500/10 border-amber-500/40 text-amber-900';
                    } else if (item.category.includes('Liquid') || item.category.includes('Emergency')) {
                      noteBg = 'bg-sky-500/10 border-sky-500/40 text-sky-900';
                    }

                    return (
                      <div key={idx} className="flex items-center gap-4 p-3.5 bg-[#F9F8F4] border border-[#E6E2DA] rounded-2xl shadow-soft">
                        {/* Visual Note - replicating the image note graphic structure */}
                        <div className={`w-28 py-3 px-2 border rounded-xl flex flex-col items-center justify-center font-serif font-bold text-center ${noteBg} shadow-sm select-none`}>
                          <span className="text-[9px] uppercase font-sans tracking-wider opacity-60 mb-0.5">Note Split</span>
                          <span className="text-sm font-extrabold">{fmtCurrency(itemAmt)}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-[#2D3A31] truncate">{item.category}</span>
                            <span className="text-xs font-mono font-bold bg-[#F2F0EB] text-[#8C9A84] px-2 py-0.5 rounded-full">{item.percentage}%</span>
                          </div>
                          <p className="text-[11px] text-[#8C9A84] leading-relaxed italic">{item.details}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 p-4 bg-[#F9F8F4] border border-[#E6E2DA] rounded-2xl shadow-soft">
                    {/* Visual Note for Single Fund */}
                    <div className="w-28 py-4 px-2 border border-[#2D3A31] bg-[#2D3A31] text-white rounded-xl flex flex-col items-center justify-center font-serif font-bold shadow-sm select-none">
                      <span className="text-[9px] uppercase font-sans tracking-widest opacity-80 mb-0.5">Single Cash</span>
                      <span className="text-sm font-extrabold">{fmtCurrency(sip)}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-[#2D3A31]">Parag Parikh Flexi Cap Fund</span>
                        <span className="text-xs font-mono font-bold bg-[#8C9A84] text-white px-2 py-0.5 rounded-full">100%</span>
                      </div>
                      <p className="text-[11px] text-[#8C9A84] leading-relaxed italic font-serif">
                        Direct Growth Plan (~15.2% 5-year CAGR). Diversified across large stalwarts, mid-caps, and international equities.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-[#F2F0EB] rounded-2xl border border-[#E6E2DA] text-xs text-[#8C9A84]">
                    <h4 className="font-serif font-bold text-[#2D3A31] mb-2">Comparison: Split vs Single Fund</h4>
                    <table className="w-full text-left text-[11px] border-collapse mt-2 font-sans">
                      <thead>
                        <tr className="border-b border-[#E6E2DA] text-[#2D3A31] font-bold">
                          <th className="pb-1.5">Metric</th>
                          <th className="pb-1.5 text-center">Split Portfolio</th>
                          <th className="pb-1.5 text-right">Single Fund</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6E2DA]">
                        <tr>
                          <td className="py-1.5 text-[#2D3A31] font-medium">Monthly Mandates</td>
                          <td className="py-1.5 text-center">5 Automations</td>
                          <td className="py-1.5 text-right text-emerald-700 font-bold">1 Automation (Easy)</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-[#2D3A31] font-medium">Rebalancing Needs</td>
                          <td className="py-1.5 text-center">Manual Rebalancing</td>
                          <td className="py-1.5 text-right text-emerald-700 font-bold">Auto-Managed by Fund</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-[#2D3A31] font-medium">Expected CAGR</td>
                          <td className="py-1.5 text-center text-emerald-700 font-bold">
                            {skipLowReturn 
                              ? (risk === 'Aggressive' ? '17.2%' : risk === 'Conservative' ? '13.0%' : '15.8%') 
                              : (risk === 'Aggressive' ? '14%' : risk === 'Conservative' ? '9%' : '12%')}
                          </td>
                          <td className="py-1.5 text-right font-bold text-[#8C9A84]">
                            {risk === 'Aggressive' ? '15.2%' : risk === 'Conservative' ? '11%' : '13.5%'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-[#2D3A31] font-medium">Hedges (Gold/Liquid)</td>
                          <td className={`py-1.5 text-center font-bold ${skipLowReturn ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {skipLowReturn ? 'None (Skipped ❌)' : 'Included (20% ✅)'}
                          </td>
                          <td className="py-1.5 text-right text-rose-700">None (0% ❌)</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-[#2D3A31] font-medium">Volatility Risk</td>
                          <td className={`py-1.5 text-center font-bold ${skipLowReturn ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {skipLowReturn ? 'High (Speculative)' : 'Moderate (Smoothed)'}
                          </td>
                          <td className="py-1.5 text-right text-rose-700 font-bold">High (Pure Equity)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="mt-2 p-4 bg-[#F2F0EB]/50 rounded-2xl text-xs text-[#8C9A84] leading-relaxed border border-[#E6E2DA]">
                <p className="font-serif font-bold text-[#2D3A31] mb-1">Note on 100% Asset Allocation:</p>
                This allocation signifies that 100% of your systematic monthly savings are deployed across diversified asset classes to optimize returns and cushion against volatility based on your risk profile. This includes growth engines (Equities/Mutual Funds/ETFs), tax shields (ELSS/Tax Savers), and liquidity buffers (Emergency Funds/Liquid Pockets).
              </div>
              <div className="p-4 bg-[#F2F0EB]/50 rounded-2xl text-xs text-[#8C9A84] leading-relaxed border border-[#E6E2DA]">
                <p className="font-serif font-bold text-[#2D3A31] mb-1">🛡️ What is an Emergency Fund?</p>
                An Emergency Fund is a dedicated cash buffer (recommended to be 6 times your monthly expenses) kept in highly liquid, low-risk options like liquid mutual funds or high-yield savings accounts. It acts as a financial shield for unexpected events (medical emergencies, job transitions), ensuring you never have to sell your long-term compound investments (SIPs/ETFs) during market downturns.
              </div>
            </div>
          </div>
        </section>

        {/* ── 60-YEAR FINANCIAL VETERAN ADVISOR WISDOM & CAP SAFETY AWARENESS ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Veteran Advice Card */}
          <div className="bg-white rounded-3xl border border-[#E6E2DA] shadow-soft p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#C27B66]/5 rounded-full blur-2xl pointer-events-none" />
            <h3 className="font-serif text-xl font-bold text-[#2D3A31] mb-2 flex items-center gap-2">
              👴 60-Year Financial Veteran's Wisdom
            </h3>
            <p className="text-xs text-[#8C9A84] mb-6">Battle-tested advice on asset classes & wealth preservation</p>
            
            <div className="flex flex-col gap-4 text-xs">
              <div className="p-3 bg-[#F9F8F4] border border-[#E6E2DA] rounded-2xl">
                <h5 className="font-bold text-[#2D3A31] mb-1 flex items-center gap-1.5">📈 Mutual Funds & ETFs (Primary Compounding)</h5>
                <p className="text-[#8C9A84] leading-relaxed">
                  "Put 80-90% of your growth engine here. Automated monthly SIPs in low-cost index ETFs and diversified Flexi Cap funds are the single best wealth creation vehicle for retail earners."
                </p>
              </div>

              <div className="p-3 bg-[#F9F8F4] border border-[#E6E2DA] rounded-2xl">
                <h5 className="font-bold text-[#2D3A31] mb-1 flex items-center gap-1.5">🪙 Gold & Silver (Inflation Hedges)</h5>
                <p className="text-[#8C9A84] leading-relaxed">
                  "Gold and silver do not generate cash flow or earnings, but they act as global crisis insurance. Keep them strictly capped at 5-10% of your portfolio to hedge against currency decay."
                </p>
              </div>

              <div className="p-3 bg-[#F9F8F4] border border-[#E6E2DA] rounded-2xl border-rose-100 bg-rose-50/10">
                <h5 className="font-bold text-rose-800 mb-1 flex items-center gap-1.5">🏡 Land & Real Estate (Lump-Sum Blocks)</h5>
                <p className="text-rose-700 leading-relaxed">
                  "Never attempt systematic SIPs on land. Real estate is highly illiquid, capital-intensive, and carries high entry/exit friction. Accumulate a liquid, compounding equity corpus first. Once established, deploy lump sums into tangible land holdings."
                </p>
              </div>
            </div>
          </div>

          {/* Cap Awareness & Safety Warnings */}
          <div className="bg-white rounded-3xl border border-[#E6E2DA] shadow-soft p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#8C9A84]/5 rounded-full blur-2xl pointer-events-none" />
            <h3 className="font-serif text-xl font-bold text-[#2D3A31] mb-2 flex items-center gap-2">
              🛡️ Market Cap Safety & Risk Grading
            </h3>
            <p className="text-xs text-[#8C9A84] mb-6">Understanding which market caps to trust and which to avoid</p>
            
            <div className="flex flex-col gap-4 text-xs">
              <div className="p-4 border border-emerald-100 bg-emerald-50/10 rounded-2xl">
                <h5 className="font-bold text-emerald-800 mb-1.5 flex items-center gap-1.5">
                  🟢 Recommended High-Trust Assets (Large & Flexi-Cap)
                </h5>
                <p className="text-[#8C9A84] leading-relaxed mb-2">
                  Index funds (Nifty 50) and institutional Flexi-cap funds are the rock-solid bedrock of compounding. They invest in blue-chip giants (Reliance, HDFC Bank, TCS) with:
                </p>
                <ul className="list-disc pl-4 text-[#8C9A84] flex flex-col gap-1">
                  <li>Incredible institutional liquidity</li>
                  <li>Resilient balance sheets surviving economic recessions</li>
                  <li>Professional corporate governance</li>
                </ul>
              </div>

              <div className="p-4 border border-rose-100 bg-rose-50/20 rounded-2xl">
                <h5 className="font-bold text-rose-800 mb-1.5 flex items-center gap-1.5">
                  🚨 Don't Invest Warning (Speculative Micro-Caps & Penny Stocks)
                </h5>
                <p className="text-rose-700 leading-relaxed mb-2">
                  <strong>Do not buy penny stocks or unrated micro/nano caps.</strong> These assets lack liquidity and carry severe vulnerabilities:
                </p>
                <ul className="list-disc pl-4 text-rose-700 flex flex-col gap-1">
                  <li><strong>Price Manipulation:</strong> Highly susceptible to "pump & dump" schemes.</li>
                  <li><strong>Illiquidity:</strong> You may find yourself unable to sell or exit when the market drops.</li>
                  <li><strong>High Insolvency Rates:</strong> Small speculative companies have high default and failure rates. Avoid them completely for retirement planning!</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── SYSTEMATIC MECHANISMS (SIP/SWP/STP) & ETF vs MUTUAL FUNDS ── */}
        <section className="bg-white rounded-3xl border border-[#E6E2DA] shadow-soft p-8 mb-12">
          <h3 className="font-serif text-xl font-bold text-[#2D3A31] mb-8">
            Systematic Mechanisms & Investment Baskets
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
              <h4 className="section-label pb-2 border-b border-[#E6E2DA]">The 3 Systematic Mechanisms (The How)</h4>
              
              <div className="flex flex-col gap-4 text-xs">
                <div>
                  <h5 className="font-bold text-[#2D3A31] mb-1">1. SIP (Systematic Investment Plan)</h5>
                  <p className="text-[#8C9A84] leading-relaxed">
                    <strong>What it is:</strong> The Inflow mechanism. You instruct your bank to automatically invest a fixed amount every month.
                  </p>
                  <p className="text-[#8C9A84] mt-1 leading-relaxed">
                    <strong>Why use it:</strong> Eliminates the need to time the market. When prices drop, you buy more units; when they rise, you buy fewer, averaging out costs over time (Dollar/Rupee Cost Averaging).
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-[#2D3A31] mb-1">2. SWP (Systematic Withdrawal Plan)</h5>
                  <p className="text-[#8C9A84] leading-relaxed">
                    <strong>What it is:</strong> The Outflow mechanism (opposite of a SIP). Automatically sells a fixed amount of units from an accumulated lump sum every month and sends the cash to your bank account.
                  </p>
                  <p className="text-[#8C9A84] mt-1 leading-relaxed">
                    <strong>Why use it:</strong> Creates a regular, predictable, and highly tax-efficient pension stream during early retirement.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-[#2D3A31] mb-1">3. STP (Systematic Transfer Plan)</h5>
                  <p className="text-[#8C9A84] leading-relaxed">
                    <strong>What it is:</strong> The Bridge mechanism. Automatically moves a fixed chunk from a safe low-risk fund (like a Debt or Liquid Fund) to a high-growth Equity Fund at regular intervals.
                  </p>
                  <p className="text-[#8C9A84] mt-1 leading-relaxed">
                    <strong>Why use it:</strong> Protects large lump sums from sudden market crashes while gradually deploying capital into index equities.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <h4 className="section-label pb-2 border-b border-[#E6E2DA]">ETFs vs. Mutual Funds (The What)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E6E2DA] text-[#8C9A84]">
                      <th className="py-2">Feature</th>
                      <th className="py-2">Mutual Fund (MF)</th>
                      <th className="py-2">Exchange-Traded Fund (ETF)</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#2D3A31] divide-y divide-[#E6E2DA]">
                    <tr>
                      <td className="py-3 font-semibold text-[#8C9A84]">Where to Buy</td>
                      <td className="py-3">Directly from the fund house or apps (Groww, Coin, Kuvera).</td>
                      <td className="py-3">On the stock exchange via a broker (Kite, Groww, Robinhood) using a Demat account.</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-semibold text-[#8C9A84]">Pricing</td>
                      <td className="py-3">Single price (NAV) declared at the end of the trading day.</td>
                      <td className="py-3">Changes second-by-second during trading hours, like a stock share.</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-semibold text-[#8C9A84]">Automation</td>
                      <td className="py-3">Extremely easy to automate via bank mandates.</td>
                      <td className="py-3">Requires broker support for "Stock/ETF SIPs" to automate orders.</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-semibold text-[#8C9A84]">Costs</td>
                      <td className="py-3">Slightly higher management fees (Expense Ratio).</td>
                      <td className="py-3">Ultra-low management fees, but subject to broker transaction commissions.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-xxs text-[#8C9A84] bg-[#F2F0EB] p-4 rounded-xl flex flex-col gap-1 border border-[#E6E2DA]">
                <span>💡 <strong>Want to build wealth monthly?</strong> Set up a SIP.</span>
                <span>💡 <strong>Got a bonus and want to invest safely?</strong> Set up an STP.</span>
                <span>💡 <strong>Ready to live off your accumulated wealth?</strong> Set up an SWP.</span>
                <span>💡 <strong>Want to trade index baskets instantly?</strong> Buy an ETF.</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── INVESTOR RECOMMENDATIONS & STEP-UP VS FLAT WARNING ── */}
        <section className="bg-white rounded-3xl border border-[#E6E2DA] shadow-soft p-8 mb-12">
          <h3 className="font-serif text-xl font-bold text-[#2D3A31] mb-8">
            Investor Guidelines & Risk Management
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
              <div>
                <h4 className="section-label pb-2 border-b border-[#E6E2DA] mb-4">Risk Grading & Instrument Choices</h4>
                <div className="flex flex-col gap-4 text-xs">
                  <div>
                    <h5 className="font-bold text-emerald-600 mb-1">🟢 Safe & Low Volatility (Buffer & Security)</h5>
                    <p className="text-[#8C9A84] leading-relaxed">
                      Fixed Deposits (FDs), government savings bonds, liquid mutual funds, and short-term debt assets. These carry minimal capital loss risk but struggle to beat long-term inflation.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-bold text-rose-600 mb-1">🔴 Higher Volatility (Growth & Compounding)</h5>
                    <p className="text-[#8C9A84] leading-relaxed">
                      Equity Mutual Funds, Index ETFs, and sectoral plays. Volatile in the short term, but necessary to construct a significant retirement corpus over 10+ years.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="section-label pb-2 border-b border-[#E6E2DA] mb-4">Common Mistakes to Avoid</h4>
                <ul className="list-disc pl-5 text-xs text-[#8C9A84] flex flex-col gap-2">
                  <li><strong>Exiting during market dips:</strong> Redeeming investments when indices crash destroys compounding progress.</li>
                  <li><strong>Forgetting the Step-Up:</strong> Keeping your monthly savings amount flat over 30 years severely limits final wealth.</li>
                  <li><strong>Neglecting Emergency Funds:</strong> Being forced to liquidate equity portfolios to meet sudden personal crises.</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-[#E6E2DA] pt-6 lg:pt-0 lg:pl-8">
              <div>
                <h4 className="section-label pb-2 border-b border-[#E6E2DA] mb-4">The Compounding Power of Step-Up</h4>
                <p className="text-xs text-[#8C9A84] leading-relaxed mb-4">
                  Increasing your monthly investment by <strong>{stepUpRate}% every year</strong> as your salary grows dramatically accelerates compounding.
                </p>
                <div className="flex justify-between py-2 border-b border-[#E6E2DA] text-xs">
                  <span className="text-[#8C9A84]">Year 1 SIP</span>
                  <span className="text-[#2D3A31] font-semibold">{fmtCurrency(sip)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E6E2DA] text-xs">
                  <span className="text-[#8C9A84]">Year 5 SIP (with {stepUpRate}% step-up)</span>
                  <span className="text-[#2D3A31] font-semibold">{fmtCurrency(sip * Math.pow(1 + (stepUpRate / 100), 4))}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E6E2DA] text-xs">
                  <span className="text-[#8C9A84]">Year 10 SIP (with {stepUpRate}% step-up)</span>
                  <span className="text-[#2D3A31] font-semibold">{fmtCurrency(sip * Math.pow(1 + (stepUpRate / 100), 9))}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2">⚠️ The Cost of "No Step-Up" & Inflation Decay</h4>
                {!useStepUp ? (
                  <p className="text-xs text-rose-700 font-semibold mb-2">
                    🚨 By not stepping up, you lose {fmtCurrency(stepUpDifference)} in wealth! Your corpus drops from {fmtCurrency(mathCorpusWith)} to {fmtCurrency(mathCorpusWithout)}.
                  </p>
                ) : (
                  <p className="text-xs text-emerald-800 font-semibold mb-2">
                    ✅ Step-Up Advantage: Your {stepUpRate}% annual step-up strategy gains you an additional {fmtCurrency(stepUpDifference)} compared to a flat SIP!
                  </p>
                )}
                <p className="text-xs text-rose-700 leading-relaxed">
                  Inflation erodes the purchasing power of your money. At <strong>7% annual inflation</strong>, a final corpus of <strong>{fmtCurrency(baseValue)}</strong> in {years} years will hold the purchasing power of only <strong>{fmtCurrency(erodedValue)}</strong> today!
                </p>
                <p className="text-xs text-rose-700 leading-relaxed mt-2">
                  Without an annual step-up to fight inflation, your future wealth will buy only a fraction of what it buys today (e.g. buying a {assetTerm} today vs. barely buying a small car in {years} years with the same numeric amount).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── MILESTONES ── */}
        <section className="mb-12">
          <h3 className="font-serif text-xl font-bold text-[#2D3A31] mb-8 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#8C9A84]" strokeWidth={1.5} /> Milestone Roadmap
          </h3>
          <div className="relative flex flex-col gap-0 pl-2">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-[#E6E2DA]" />
            {(roadmap?.milestones||[]).map((m, i) => (
              <div key={i} className="flex gap-6 pb-8 relative">
                <div className="w-8 h-8 rounded-full bg-[#2D3A31] flex-shrink-0 flex items-center justify-center text-white text-xs font-bold z-10">
                  {i+1}
                </div>
                <div className="flex-1 bg-white rounded-2xl border border-[#E6E2DA] p-5 shadow-soft hover:-translate-y-0.5 transition-all duration-300">
                  <span className="section-label block mb-1">{m.timeframe}</span>
                  <h4 className="font-serif text-base font-bold text-[#2D3A31] mb-1">{m.title}</h4>
                  <p className="text-xs text-[#8C9A84] leading-relaxed">{(m.description||'').replace(/INR\s/g,'₹').replace(/\.0(?=\b)/g,'')}</p>
                </div>
              </div>
            ))}
          </div>
        </section>



        {/* ── FOOTER ── */}
        <footer className="border-t border-[#E6E2DA] pt-8 flex justify-between items-center text-xs text-[#8C9A84] print:hidden">
          <span className="flex items-center gap-1.5">
            Made with <Heart className="w-3.5 h-3.5 text-[#C27B66] fill-[#C27B66]" /> for early retirement planners
          </span>
          <span>WealthPath AI · Agentathon 2026</span>
        </footer>
      </div>

      {/* ── CHATBOT WIDGET (GEMINI COACH) ── */}
      <div className="print:hidden">
        {/* Toggle Button */}
        <button 
          onClick={() => setChatOpen(!chatOpen)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#2D3A31] hover:bg-[#8C9A84] text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
          title="Discuss doubts with your AI Coach"
        >
          {chatOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <MessageSquare className="w-6 h-6" />
          )}
        </button>

        {/* Chat Panel */}
        {chatOpen && (
          <div className="fixed bottom-24 right-6 z-50 w-[360px] h-[500px] bg-white border border-[#E6E2DA] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            {/* Header */}
            <div className="bg-[#2D3A31] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-sm">WealthPath Coach</h4>
                <p className="text-[10px] text-[#8C9A84]">Powered by Groq Llama 3</p>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-[#8C9A84] hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-[#2D3A31] text-white self-end rounded-br-none' 
                      : 'bg-[#F2F0EB] text-[#2D3A31] self-start rounded-bl-none border border-[#E6E2DA]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              ))}
              {chatLoading && (
                <div className="bg-[#F2F0EB] text-[#2D3A31] max-w-[80%] rounded-2xl rounded-bl-none border border-[#E6E2DA] px-4 py-3 text-xs self-start flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#8C9A84] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#8C9A84] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#8C9A84] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="border-t border-[#E6E2DA] p-3 flex gap-2 bg-[#F9F8F4]">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about your roadmap..."
                disabled={chatLoading}
                className="flex-1 bg-white border border-[#E6E2DA] rounded-full px-4 py-2 text-xs text-[#2D3A31] focus:outline-none focus:border-[#8C9A84] disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="w-8 h-8 rounded-full bg-[#2D3A31] text-white flex items-center justify-center hover:bg-[#8C9A84] transition-colors disabled:opacity-40 disabled:hover:bg-[#2D3A31]"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}
