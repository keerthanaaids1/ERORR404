import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Leaf, Shield, Check } from 'lucide-react';

export default function Onboard({ formData, setFormData }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [healthScore, setHealthScore] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'occupation' || name === 'risk' || name === 'currency' ? value : (value === '' ? '' : Number(value) || 0)
    }));
  };

  useEffect(() => {
    const { income, expenses, emis } = formData;
    if (income <= 0) { setHealthScore(0); return; }
    const surplus = income - expenses - emis;
    const score = Math.min(100, Math.max(10, Math.round((Math.max(0, surplus / income) * 70) + (Math.max(0, 1 - emis / income) * 30))));
    setHealthScore(score);
  }, [formData.income, formData.expenses, formData.emis]);

  const toggleGoal = (goal) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal) ? prev.goals.filter(g => g !== goal) : [...prev.goals, goal]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1) { setStep(2); }
    else { localStorage.setItem('wealthpath_profile', JSON.stringify(formData)); navigate('/processing'); }
  };

  const radius = 52, circumference = 2 * Math.PI * radius;
  const scoreColor = healthScore >= 70 ? '#8C9A84' : healthScore >= 40 ? '#C27B66' : '#DCCFC2';

  return (
    <div className="min-h-screen bg-[#F9F8F4] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-[#E6E2DA]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-full bg-[#2D3A31] flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" strokeWidth={1.5} />
            </div>
            <span className="font-serif font-bold text-[#2D3A31]">WealthPath <span className="italic text-[#8C9A84]">AI</span></span>
          </div>
          <button onClick={() => navigate('/')} className="hidden sm:flex items-center gap-1.5 text-xs text-[#8C9A84] hover:text-[#2D3A31] border border-[#E6E2DA] hover:border-[#8C9A84] px-3.5 py-1.5 rounded-full transition-all shadow-sm">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </button>
        </div>
        <span className="section-label">Step {step} of 2</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[#E6E2DA]">
        <div className="h-full bg-[#8C9A84] transition-all duration-500" style={{ width: step === 1 ? '50%' : '100%' }} />
      </div>

      <div className="flex-1 max-w-5xl w-full mx-auto px-6 md:px-12 py-12 grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">

        {/* Form */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-[#E6E2DA] shadow-soft p-8">
          <h2 className="font-serif text-3xl font-bold text-[#2D3A31] mb-1">
            {step === 1 ? 'Your Financial Picture' : 'Set Your Goals'}
          </h2>
          <p className="text-sm text-[#8C9A84] mb-8">
            {step === 1 ? 'Tell us your monthly cash flow so our agents can understand your starting point.' : 'Configure your retirement vision and risk settings.'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {step === 1 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#8C9A84] uppercase tracking-wider">Currency</label>
                  <select 
                    name="currency"
                    value={formData.currency || 'USD'}
                    onChange={(e) => {
                      const currencyVal = e.target.value;
                      const symbols = {
                        USD: '$', INR: '₹', EUR: '€', GBP: '£', AUD: '$',
                        CAD: '$', SGD: '$', JPY: '¥', CNY: '¥', CHF: 'CHF',
                        BRL: 'R$', ZAR: 'R', AED: 'د.إ', SAR: '﷼', RUB: '₽'
                      };
                      setFormData(prev => ({
                        ...prev,
                        currency: currencyVal,
                        currencySymbol: symbols[currencyVal] || '$'
                      }));
                    }}
                    className="input-botanical appearance-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="AUD">AUD ($)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="SGD">SGD ($)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="CNY">CNY (¥)</option>
                    <option value="CHF">CHF (CHF)</option>
                    <option value="BRL">BRL (R$)</option>
                    <option value="ZAR">ZAR (R)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="SAR">SAR (﷼)</option>
                    <option value="RUB">RUB (₽)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#8C9A84] uppercase tracking-wider">Monthly Income ({formData.currencySymbol || '$'})</label>
                  <input type="number" name="income" value={formData.income || ''} onChange={handleChange} placeholder="100000" required min="1" className="input-botanical" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#8C9A84] uppercase tracking-wider">Monthly Expenses ({formData.currencySymbol || '$'})</label>
                  <input type="number" name="expenses" value={formData.expenses || ''} onChange={handleChange} placeholder="40000" required min="0" className="input-botanical" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#8C9A84] uppercase tracking-wider">Total Monthly EMIs ({formData.currencySymbol || '$'})</label>
                  <input type="number" name="emis" value={formData.emis || ''} onChange={handleChange} placeholder="10000" required min="0" className="input-botanical" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#8C9A84] uppercase tracking-wider">Current Savings ({formData.currencySymbol || '$'})</label>
                  <input type="number" name="savings" value={formData.savings || ''} onChange={handleChange} placeholder="300000" required min="0" className="input-botanical" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#8C9A84] uppercase tracking-wider">Your Age</label>
                  <input type="number" name="age" value={formData.age || ''} onChange={handleChange} placeholder="26" required min="18" max="100" className="input-botanical" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#8C9A84] uppercase tracking-wider">Occupation</label>
                  <select name="occupation" value={formData.occupation || 'Salaried'} onChange={handleChange} className="input-botanical appearance-none">
                    {['Salaried', 'Self-employed', 'Freelancer', 'Student'].map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="section-label">Target Retirement Age</label>
                    <span className="font-serif text-2xl font-bold text-[#8C9A84]">{formData.retirement_age}</span>
                  </div>
                  <input type="range" name="retirement_age" min="35" max="65" value={formData.retirement_age || 55}
                    onChange={handleChange}
                    className="w-full h-1 bg-[#E6E2DA] rounded-full appearance-none cursor-pointer accent-[#8C9A84]" />
                  <div className="flex justify-between text-xs text-[#8C9A84] mt-1 font-sans">
                    <span>35</span><span>65</span>
                  </div>
                </div>

                <div>
                  <label className="section-label mb-3 block">Risk Appetite</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Conservative', 'Balanced', 'Aggressive'].map(r => (
                      <div key={r} onClick={() => setFormData(p => ({ ...p, risk: r }))}
                        className={`rounded-2xl p-4 text-center cursor-pointer border transition-all duration-300 ${
                          formData.risk === r
                            ? 'bg-[#2D3A31] border-[#2D3A31] text-white shadow-med'
                            : 'bg-[#F2F0EB] border-[#E6E2DA] text-[#8C9A84] hover:border-[#8C9A84]'
                        }`}>
                        <span className="text-xs font-semibold font-sans">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#8C9A84] uppercase tracking-wider">Monthly Investment Capacity ({formData.currencySymbol || '$'})</label>
                  <input type="number" name="monthly_investment" value={formData.monthly_investment || ''}
                    onChange={handleChange} placeholder="30000" required min="1" className="input-botanical" />
                </div>

                <div>
                  <label className="section-label mb-3 block">Retirement Lifestyle Goals</label>
                  <div className="flex flex-wrap gap-2.5">
                    {['Early Retirement', 'Buy Home', 'Child Education', 'Travel', 'Business'].map(goal => {
                      const sel = formData.goals?.includes(goal);
                      return (
                        <div key={goal} onClick={() => toggleGoal(goal)}
                          className={`px-4 py-2 rounded-full border text-xs font-medium cursor-pointer select-none transition-all duration-300 flex items-center gap-1.5 ${
                            sel ? 'bg-[#2D3A31] border-[#2D3A31] text-white shadow-soft'
                                : 'bg-white border-[#E6E2DA] text-[#8C9A84] hover:border-[#8C9A84]'
                          }`}>
                          {sel && <Check className="w-3.5 h-3.5" />} {goal}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Agent preview on step 2 */}
            {step === 2 && (
              <div className="bg-[#F2F0EB] rounded-2xl p-5 mt-2">
                <p className="section-label mb-3">Upon submission, 4 agents will run:</p>
                <ul className="flex flex-col gap-2">
                  {['ProfileAgent — financial health analysis', 'GoalAgent — retirement math', 'InvestmentAgent — live market research', 'CoachAgent — plain English roadmap'].map((a, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-[#2D3A31] font-sans">
                      <div className="w-5 h-5 rounded-full bg-[#8C9A84]/20 text-[#8C9A84] flex items-center justify-center text-[10px] font-bold">{i+1}</div>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-[#E6E2DA] mt-2">
              {step === 2 ? (
                <button type="button" onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-sm text-[#8C9A84] hover:text-[#2D3A31] transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              ) : <div />}
              <button type="submit" className="btn-primary text-xs py-3 px-7">
                {step === 1 ? 'Next: Set Your Goals' : 'Generate My Roadmap'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Health Score Panel */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="bg-white rounded-3xl border border-[#E6E2DA] shadow-soft p-8 flex flex-col items-center text-center">
            <span className="section-label mb-5">Real-Time Analysis</span>
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={radius} fill="transparent" stroke="#E6E2DA" strokeWidth="8" />
                <circle cx="60" cy="60" r={radius} fill="transparent" stroke={scoreColor}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (healthScore / 100) * circumference}
                  className="transition-all duration-700" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-serif text-3xl font-bold text-[#2D3A31]">{healthScore}</span>
                <span className="text-xs text-[#8C9A84] uppercase tracking-widest font-sans">Score</span>
              </div>
            </div>
            <h3 className="font-serif text-lg font-bold text-[#2D3A31] mt-5">Financial Health Score</h3>
            <p className="text-xs text-[#8C9A84] mt-2 leading-relaxed px-2">
              Live score based on your savings rate and debt-to-income ratio.
            </p>
          </div>

          <div className="bg-[#2D3A31] rounded-3xl p-6 flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#8C9A84] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="text-xs text-[#8C9A84] leading-relaxed">
              Your data is only used to generate your roadmap and is never stored permanently on our servers.
            </p>
          </div>
        </div>
      </div>

      <footer className="text-center py-5 text-xs text-[#8C9A84] border-t border-[#E6E2DA]">
        WealthPath AI · Built at Agentathon 2026
      </footer>
    </div>
  );
}
