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

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('wealthpath_theme') === 'dark');

  const toggleTheme = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('wealthpath_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const r = localStorage.getItem('wealthpath_roadmap');
    const p = localStorage.getItem('wealthpath_profile');
    if (r) { try { setRoadmap(JSON.parse(r)); } catch { navigate('/onboard'); } }
    else navigate('/onboard');
    if (p) { try { setProfile(JSON.parse(p)); } catch {} }
  }, [navigate]);

  if (!roadmap) return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-[#0F1712]' : 'bg-[#F9F8F4]'}`}>
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
  
  const getSingleFund = () => {
    switch (pCurrency) {
      case 'INR':
        return {
          name: "Parag Parikh Flexi Cap Fund",
          details: "Direct Growth Plan (~15.2% 5-year CAGR). Diversified across large stalwarts, mid-caps, and international equities."
        };
      case 'GBP':
        return {
          name: "Vanguard FTSE All-World UCITS ETF (VWRL)",
          details: "Direct UK accumulation plan (~10.8% 5-year CAGR). Spreads equity exposure across thousands of global giants for robust hands-off growth."
        };
      case 'AED':
        return {
          name: "iShares Core MSCI World UCITS ETF (IWDA)",
          details: "USD-denominated, tax-efficient global equity tracking (~11.2% CAGR) tailored for international professionals."
        };
      case 'AUD':
        return {
          name: "Vanguard Diversified High Growth Index ETF (VDHG)",
          details: "Pre-mixed high growth allocation (~11.5% CAGR) with built-in franking credits for Australian tax efficiency."
        };
      case 'USD':
      default:
        return {
          name: "Vanguard Total World Stock ETF (VT)",
          details: "Broad global equity index tracking (~11.8% CAGR). Captures global growth across 8,000+ companies under a single high-trust portfolio."
        };
    }
  };

  const getOptimizedInvestments = () => {
    switch (pCurrency) {
      case 'INR':
        return [
          { category: "Mid Cap & Flexi Cap Mutual Funds", percentage: 55, details: "Parag Parikh Flexi Cap Fund (Growth, 14-16% CAGR)" },
          { category: "Small Cap Mutual Funds", percentage: 45, details: "Nippon India Small Cap Fund (High volatility growth, 18-20% CAGR)" }
        ];
      case 'GBP':
        return [
          { category: "Global Equity Index Fund", percentage: 55, details: "Vanguard FTSE All-World Index (VWRL) (Global diversification, 9-11% CAGR)" },
          { category: "UK & World Small Cap Growth", percentage: 45, details: "iShares MSCI World Small Cap UCITS ETF (WSML) (Dynamic small cap exposure, 12-14% CAGR)" }
        ];
      case 'AED':
        return [
          { category: "Developed Markets Global Tracker", percentage: 55, details: "iShares Core MSCI World UCITS ETF (IWDA) (Developed countries giants, 10-12% CAGR)" },
          { category: "Emerging Markets Hyper Growth", percentage: 45, details: "iShares Core MSCI EM IMI UCITS ETF (EIMI) (Emerging tech and consumer stocks, 13-15% CAGR)" }
        ];
      case 'AUD':
        return [
          { category: "Australian Index Growth (VAS)", percentage: 55, details: "Vanguard Australian Shares Index ETF (VAS) (ASX 300 index, franked dividends, 9-11% CAGR)" },
          { category: "International Shares Growth (VGS)", percentage: 45, details: "Vanguard MSCI Index International Shares ETF (VGS) (Global tech and innovators, 12-14% CAGR)" }
        ];
      case 'USD':
      default:
        return [
          { category: "Vanguard S&P 500 Index (VOO)", percentage: 55, details: "Vanguard S&P 500 ETF (VOO) (Stable Large Cap compounding, 11-13% CAGR)" },
          { category: "Vanguard Small-Cap Growth (VBK)", percentage: 45, details: "Vanguard Small-Cap Growth ETF (VBK) (High volatility mid/small caps, 14-16% CAGR)" }
        ];
    }
  };

  const getSingleFundCAGR = () => {
    switch (pCurrency) {
      case 'INR':
        return risk === 'Aggressive' ? '15.2%' : risk === 'Conservative' ? '11%' : '13.5%';
      case 'GBP':
        return risk === 'Aggressive' ? '10.8%' : risk === 'Conservative' ? '7%' : '9%';
      case 'AED':
        return risk === 'Aggressive' ? '11.2%' : risk === 'Conservative' ? '7.5%' : '9.5%';
      case 'AUD':
        return risk === 'Aggressive' ? '11.5%' : risk === 'Conservative' ? '7.5%' : '9.5%';
      case 'USD':
      default:
        return risk === 'Aggressive' ? '12.5%' : risk === 'Conservative' ? '8%' : '10.5%';
    }
  };

  const getDynamicCAGR = () => {
    if (allocationMode === 'split') {
      if (skipLowReturn) {
        switch (pCurrency) {
          case 'INR':
            return risk === 'Aggressive' ? 0.172 : risk === 'Conservative' ? 0.130 : 0.158;
          case 'GBP':
            return risk === 'Aggressive' ? 0.138 : risk === 'Conservative' ? 0.098 : 0.118;
          case 'AED':
            return risk === 'Aggressive' ? 0.142 : risk === 'Conservative' ? 0.102 : 0.122;
          case 'AUD':
            return risk === 'Aggressive' ? 0.145 : risk === 'Conservative' ? 0.105 : 0.125;
          case 'USD':
          default:
            return risk === 'Aggressive' ? 0.148 : risk === 'Conservative' ? 0.108 : 0.128;
        }
      } else {
        switch (pCurrency) {
          case 'INR':
            return risk === 'Aggressive' ? 0.14 : risk === 'Conservative' ? 0.09 : 0.12;
          case 'GBP':
            return risk === 'Aggressive' ? 0.108 : risk === 'Conservative' ? 0.068 : 0.088;
          case 'AED':
            return risk === 'Aggressive' ? 0.112 : risk === 'Conservative' ? 0.072 : 0.092;
          case 'AUD':
            return risk === 'Aggressive' ? 0.115 : risk === 'Conservative' ? 0.072 : 0.092;
          case 'USD':
          default:
            return risk === 'Aggressive' ? 0.118 : risk === 'Conservative' ? 0.078 : 0.098;
        }
      }
    } else {
      switch (pCurrency) {
        case 'INR':
          return risk === 'Aggressive' ? 0.152 : risk === 'Conservative' ? 0.11 : 0.135;
        case 'GBP':
          return risk === 'Aggressive' ? 0.118 : risk === 'Conservative' ? 0.078 : 0.098;
        case 'AED':
          return risk === 'Aggressive' ? 0.122 : risk === 'Conservative' ? 0.082 : 0.102;
        case 'AUD':
          return risk === 'Aggressive' ? 0.125 : risk === 'Conservative' ? 0.082 : 0.102;
        case 'USD':
        default:
          return risk === 'Aggressive' ? 0.128 : risk === 'Conservative' ? 0.088 : 0.108;
      }
    }
  };

  const getTaxMechanism = () => {
    switch (pCurrency) {
      case 'INR':
        return {
          title: "4. ELSS (Equity Linked Savings Scheme) / Tax Saver",
          desc: "The Tax-Saving mechanism. A special category of diversified mutual funds in India that allows you to claim tax deductions under Section 80C.",
          why: "Provides dual benefits of wealth compounding via equity exposure plus tax deductions, with a mandatory 3-year lock-in that enforces long-term discipline."
        };
      case 'USD':
        return {
          title: "4. Roth IRA / 401(k) (Tax-Advantaged Accounts)",
          desc: "The Tax-Sheltered mechanism. US accounts that allow post-tax investments for tax-free growth (Roth) or pre-tax investments to reduce taxable income (401k).",
          why: "Eliminates capital gains tax entirely on retirement withdrawals and leverages employer matches (401k) to boost compound gains."
        };
      case 'GBP':
        return {
          title: "4. ISA (Individual Savings Account) & SIPPs",
          desc: "The UK Tax Shield. Investment wrappers allowing you to save up to £20,000 annually entirely immune from income or capital gains tax.",
          why: "Protects monthly index compounding from HMRC tax brackets, serving as a critical tax shelter for early drawdowns."
        };
      case 'AED':
        return {
          title: "4. Offshore Tax-Free Investment Vehicles",
          desc: "The Tax-Haven optimization. Since UAE features 0% income tax, this represents global index ETFs held in tax-efficient international brokerage structures.",
          why: "Ensures expats maintain frictionless tax-free compounding and smooth global repatriation of funds."
        };
      default:
        return {
          title: "4. Tax-Advantaged Retirement Savings Accounts",
          desc: "The global Tax Optimizer. General tax-deferred or tax-exempt retirement plans offered by your country of residence.",
          why: "Minimizes tax drag on compounding dividends and capital gains, ensuring your corpus grows significantly faster."
        };
    }
  };

  const getDynamicCoachSummary = () => {
    let summary = roadmap?.coach_summary || '';
    if (!summary) return '';
    
    // Replace default 10% step-up references with selected stepUpRate
    summary = summary.replace(/\b10\s*%/g, `${stepUpRate}%`);
    
    // Replace the original corpus values with the dynamic compound corpus
    const originalCorpusAmt = roadmap?.projected_corpus || 0;
    if (originalCorpusAmt > 0) {
      const origFormatted = fmtCurrency(originalCorpusAmt);
      const newFormatted = fmtCurrency(mathCorpus);
      if (summary.includes(origFormatted)) {
        summary = summary.split(origFormatted).join(newFormatted);
      }
    }
    return summary;
  };

  const equity = getDynamicCAGR();
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
    ? getOptimizedInvestments()
    : baseInvestments;

  return (
    <div className={`min-h-screen pb-24 print:bg-white relative transition-colors duration-300 ${darkMode ? 'bg-[#0F1712] text-[#F0F5F2]' : 'bg-[#F9F8F4] text-[#2D3A31]'}`}>

      {/* Soft background blob */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[#8C9A84] opacity-[0.05] blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">

        {/* ── HEADER ── */}
        <header className={`flex flex-col md:flex-row md:items-end justify-between gap-5 border-b pb-8 mb-12 ${darkMode ? 'border-[#24352B]' : 'border-[#E6E2DA]'}`}>
          <div>
            <div className="flex items-center gap-2 mb-3 cursor-pointer" onClick={() => navigate('/')}>
              <span className={`font-serif font-bold ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>WealthPath <span className="italic text-[#8C9A84]">AI</span></span>
            </div>
            <h1 className={`font-serif text-4xl md:text-5xl font-bold leading-tight ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>Your WealthPath Roadmap</h1>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <button onClick={() => navigate('/')}
              className={`flex items-center gap-2 border px-5 py-2.5 rounded-full text-sm transition-all shadow-soft ${
                darkMode 
                  ? 'bg-[#18231C] border-[#24352B] text-[#F0F5F2] hover:border-[#8C9A84]' 
                  : 'bg-white border-[#E6E2DA] text-[#2D3A31] hover:border-[#8C9A84]'
              }`}>
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </button>
            <button onClick={() => navigate('/onboard')}
              className={`flex items-center gap-2 border px-5 py-2.5 rounded-full text-sm transition-all shadow-soft ${
                darkMode 
                  ? 'bg-[#18231C] border-[#24352B] text-[#F0F5F2] hover:border-[#8C9A84]' 
                  : 'bg-white border-[#E6E2DA] text-[#2D3A31] hover:border-[#8C9A84]'
              }`}>
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
            <button onClick={toggleTheme}
              className={`flex items-center justify-center w-10 h-10 border rounded-full transition-all shadow-soft ${
                darkMode 
                  ? 'bg-[#18231C] border-[#24352B] text-white hover:border-[#8C9A84]' 
                  : 'bg-white border-[#E6E2DA] text-[#2D3A31] hover:border-[#8C9A84]'
              }`}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              {darkMode ? '☀️' : '🌙'}
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
            <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium shadow-soft ${
              darkMode ? 'bg-[#8C9A84] text-[#0F1712]' : 'bg-[#2D3A31] text-white'
            }`}>
              <Target className="w-4 h-4" strokeWidth={1.5} /> Retire by age {retireAge} 🎯
            </span>
          </div>

          <div className={`border rounded-3xl p-6 shadow-soft flex flex-col gap-6 ${
            darkMode ? 'bg-[#18231C] border-[#24352B]' : 'bg-white border-[#E6E2DA]'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className={`font-serif font-bold text-lg mb-1 ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>Select Investment Strategy</h4>
                <p className="text-xs text-[#8C9A84]">Choose whether to increase your monthly investment annually (Step-Up) or keep it flat.</p>
              </div>
              <div className={`flex p-1.5 rounded-full self-start md:self-auto select-none ${
                darkMode ? 'bg-[#121C16]' : 'bg-[#F2F0EB]'
              }`}>
                <button 
                  type="button"
                  onClick={() => { setUseStepUp(true); if (stepUpRate === 0) setStepUpRate(10); }}
                  className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                    useStepUp 
                      ? (darkMode ? 'bg-[#8C9A84] text-[#0F1712] shadow-soft' : 'bg-[#2D3A31] text-white shadow-soft') 
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
              <div className={`border-t pt-4 flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                darkMode ? 'border-[#24352B]' : 'border-[#E6E2DA]'
              }`}>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>Choose Annual Step-Up Rate</span>
                    <span className="text-xs font-serif font-bold text-[#8C9A84] bg-[#8C9A84]/10 px-3 py-1 rounded-full">{stepUpRate}%</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="1" 
                      max="25" 
                      value={stepUpRate} 
                      onChange={(e) => setStepUpRate(parseInt(e.target.value))}
                      className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none ${
                        darkMode ? 'bg-[#121C16] accent-[#8C9A84]' : 'bg-[#F2F0EB] accent-[#2D3A31]'
                      }`}
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
                          ? (darkMode ? 'bg-[#8C9A84] border-[#8C9A84] text-[#0F1712] shadow-sm' : 'bg-[#2D3A31] border-[#2D3A31] text-white shadow-sm') 
                          : (darkMode ? 'bg-[#121C16] border-[#24352B] text-[#A3B19D] hover:border-[#8C9A84]' : 'bg-white border-[#E6E2DA] text-[#8C9A84] hover:border-[#8C9A84] hover:text-[#2D3A31]')
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
        <section className={`rounded-3xl border shadow-soft p-8 mb-12 transition-colors duration-300 ${
          darkMode ? 'bg-[#18231C] border-[#24352B]' : 'bg-white border-[#E6E2DA]'
        }`}>
          <h3 className={`font-serif text-xl font-bold mb-6 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>
            <Zap className="w-5 h-5 text-[#8C9A84]" strokeWidth={1.5} /> Your Monthly Money Breakdown
          </h3>
          <div className="flex flex-col gap-4">
            {[
              { label: 'Income', val: income, color: '#8C9A84', w: income > 0 ? 100 : 0 },
              { label: 'Expenses', val: expenses, color: '#C27B66', w: pct(expenses,income) },
              { label: 'EMIs', val: emis, color: '#DCCFC2', w: pct(emis,income) },
              { label: 'Monthly SIP', val: sip, color: '#2D3A31', w: pct(sip,income) },
              { label: 'Free Cash', val: freeCash, color: darkMode ? '#8C9A84' : '#E6E2DA', w: pct(freeCash,income) },
            ].map((r, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-[#8C9A84] font-sans">{r.label}</span>
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>{fmtCurrency(r.val)} ({r.w}%)</span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-[#121C16]' : 'bg-[#F2F0EB]'}`}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${r.w}%`, backgroundColor: r.color }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── MATH + YEAR TABLE ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <div className={`rounded-3xl border shadow-soft p-8 transition-colors duration-300 ${
            darkMode ? 'bg-[#18231C] border-[#24352B]' : 'bg-white border-[#E6E2DA]'
          }`}>
            <h3 className={`font-serif text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>The Math Behind {fmtCurrency(mathCorpus)}</h3>
            <p className="text-xs text-[#8C9A84] mb-6">How {fmtCurrency(sip)}/month multiplies over time</p>
            <div className={`flex flex-col divide-y ${darkMode ? 'divide-[#24352B]' : 'divide-[#E6E2DA]'}`}>
              {[
                { label: 'Monthly SIP', val: fmtCurrency(sip) },
                { label: 'Annual Step-up', val: useStepUp ? `${stepUpRate}% every year` : '0% (Flat SIP)' },
                { label: 'Expected CAGR', val: `${cagrLabel} (${risk} portfolio)` },
                { label: 'Time Horizon', val: `${years} years (age ${age} → ${retireAge})` },
                { label: 'Final Corpus', val: fmtCurrency(mathCorpus) },
              ].map((r, i) => (
                <div key={i} className="flex justify-between py-3 text-sm">
                  <span className="text-[#8A8F98]">{r.label}</span>
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>{r.val}</span>
                </div>
              ))}
            </div>
            <p className={`text-xs text-[#8C9A84] mt-4 pt-4 border-t italic ${darkMode ? 'border-[#24352B]' : 'border-[#E6E2DA]'}`}>
              Using SIP future value formula with {cagrLabel} CAGR + {stepUpRate}% annual step-up
            </p>
          </div>

          <div className={`rounded-3xl border shadow-soft p-8 transition-colors duration-300 ${
            darkMode ? 'bg-[#18231C] border-[#24352B]' : 'bg-white border-[#E6E2DA]'
          }`}>
            <h3 className="section-label mb-6">Year by Year Growth</h3>
            <div className="flex flex-col">
              <div className={`flex justify-between text-xs font-sans tracking-widest text-[#8C9A84] uppercase pb-3 border-b mb-2 ${
                darkMode ? 'border-[#24352B]' : 'border-[#E6E2DA]'
              }`}>
                <span>Year</span><span>Corpus</span><span>Monthly SIP</span>
              </div>
              {checkpoints.map((cp, i) => (
                <div key={i} className={`flex justify-between items-center py-3 border-b text-sm last:border-0 ${
                  darkMode ? 'border-[#24352B]' : 'border-[#E6E2DA]'
                }`}>
                  <span className="text-[#8C9A84]">Year {cp.year}</span>
                  <span className="font-serif font-bold text-[#8C9A84]">{fmtShort(cp.corpus)}</span>
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>{fmtShort(cp.sip)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COACH SUMMARY ── */}
        <section className={`rounded-3xl p-8 mb-12 border ${
          darkMode ? 'bg-[#18231C] border-[#24352B]' : 'bg-[#2D3A31] border-transparent'
        }`}>
          <div className="flex items-center justify-between mb-5">
            <span className="section-label text-[#8C9A84]">Coach Agent Says</span>
            <span className="inline-flex px-3 py-1 bg-[#8C9A84]/20 rounded-full text-[#8C9A84] text-xs font-medium">
              Health Score: {roadmap?.health_score||0}/100
            </span>
          </div>
          <p className="text-base leading-relaxed text-white font-sans italic"
            dangerouslySetInnerHTML={{ __html: highlightCurrency((getDynamicCoachSummary()||'').replace(/^["'“]+|["'”]+$/g,''), true) }} />
          <p className="text-xs text-[#8C9A84] mt-5 pt-5 border-t border-white/10 font-sans">
            Coach advice combines structural math, safe drawdown theory, and inflation indexing for 2026.
          </p>
        </section>

        {/* ── ASSET BREAKDOWN & 100% ALLOCATION INFO ── */}
        <section className={`rounded-3xl border shadow-soft p-8 mb-12 transition-colors duration-300 ${
          darkMode ? 'bg-[#18231C] border-[#24352B]' : 'bg-white border-[#E6E2DA]'
        }`}>
          <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b ${
            darkMode ? 'border-[#24352B]' : 'border-[#E6E2DA]'
          }`}>
            <h3 className={`font-serif text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>
              <TrendingUp className="w-5 h-5 text-[#8C9A84]" strokeWidth={1.5} /> Asset Allocation & Stock/Fund Breakdown
            </h3>
            
            {/* Split vs Single Fund Option Selector */}
            <div className={`flex p-1 rounded-full self-start md:self-auto select-none ${
              darkMode ? 'bg-[#121C16]' : 'bg-[#F2F0EB]'
            }`}>
              <button 
                type="button"
                onClick={() => setAllocationMode('split')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                  allocationMode === 'split' 
                    ? (darkMode ? 'bg-[#8C9A84] text-[#0F1712] shadow-soft' : 'bg-[#2D3A31] text-white shadow-soft') 
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
                    ? (darkMode ? 'bg-[#8C9A84] text-[#0F1712] shadow-soft' : 'bg-[#2D3A31] text-white shadow-soft') 
                    : 'text-[#8C9A84] hover:text-[#2D3A31]'
                }`}
              >
                Single Fund Option
              </button>
            </div>
          </div>

          {/* Split Portfolio Hedges Skip Toggle */}
          {allocationMode === 'split' && (
            <div className={`mb-6 p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-[fadeIn_0.2s_ease-out] ${
              darkMode ? 'bg-[#121C16]/80 border-[#24352B]' : 'bg-[#F2F0EB]/60 border-[#E6E2DA]'
            }`}>
              <div>
                <h5 className={`font-serif font-bold text-xs mb-0.5 ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>🚀 Optimize for Maximum Returns (Skip Low-Return Hedges)</h5>
                <p className="text-[11px] text-[#8C9A84]">Excludes safe Gold (10%), Liquid Funds (10%), and Index ETFs (20%) to double-down on High-Growth Equity Mutual Funds.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none self-start sm:self-auto">
                <input 
                  type="checkbox" 
                  checked={skipLowReturn} 
                  onChange={(e) => setSkipLowReturn(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className={`w-11 h-6 bg-[#E6E2DA] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                  darkMode ? 'peer-checked:bg-[#8C9A84]' : 'peer-checked:bg-[#2D3A31]'
                }`}></div>
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
                    : [{ category: getSingleFund().name, percentage: 100 }]
                } 
                darkMode={darkMode}
              />
            </div>
            
            {/* Right: Asset Split/Single List */}
            <div className="flex flex-col gap-4">
              {allocationMode === 'split' ? (
                <div className="flex flex-col gap-3">
                  {displayedInvestments.map((item, idx) => {
                    const itemAmt = Math.round((item.percentage / 100) * sip);
                    
                    // Curated colors for notes matching the categories
                    let noteBg = `bg-[#8C9A84]/10 border-[#8C9A84]/40 ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`;
                    if (item.category.includes('Small')) {
                      noteBg = `bg-[#C27B66]/10 border-[#C27B66]/40 ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`;
                    } else if (item.category.includes('Nifty') || item.category.includes('Large')) {
                      noteBg = `bg-[#DCCFC2]/45 border-[#DCCFC2]/80 ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`;
                    } else if (item.category.includes('Gold') || item.category.includes('Silver')) {
                      noteBg = `bg-amber-500/10 border-amber-500/40 ${darkMode ? 'text-amber-200' : 'text-amber-900'}`;
                    } else if (item.category.includes('Liquid') || item.category.includes('Emergency')) {
                      noteBg = `bg-sky-500/10 border-sky-500/40 ${darkMode ? 'text-sky-200' : 'text-sky-900'}`;
                    }

                    return (
                      <div key={idx} className={`flex items-center gap-4 p-3.5 border rounded-2xl shadow-soft transition-colors duration-300 ${
                        darkMode ? 'bg-[#121C16] border-[#24352B]' : 'bg-[#F9F8F4] border-[#E6E2DA]'
                      }`}>
                        {/* Visual Note - replicating the image note graphic structure */}
                        <div className={`w-28 py-3 px-2 border rounded-xl flex flex-col items-center justify-center font-serif font-bold text-center ${noteBg} shadow-sm select-none`}>
                          <span className="text-[9px] uppercase font-sans tracking-wider opacity-60 mb-0.5">Note Split</span>
                          <span className="text-sm font-extrabold">{fmtCurrency(itemAmt)}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-xs font-bold truncate ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>{item.category}</span>
                            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                              darkMode ? 'bg-[#121C16] text-[#8C9A84]' : 'bg-[#F2F0EB] text-[#8C9A84]'
                            }`}>{item.percentage}%</span>
                          </div>
                          <p className="text-[11px] text-[#8C9A84] leading-relaxed italic">{item.details}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className={`flex items-center gap-4 p-4 border rounded-2xl shadow-soft transition-colors duration-300 ${
                    darkMode ? 'bg-[#121C16] border-[#24352B]' : 'bg-[#F9F8F4] border-[#E6E2DA]'
                  }`}>
                    {/* Visual Note for Single Fund */}
                    <div className={`w-28 py-4 px-2 border rounded-xl flex flex-col items-center justify-center font-serif font-bold shadow-sm select-none ${
                      darkMode ? 'border-[#8C9A84] bg-[#8C9A84] text-[#0F1712]' : 'border-[#2D3A31] bg-[#2D3A31] text-white'
                    }`}>
                      <span className="text-[9px] uppercase font-sans tracking-widest opacity-80 mb-0.5">Single Cash</span>
                      <span className="text-sm font-extrabold">{fmtCurrency(sip)}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>{getSingleFund().name}</span>
                        <span className="text-xs font-mono font-bold bg-[#8C9A84] text-white px-2 py-0.5 rounded-full">100%</span>
                      </div>
                      <p className="text-[11px] text-[#8C9A84] leading-relaxed italic font-serif">
                        {getSingleFund().details}
                      </p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border text-xs text-[#8C9A84] transition-colors duration-300 ${
                    darkMode ? 'bg-[#121C16] border-[#24352B]' : 'bg-[#F2F0EB] border-[#E6E2DA]'
                  }`}>
                    <h4 className={`font-serif font-bold mb-2 ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>Comparison: Split vs Single Fund</h4>
                    <table className="w-full text-left text-[11px] border-collapse mt-2 font-sans">
                      <thead>
                        <tr className={`border-b font-bold ${darkMode ? 'border-[#24352B] text-white' : 'border-[#E6E2DA] text-[#2D3A31]'}`}>
                          <th className="pb-1.5">Metric</th>
                          <th className="pb-1.5 text-center">Split Portfolio</th>
                          <th className="pb-1.5 text-right">Single Fund</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? 'divide-[#24352B]' : 'divide-[#E6E2DA]'}`}>
                        <tr>
                          <td className={`py-1.5 font-medium ${darkMode ? 'text-[#A3B19D]' : 'text-[#2D3A31]'}`}>Monthly Mandates</td>
                          <td className="py-1.5 text-center">5 Automations</td>
                          <td className="py-1.5 text-right text-emerald-700 font-bold">1 Automation (Easy)</td>
                        </tr>
                        <tr>
                          <td className={`py-1.5 font-medium ${darkMode ? 'text-[#A3B19D]' : 'text-[#2D3A31]'}`}>Rebalancing Needs</td>
                          <td className="py-1.5 text-center">Manual Rebalancing</td>
                          <td className="py-1.5 text-right text-emerald-700 font-bold">Auto-Managed by Fund</td>
                        </tr>
                        <tr>
                          <td className={`py-1.5 font-medium ${darkMode ? 'text-[#A3B19D]' : 'text-[#2D3A31]'}`}>Expected CAGR</td>
                          <td className="py-1.5 text-center text-emerald-700 font-bold">
                            {skipLowReturn 
                              ? (risk === 'Aggressive' ? '17.2%' : risk === 'Conservative' ? '13.0%' : '15.8%') 
                              : (risk === 'Aggressive' ? '14%' : risk === 'Conservative' ? '9%' : '12%')}
                          </td>
                          <td className="py-1.5 text-right font-bold text-[#8C9A84]">
                            {getSingleFundCAGR()}
                          </td>
                        </tr>
                        <tr>
                          <td className={`py-1.5 font-medium ${darkMode ? 'text-[#A3B19D]' : 'text-[#2D3A31]'}`}>Hedges (Gold/Liquid)</td>
                          <td className={`py-1.5 text-center font-bold ${skipLowReturn ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {skipLowReturn ? 'None (Skipped ❌)' : 'Included (20% ✅)'}
                          </td>
                          <td className="py-1.5 text-right text-rose-700">None (0% ❌)</td>
                        </tr>
                        <tr>
                          <td className={`py-1.5 font-medium ${darkMode ? 'text-[#A3B19D]' : 'text-[#2D3A31]'}`}>Volatility Risk</td>
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

              <div className={`mt-2 p-4 rounded-2xl text-xs text-[#8C9A84] leading-relaxed border ${
                darkMode ? 'bg-[#121C16]/50 border-[#24352B]' : 'bg-[#F2F0EB]/50 border-[#E6E2DA]'
              }`}>
                <p className={`font-serif font-bold mb-1 ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>Note on 100% Asset Allocation:</p>
                This allocation signifies that 100% of your systematic monthly savings are deployed across diversified asset classes to optimize returns and cushion against volatility based on your risk profile. This includes growth engines (Equities/Mutual Funds/ETFs), tax shields (ELSS/Tax Savers), and liquidity buffers (Emergency Funds/Liquid Pockets).
              </div>
              <div className={`p-4 rounded-2xl text-xs text-[#8C9A84] leading-relaxed border ${
                darkMode ? 'bg-[#121C16]/50 border-[#24352B]' : 'bg-[#F2F0EB]/50 border-[#E6E2DA]'
              }`}>
                <p className={`font-serif font-bold mb-1 ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>🛡️ What is an Emergency Fund?</p>
                An Emergency Fund is a dedicated cash buffer (recommended to be 6 times your monthly expenses) kept in highly liquid, low-risk options like liquid mutual funds or high-yield savings accounts. It acts as a financial shield for unexpected events (medical emergencies, job transitions), ensuring you never have to sell your long-term compound investments (SIPs/ETFs) during market downturns.
              </div>
            </div>
          </div>
        </section>

        {/* ── 60-YEAR FINANCIAL VETERAN ADVISOR WISDOM & CAP SAFETY AWARENESS ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Veteran Advice Card */}
          <div className={`rounded-3xl border shadow-soft p-8 relative overflow-hidden transition-colors duration-300 ${
            darkMode ? 'bg-[#18231C] border-[#24352B]' : 'bg-white border-[#E6E2DA]'
          }`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#C27B66]/5 rounded-full blur-2xl pointer-events-none" />
            <h3 className={`font-serif text-xl font-bold mb-2 flex items-center gap-2 transition-colors ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>
              👴 60-Year Financial Veteran's Wisdom
            </h3>
            <p className="text-xs text-[#8C9A84] mb-6">Battle-tested advice on asset classes & wealth preservation</p>
            
            <div className="flex flex-col gap-4 text-xs">
              <div className={`p-3 border rounded-2xl transition-colors ${darkMode ? 'bg-[#121C16] border-[#24352B]' : 'bg-[#F9F8F4] border-[#E6E2DA]'}`}>
                <h5 className={`font-bold mb-1 flex items-center gap-1.5 transition-colors ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>📈 Mutual Funds & ETFs (Primary Compounding)</h5>
                <p className="text-[#8C9A84] leading-relaxed">
                  "Put 80-90% of your growth engine here. Automated monthly SIPs in low-cost index ETFs and diversified Flexi Cap funds are the single best wealth creation vehicle for retail earners."
                </p>
              </div>

              <div className={`p-3 border rounded-2xl transition-colors ${darkMode ? 'bg-[#121C16] border-[#24352B]' : 'bg-[#F9F8F4] border-[#E6E2DA]'}`}>
                <h5 className={`font-bold mb-1 flex items-center gap-1.5 transition-colors ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>🪙 Gold & Silver (Inflation Hedges)</h5>
                <p className="text-[#8C9A84] leading-relaxed">
                  "Gold and silver do not generate cash flow or earnings, but they act as global crisis insurance. Keep them strictly capped at 5-10% of your portfolio to hedge against currency decay."
                </p>
              </div>

              <div className={`p-3 border rounded-2xl transition-colors ${
                darkMode ? 'border-rose-950/40 bg-rose-950/10' : 'border-rose-100 bg-rose-50/10'
              }`}>
                <h5 className={`font-bold mb-1 flex items-center gap-1.5 transition-colors ${darkMode ? 'text-rose-400' : 'text-rose-800'}`}>🏡 Land & Real Estate (Lump-Sum Blocks)</h5>
                <p className={`leading-relaxed transition-colors ${darkMode ? 'text-rose-300/90' : 'text-rose-700'}`}>
                  "Never attempt systematic SIPs on land. Real estate is highly illiquid, capital-intensive, and carries high entry/exit friction. Accumulate a liquid, compounding equity corpus first. Once established, deploy lump sums into tangible land holdings."
                </p>
              </div>

              <div className={`p-3 border rounded-2xl transition-colors ${darkMode ? 'bg-[#121C16] border-[#24352B]' : 'bg-[#F9F8F4] border-[#E6E2DA]'}`}>
                <h5 className={`font-bold mb-1 flex items-center gap-1.5 transition-colors ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>⚖️ Tax Saving with Existing Loans</h5>
                <p className="text-[#8C9A84] leading-relaxed">
                  {pCurrency === 'INR' ? (
                    "If you have a Home Loan, leverage Section 24(b) to deduct up to ₹2 Lakhs on interest, and Section 80C for principal repayment. For Education Loans, claim unlimited interest deductions under Section 80E. Check if these loan benefits already fill your tax exemption quotas before locking extra cash into ELSS."
                  ) : (
                    "Prioritize tax deductions on loan interest. In many regions, home mortgage interest and student loan interest payments are tax-deductible. Ensure you claim these existing exemptions before committing additional surplus to voluntary retirement funds."
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Cap Awareness & Safety Warnings */}
          <div className={`rounded-3xl border shadow-soft p-8 relative overflow-hidden transition-colors duration-300 ${
            darkMode ? 'bg-[#18231C] border-[#24352B]' : 'bg-white border-[#E6E2DA]'
          }`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#8C9A84]/5 rounded-full blur-2xl pointer-events-none" />
            <h3 className={`font-serif text-xl font-bold mb-2 flex items-center gap-2 transition-colors ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>
              🛡️ Market Cap Safety & Risk Grading
            </h3>
            <p className="text-xs text-[#8C9A84] mb-6">Understanding which market caps to trust and which to avoid</p>
            
            <div className="flex flex-col gap-4 text-xs">
              <div className={`p-4 border rounded-2xl transition-colors ${
                darkMode ? 'border-emerald-950 bg-emerald-950/10' : 'border-emerald-100 bg-emerald-50/10'
              }`}>
                <h5 className={`font-bold mb-1.5 flex items-center gap-1.5 transition-colors ${darkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>
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

              <div className={`p-4 border rounded-2xl transition-colors ${
                darkMode ? 'border-rose-950 bg-rose-950/10' : 'border-rose-100 bg-rose-50/20'
              }`}>
                <h5 className={`font-bold mb-1.5 flex items-center gap-1.5 transition-colors ${darkMode ? 'text-rose-400' : 'text-rose-800'}`}>
                  🚨 Don't Invest Warning (Speculative Micro-Caps & Penny Stocks)
                </h5>
                <p className={`leading-relaxed mb-2 transition-colors ${darkMode ? 'text-rose-300' : 'text-rose-700'}`}>
                  <strong>Do not buy penny stocks or unrated micro/nano caps.</strong> These assets lack liquidity and carry severe vulnerabilities:
                </p>
                <ul className={`list-disc pl-4 flex flex-col gap-1 transition-colors ${darkMode ? 'text-rose-300' : 'text-rose-700'}`}>
                  <li><strong>Price Manipulation:</strong> Highly susceptible to "pump & dump" schemes.</li>
                  <li><strong>Illiquidity:</strong> You may find yourself unable to sell or exit when the market drops.</li>
                  <li><strong>High Insolvency Rates:</strong> Small speculative companies have high default and failure rates. Avoid them completely for retirement planning!</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── SYSTEMATIC MECHANISMS (SIP/SWP/STP) & ETF vs MUTUAL FUNDS ── */}
        <section className={`rounded-3xl border shadow-soft p-8 mb-12 transition-colors duration-300 ${
          darkMode ? 'bg-[#18231C] border-[#24352B]' : 'bg-white border-[#E6E2DA]'
        }`}>
          <h3 className={`font-serif text-xl font-bold mb-8 transition-colors ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>
            Systematic Mechanisms & Investment Baskets
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
              <h4 className={`section-label pb-2 border-b ${darkMode ? 'border-[#24352B]' : 'border-[#E6E2DA]'}`}>The 4 Systematic & Tax Mechanisms (The How)</h4>
              
              <div className="flex flex-col gap-4 text-xs">
                <div>
                  <h5 className={`font-bold mb-1 transition-colors ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>1. SIP (Systematic Investment Plan)</h5>
                  <p className="text-[#8C9A84] leading-relaxed">
                    <strong>What it is:</strong> The Inflow mechanism. You instruct your bank to automatically invest a fixed amount every month.
                  </p>
                  <p className="text-[#8C9A84] mt-1 leading-relaxed">
                    <strong>Why use it:</strong> Eliminates the need to time the market. When prices drop, you buy more units; when they rise, you buy fewer, averaging out costs over time (Dollar/Rupee Cost Averaging).
                  </p>
                </div>

                <div>
                  <h5 className={`font-bold mb-1 transition-colors ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>2. SWP (Systematic Withdrawal Plan)</h5>
                  <p className="text-[#8C9A84] leading-relaxed">
                    <strong>What it is:</strong> The Outflow mechanism (opposite of a SIP). Automatically sells a fixed amount of units from an accumulated lump sum every month and sends the cash to your bank account.
                  </p>
                  <p className="text-[#8C9A84] mt-1 leading-relaxed">
                    <strong>Why use it:</strong> Creates a regular, predictable, and highly tax-efficient pension stream during early retirement.
                  </p>
                </div>

                <div>
                  <h5 className={`font-bold mb-1 transition-colors ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>3. STP (Systematic Transfer Plan)</h5>
                  <p className="text-[#8C9A84] leading-relaxed">
                    <strong>What it is:</strong> The Bridge mechanism. Automatically moves a fixed chunk from a safe low-risk fund (like a Debt or Liquid Fund) to a high-growth Equity Fund at regular intervals.
                  </p>
                  <p className="text-[#8C9A84] mt-1 leading-relaxed">
                    <strong>Why use it:</strong> Protects large lump sums from sudden market crashes while gradually deploying capital into index equities.
                  </p>
                </div>

                <div>
                  <h5 className={`font-bold mb-1 transition-colors ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>{getTaxMechanism().title}</h5>
                  <p className="text-[#8C9A84] leading-relaxed">
                    <strong>What it is:</strong> {getTaxMechanism().desc}
                  </p>
                  <p className="text-[#8C9A84] mt-1 leading-relaxed">
                    <strong>Why use it:</strong> {getTaxMechanism().why}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <h4 className={`section-label pb-2 border-b ${darkMode ? 'border-[#24352B]' : 'border-[#E6E2DA]'}`}>ETFs vs. Mutual Funds (The What)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b text-[#8C9A84] ${darkMode ? 'border-[#24352B]' : 'border-[#E6E2DA]'}`}>
                      <th className="py-2">Feature</th>
                      <th className="py-2">Mutual Fund (MF)</th>
                      <th className="py-2">Exchange-Traded Fund (ETF)</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y transition-colors ${darkMode ? 'text-white divide-[#24352B]' : 'text-[#2D3A31] divide-[#E6E2DA]'}`}>
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
              <div className={`mt-4 text-xxs text-[#8C9A84] p-4 rounded-xl flex flex-col gap-1 border transition-colors ${
                darkMode ? 'bg-[#121C16] border-[#24352B]' : 'bg-[#F2F0EB] border-[#E6E2DA]'
              }`}>
                <span>💡 <strong>Want to build wealth monthly?</strong> Set up a SIP.</span>
                <span>💡 <strong>Got a bonus and want to invest safely?</strong> Set up an STP.</span>
                <span>💡 <strong>Ready to live off your accumulated wealth?</strong> Set up an SWP.</span>
                <span>💡 <strong>Want to trade index baskets instantly?</strong> Buy an ETF.</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── INVESTOR RECOMMENDATIONS & STEP-UP VS FLAT WARNING ── */}
        <section className={`rounded-3xl border shadow-soft p-8 mb-12 transition-colors duration-300 ${
          darkMode ? 'bg-[#18231C] border-[#24352B]' : 'bg-white border-[#E6E2DA]'
        }`}>
          <h3 className={`font-serif text-xl font-bold mb-8 transition-colors ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>
            Investor Guidelines & Risk Management
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
              <div>
                <h4 className={`section-label pb-2 border-b mb-4 ${darkMode ? 'border-[#24352B]' : 'border-[#E6E2DA]'}`}>Risk Grading & Instrument Choices</h4>
                <div className="flex flex-col gap-4 text-xs">
                  <div>
                    <h5 className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">🟢 Safe & Low Volatility (Buffer & Security)</h5>
                    <p className="text-[#8C9A84] leading-relaxed">
                      Fixed Deposits (FDs), government savings bonds, liquid mutual funds, and short-term debt assets. These carry minimal capital loss risk but struggle to beat long-term inflation.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-bold text-rose-600 dark:text-rose-400 mb-1">🔴 Higher Volatility (Growth & Compounding)</h5>
                    <p className="text-[#8C9A84] leading-relaxed">
                      Equity Mutual Funds, Index ETFs, and sectoral plays. Volatile in the short term, but necessary to construct a significant retirement corpus over 10+ years.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className={`section-label pb-2 border-b mb-4 ${darkMode ? 'border-[#24352B]' : 'border-[#E6E2DA]'}`}>Common Mistakes to Avoid</h4>
                <ul className="list-disc pl-5 text-xs text-[#8C9A84] flex flex-col gap-2">
                  <li><strong>Exiting during market dips:</strong> Redeeming investments when indices crash destroys compounding progress.</li>
                  <li><strong>Forgetting the Step-Up:</strong> Keeping your monthly savings amount flat over 30 years severely limits final wealth.</li>
                  <li><strong>Neglecting Emergency Funds:</strong> Being forced to liquidate equity portfolios to meet sudden personal crises.</li>
                </ul>
              </div>
            </div>

            <div className={`flex flex-col justify-between border-t lg:border-t-0 lg:border-l pt-6 lg:pt-0 lg:pl-8 ${
              darkMode ? 'border-[#24352B]' : 'border-[#E6E2DA]'
            }`}>
              <div>
                <h4 className={`section-label pb-2 border-b mb-4 ${darkMode ? 'border-[#24352B]' : 'border-[#E6E2DA]'}`}>The Compounding Power of Step-Up</h4>
                <p className="text-xs text-[#8C9A84] leading-relaxed mb-4">
                  Increasing your monthly investment by <strong>{stepUpRate}% every year</strong> as your salary grows dramatically accelerates compounding.
                </p>
                <div className={`flex justify-between py-2 border-b text-xs ${darkMode ? 'border-[#24352B]' : 'border-[#E6E2DA]'}`}>
                  <span className="text-[#8C9A84]">Year 1 SIP</span>
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>{fmtCurrency(sip)}</span>
                </div>
                <div className={`flex justify-between py-2 border-b text-xs ${darkMode ? 'border-[#24352B]' : 'border-[#E6E2DA]'}`}>
                  <span className="text-[#8C9A84]">Year 5 SIP (with {stepUpRate}% step-up)</span>
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>{fmtCurrency(sip * Math.pow(1 + (stepUpRate / 100), 4))}</span>
                </div>
                <div className={`flex justify-between py-2 border-b text-xs ${darkMode ? 'border-[#24352B]' : 'border-[#E6E2DA]'}`}>
                  <span className="text-[#8C9A84]">Year 10 SIP (with {stepUpRate}% step-up)</span>
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>{fmtCurrency(sip * Math.pow(1 + (stepUpRate / 100), 9))}</span>
                </div>
              </div>

              <div className={`mt-6 p-4 rounded-2xl border transition-colors ${
                darkMode ? 'bg-rose-950/10 border-rose-900/40 text-rose-200' : 'bg-rose-50 border border-rose-100'
              }`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-rose-400' : 'text-rose-800'}`}>⚠️ The Cost of "No Step-Up" & Inflation Decay</h4>
                {!useStepUp ? (
                  <p className={`text-xs font-semibold mb-2 ${darkMode ? 'text-rose-300' : 'text-rose-700'}`}>
                    🚨 By not stepping up, you lose {fmtCurrency(stepUpDifference)} in wealth! Your corpus drops from {fmtCurrency(mathCorpusWith)} to {fmtCurrency(mathCorpusWithout)}.
                  </p>
                ) : (
                  <p className={`text-xs font-semibold mb-2 ${darkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>
                    ✅ Step-Up Advantage: Your {stepUpRate}% annual step-up strategy gains you an additional {fmtCurrency(stepUpDifference)} compared to a flat SIP!
                  </p>
                )}
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-rose-300' : 'text-rose-700'}`}>
                  Inflation erodes the purchasing power of your money. At <strong>7% annual inflation</strong>, a final corpus of <strong>{fmtCurrency(baseValue)}</strong> in {years} years will hold the purchasing power of only <strong>{fmtCurrency(erodedValue)}</strong> today!
                </p>
                <p className={`text-xs leading-relaxed mt-2 ${darkMode ? 'text-rose-300' : 'text-rose-700'}`}>
                  Without an annual step-up to fight inflation, your future wealth will buy only a fraction of what it buys today (e.g. buying a {assetTerm} today vs. barely buying a small car in {years} years with the same numeric amount).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── MILESTONES ── */}
        <section className="mb-12">
          <h3 className={`font-serif text-xl font-bold mb-8 flex items-center gap-2 transition-colors ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>
            <Calendar className="w-5 h-5 text-[#8C9A84]" strokeWidth={1.5} /> Milestone Roadmap
          </h3>
          <div className="relative flex flex-col gap-0 pl-2">
            <div className={`absolute left-4 top-0 bottom-0 w-px ${darkMode ? 'bg-[#24352B]' : 'bg-[#E6E2DA]'}`} />
            {(roadmap?.milestones||[]).map((m, i) => (
              <div key={i} className="flex gap-6 pb-8 relative">
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold z-10 transition-colors ${
                  darkMode ? 'bg-[#8C9A84] text-[#0F1712]' : 'bg-[#2D3A31] text-white'
                }`}>
                  {i+1}
                </div>
                <div className={`flex-1 rounded-2xl border p-5 shadow-soft hover:-translate-y-0.5 transition-all duration-300 ${
                  darkMode ? 'bg-[#18231C] border-[#24352B]' : 'bg-white border-[#E6E2DA]'
                }`}>
                  <span className="section-label block mb-1">{m.timeframe}</span>
                  <h4 className={`font-serif text-base font-bold mb-1 transition-colors ${darkMode ? 'text-white' : 'text-[#2D3A31]'}`}>{m.title}</h4>
                  <p className="text-xs text-[#8C9A84] leading-relaxed">{(m.description||'').replace(/INR\s/g,'₹').replace(/\.0(?=\b)/g,'')}</p>
                </div>
              </div>
            ))}
          </div>
        </section>



        {/* ── FOOTER ── */}
        <footer className={`border-t pt-8 flex justify-between items-center text-xs text-[#8C9A84] print:hidden ${
          darkMode ? 'border-[#24352B]' : 'border-[#E6E2DA]'
        }`}>
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
          className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
            darkMode 
              ? 'bg-[#8C9A84] text-[#0F1712] hover:bg-[#A3B19D]' 
              : 'bg-[#2D3A31] text-white hover:bg-[#8C9A84]'
          }`}
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
          <div className={`fixed bottom-24 right-6 z-50 w-[360px] h-[500px] border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out] ${
            darkMode ? 'bg-[#18231C] border-[#24352B]' : 'bg-white border-[#E6E2DA]'
          }`}>
            {/* Header */}
            <div className={`px-5 py-4 flex items-center justify-between transition-colors ${
              darkMode ? 'bg-[#121C16] text-[#F0F5F2]' : 'bg-[#2D3A31] text-white'
            }`}>
              <div>
                <h4 className="font-serif font-bold text-sm">WealthPath Coach</h4>
                <p className="text-[10px] text-[#8C9A84]">Powered by Groq Llama 3</p>
              </div>
              <button onClick={() => setChatOpen(false)} className={`transition-colors ${darkMode ? 'text-[#8C9A84] hover:text-[#F0F5F2]' : 'text-[#8C9A84] hover:text-white'}`}>
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
                      ? (darkMode ? 'bg-[#8C9A84] text-[#0F1712] self-end rounded-br-none' : 'bg-[#2D3A31] text-white self-end rounded-br-none') 
                      : (darkMode ? 'bg-[#121C16] text-[#F0F5F2] self-start rounded-bl-none border border-[#24352B]' : 'bg-[#F2F0EB] text-[#2D3A31] self-start rounded-bl-none border border-[#E6E2DA]')
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              ))}
              {chatLoading && (
                <div className={`max-w-[80%] rounded-2xl rounded-bl-none border px-4 py-3 text-xs self-start flex items-center gap-1.5 ${
                  darkMode ? 'bg-[#121C16] border-[#24352B]' : 'bg-[#F2F0EB] border-[#E6E2DA]'
                }`}>
                  <span className="w-1.5 h-1.5 bg-[#8C9A84] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#8C9A84] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#8C9A84] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className={`border-t p-3 flex gap-2 transition-colors ${
              darkMode ? 'border-[#24352B] bg-[#121C16]' : 'border-[#E6E2DA] bg-[#F9F8F4]'
            }`}>
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about your roadmap..."
                disabled={chatLoading}
                className={`flex-1 border rounded-full px-4 py-2 text-xs focus:outline-none focus:border-[#8C9A84] disabled:opacity-50 transition-colors ${
                  darkMode ? 'bg-[#18231C] border-[#24352B] text-white' : 'bg-white border-[#E6E2DA] text-[#2D3A31]'
                }`}
              />
              <button 
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 ${
                  darkMode 
                    ? 'bg-[#8C9A84] text-[#0F1712] hover:bg-[#A3B19D] disabled:hover:bg-[#8C9A84]' 
                    : 'bg-[#2D3A31] text-white hover:bg-[#8C9A84] disabled:hover:bg-[#2D3A31]'
                }`}
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
