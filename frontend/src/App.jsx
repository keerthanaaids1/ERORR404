import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Onboard from './pages/Onboard';
import Processing from './pages/Processing';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [formData, setFormData] = useState({
    income: '',
    expenses: '',
    emis: '',
    savings: '',
    age: '',
    occupation: 'Salaried',
    retirement_age: 45,
    risk: 'Balanced',
    monthly_investment: '',
    goals: ['Early Retirement'],
    currency: 'USD',
    currencySymbol: '$'
  });
  const [roadmapData, setRoadmapData] = useState(null);

  return (
    <Router>
      {/* Paper grain texture — the soul of botanical design */}
      <div className="grain-overlay" />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/onboard" element={<Onboard formData={formData} setFormData={setFormData} />} />
        <Route path="/processing" element={<Processing formData={formData} setRoadmapData={setRoadmapData} />} />
        <Route path="/dashboard" element={<Dashboard roadmapData={roadmapData} setFormData={setFormData} />} />
      </Routes>
    </Router>
  );
}
