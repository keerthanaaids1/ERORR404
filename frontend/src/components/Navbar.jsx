import React, { useState, useEffect } from 'react';
import { ArrowRight, Menu, X, Leaf, LogOut, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#EA4335"
      d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 15.02.75 12 .75 7.37.75 3.42 3.4 1.46 7.23l3.89 3.01C6.27 7.23 8.91 5.04 12 5.04z"
    />
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.44c-.28 1.46-1.1 2.69-2.34 3.52l3.63 2.82c2.13-1.97 3.76-4.87 3.76-8.2z"
    />
    <path
      fill="#FBBC05"
      d="M5.35 14.77c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27L1.46 7.23C.53 9.09 0 11.19 0 13.4s.53 4.31 1.46 6.17l3.89-3.01c-.24-.72-.38-1.49-.38-2.27z"
    />
    <path
      fill="#34A853"
      d="M12 23.25c3.24 0 5.97-1.08 7.96-2.91l-3.63-2.82c-1.01.68-2.3 1.09-4.33 1.09-3.09 0-5.73-2.19-6.65-5.2l-3.89 3.01c1.96 3.83 5.91 6.48 9.97 6.48z"
    />
  </svg>
);

export default function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Auth states
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Saved roadmaps state
  const [savedRoadmaps, setSavedRoadmaps] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('wealthpath_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('wealthpath_user');
      }
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setSavedRoadmaps([]);
      return;
    }
    try {
      const dbStr = localStorage.getItem('wealthpath_users_db') || '[]';
      const db = JSON.parse(dbStr);
      const matched = db.find(u => u.email === user.email);
      if (matched && matched.roadmaps) {
        setSavedRoadmaps(matched.roadmaps);
      } else {
        setSavedRoadmaps([]);
      }
    } catch (e) {
      console.error(e);
    }
  }, [user, menuOpen]);

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    if (!emailInput.trim() || !passwordInput.trim()) {
      setAuthError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      try {
        const dbStr = localStorage.getItem('wealthpath_users_db') || '[]';
        const db = JSON.parse(dbStr);

        if (isSignUp) {
          if (!nameInput.trim()) {
            setAuthError('Please enter your name.');
            setLoading(false);
            return;
          }
          const email = emailInput.trim().toLowerCase();
          const userExists = db.some(u => u.email === email);
          if (userExists) {
            setAuthError('An account with this email already exists.');
            setLoading(false);
            return;
          }

          const newUser = {
            name: nameInput.trim(),
            email: email,
            password: passwordInput.trim(),
            roadmaps: []
          };

          db.push(newUser);
          localStorage.setItem('wealthpath_users_db', JSON.stringify(db));

          const loggedInUser = { name: newUser.name, email: newUser.email };
          localStorage.setItem('wealthpath_user', JSON.stringify(loggedInUser));
          setUser(loggedInUser);
          
          localStorage.removeItem('wealthpath_profile');
          localStorage.removeItem('wealthpath_roadmap');

          setShowAuthModal(false);
          resetForm();
        } else {
          const email = emailInput.trim().toLowerCase();
          const matchedUser = db.find(u => u.email === email && u.password === passwordInput.trim());
          if (!matchedUser) {
            setAuthError('Invalid email or password.');
            setLoading(false);
            return;
          }

          const loggedInUser = { name: matchedUser.name, email: matchedUser.email };
          localStorage.setItem('wealthpath_user', JSON.stringify(loggedInUser));
          setUser(loggedInUser);

          if (matchedUser.roadmaps && matchedUser.roadmaps.length > 0) {
            const latest = matchedUser.roadmaps[0];
            if (latest.roadmap && latest.profile) {
              localStorage.setItem('wealthpath_roadmap', JSON.stringify(latest.roadmap));
              localStorage.setItem('wealthpath_profile', JSON.stringify(latest.profile));
            } else {
              localStorage.setItem('wealthpath_roadmap', JSON.stringify(latest));
            }
          }

          setShowAuthModal(false);
          resetForm();

          if (matchedUser.roadmaps && matchedUser.roadmaps.length > 0) {
            if (window.location.pathname === '/dashboard') {
              window.location.reload();
            } else {
              navigate('/dashboard');
            }
          } else {
            navigate('/onboard');
          }
        }
      } catch (err) {
        console.error(err);
        setAuthError('An error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  const handleLoadRoadmap = (savedItem) => {
    if (savedItem.roadmap && savedItem.profile) {
      localStorage.setItem('wealthpath_roadmap', JSON.stringify(savedItem.roadmap));
      localStorage.setItem('wealthpath_profile', JSON.stringify(savedItem.profile));
    } else {
      localStorage.setItem('wealthpath_roadmap', JSON.stringify(savedItem));
      const dummyProfile = {
        income: savedItem.monthly_sip * 3,
        expenses: savedItem.emergency_fund / 6,
        emis: 0,
        age: 26,
        retirement_age: savedItem.retirement_age,
        risk: 'Balanced',
        monthly_investment: savedItem.monthly_sip,
        currency: savedItem.currency || 'USD',
        currencySymbol: savedItem.currencySymbol || '$',
        goals: ['Early Retirement']
      };
      localStorage.setItem('wealthpath_profile', JSON.stringify(dummyProfile));
    }
    setMenuOpen(false);
    if (window.location.pathname === '/dashboard') {
      window.location.reload();
    } else {
      navigate('/dashboard');
    }
  };

  const resetForm = () => {
    setEmailInput('');
    setPasswordInput('');
    setNameInput('');
    setAuthError('');
  };

  const handleSignOut = () => {
    localStorage.removeItem('wealthpath_user');
    localStorage.removeItem('wealthpath_profile');
    localStorage.removeItem('wealthpath_roadmap');
    setUser(null);
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#F9F8F4]/90 backdrop-blur-md border-b border-[#E6E2DA] py-4 px-6 md:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-[#2D3A31] flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" strokeWidth={1.5} />
          </div>
          <span className="font-serif font-bold text-[#2D3A31] text-lg">WealthPath <span className="text-[#8C9A84] italic">AI</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#8C9A84]">
          <Link to="/" className="hover:text-[#2D3A31] transition-colors duration-300">Home</Link>
          <a href="#how-it-works" className="hover:text-[#2D3A31] transition-colors duration-300">How It Works</a>
          <a href="#features" className="hover:text-[#2D3A31] transition-colors duration-300">Features</a>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setMenuOpen(!menuOpen)} 
                className="flex items-center gap-2 hover:opacity-85 transition-opacity focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-[#2D3A31] text-white flex items-center justify-center font-bold text-xs select-none">
                  {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-xs font-semibold text-[#2D3A31]">{user.name}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E6E2DA] rounded-2xl shadow-large p-2 z-50 animate-[fadeIn_0.15s_ease-out]">
                  <div className="px-3 py-2 border-b border-[#E6E2DA] mb-1">
                    <p className="text-xs font-bold text-[#2D3A31] truncate">{user.name}</p>
                    <p className="text-[10px] text-[#8C9A84] truncate">{user.email}</p>
                  </div>
                  
                  {savedRoadmaps.length > 0 && (
                    <div className="px-3 py-1.5 border-b border-[#E6E2DA] mb-1">
                      <p className="text-[10px] font-bold text-[#8C9A84] uppercase tracking-wider mb-1">Saved Roadmaps</p>
                      <div className="max-h-36 overflow-y-auto flex flex-col gap-1">
                        {savedRoadmaps.map((item, idx) => {
                          const roadmapObj = item.roadmap || item;
                          const symbol = roadmapObj.currencySymbol || '$';
                          const sipAmount = roadmapObj.monthly_sip || 0;
                          const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : `Plan ${idx+1}`;
                          return (
                            <button
                              key={idx}
                              onClick={() => handleLoadRoadmap(item)}
                              className="w-full text-left text-[11px] text-[#2D3A31] hover:bg-[#F2F0EB] p-1.5 rounded transition-colors truncate font-sans"
                              title={`Retire at ${roadmapObj.retirement_age} (${symbol}${sipAmount.toLocaleString()}/mo)`}
                            >
                              📅 {dateStr} - Retire by {roadmapObj.retirement_age} ({symbol}{sipAmount >= 1000 ? `${(sipAmount/1000).toFixed(0)}K` : sipAmount}/mo)
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => { setMenuOpen(false); navigate('/onboard'); }} 
                    className="w-full text-left px-3 py-2 text-xs text-[#2D3A31] hover:bg-[#F2F0EB] rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Leaf className="w-3.5 h-3.5 text-[#8C9A84]" /> Build Roadmap
                  </button>
                  <button 
                    onClick={handleSignOut} 
                    className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => { setIsSignUp(false); resetForm(); setShowAuthModal(true); }} 
                className="text-xs text-[#2D3A31] font-semibold hover:text-[#8C9A84] px-4 py-2 transition-all duration-300"
              >
                Log In
              </button>
              <button 
                onClick={() => { setIsSignUp(true); resetForm(); setShowAuthModal(true); }} 
                className="btn-primary text-xs py-2 px-5"
              >
                Sign Up
              </button>
            </div>
          )}

          <button onClick={() => navigate('/onboard')}
            className="btn-primary text-xs py-2.5 px-6 hidden md:inline-flex">
            Build My Roadmap <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button onClick={() => setOpen(!open)} className="md:hidden text-[#2D3A31] p-1">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <div className="fixed inset-0 bg-[#F9F8F4]/98 backdrop-blur-xl z-40 flex flex-col justify-between pt-28 pb-12 px-8 md:hidden">
            <div className="flex flex-col gap-6 text-2xl font-serif font-bold text-[#2D3A31]">
              <Link to="/" onClick={() => setOpen(false)} className="border-b border-[#E6E2DA] pb-4">Home</Link>
              <a href="#how-it-works" onClick={() => setOpen(false)} className="border-b border-[#E6E2DA] pb-4">How It Works</a>
              <a href="#features" onClick={() => setOpen(false)} className="border-b border-[#E6E2DA] pb-4">Features</a>
              {!user && (
                <button 
                  onClick={() => { setOpen(false); setIsSignUp(false); setShowAuthModal(true); }}
                  className="text-left border-b border-[#E6E2DA] pb-4 text-[#2D3A31]"
                >
                  Sign In
                </button>
              )}
            </div>
            
            <div className="flex flex-col gap-4">
              {user && (
                <div className="flex items-center gap-3 p-4 bg-[#F2F0EB] rounded-2xl mb-2">
                  <div className="w-10 h-10 rounded-full bg-[#2D3A31] text-white flex items-center justify-center font-bold text-sm">
                    {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2D3A31]">{user.name}</p>
                    <p className="text-xs text-[#8C9A84]">{user.email}</p>
                  </div>
                </div>
              )}
              
              {user ? (
                <button 
                  onClick={() => { setOpen(false); handleSignOut(); }}
                  className="w-full border border-rose-200 text-rose-600 bg-rose-50 rounded-full text-center py-4 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              ) : null}

              <button onClick={() => { setOpen(false); navigate('/onboard'); }}
                className="btn-primary w-full justify-center text-sm py-4">
                Build My Roadmap <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </nav>

      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            onClick={() => { if (!loading) setShowAuthModal(false); }} 
            className="fixed inset-0 bg-[#2D3A31]/40 backdrop-blur-sm transition-opacity duration-300"
          />
          
          <div className="relative bg-white border border-[#E6E2DA] rounded-3xl p-8 max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-large z-[110] animate-[fadeIn_0.25s_ease-out]">
            <button 
              onClick={() => setShowAuthModal(false)}
              disabled={loading}
              className="absolute top-4 right-4 text-[#8C9A84] hover:text-[#2D3A31] p-1 disabled:opacity-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-[#8C9A84]/10 text-[#8C9A84] flex items-center justify-center mx-auto mb-3">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#2D3A31] mb-1">
                {isSignUp ? 'Create an Account' : 'Welcome Back'}
              </h3>
              <p className="text-xs text-[#8C9A84]">
                {isSignUp ? 'Sign up with email and set a password' : 'Log in to access your saved roadmaps'}
              </p>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-3 border-[#8C9A84] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-[#8C9A84] font-medium font-sans">
                  {isSignUp ? 'Creating your account...' : 'Logging you in...'}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {authError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold">
                    ⚠️ {authError}
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3">
                  {isSignUp && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-[#8C9A84] uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="John Doe"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full bg-[#F2F0EB] rounded-xl px-4 py-2.5 text-xs text-[#2D3A31] focus:outline-none focus:border-[#8C9A84] border border-transparent"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-[#8C9A84] uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="name@email.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-[#F2F0EB] rounded-xl px-4 py-2.5 text-xs text-[#2D3A31] focus:outline-none focus:border-[#8C9A84] border border-transparent"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-[#8C9A84] uppercase tracking-wider">Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-[#F2F0EB] rounded-xl px-4 py-2.5 text-xs text-[#2D3A31] focus:outline-none focus:border-[#8C9A84] border border-transparent"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary w-full justify-center text-xs py-3 mt-2"
                  >
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </button>
                </form>

                <div className="text-center mt-2">
                  <button
                    onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }}
                    className="text-[11px] text-[#8C9A84] hover:text-[#2D3A31] underline font-medium"
                  >
                    {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                  </button>
                </div>
              </div>
            )}
            
            <p className="text-[10px] text-[#8C9A84] text-center mt-6 leading-relaxed">
              Your credentials are SSL encrypted and stored securely.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
