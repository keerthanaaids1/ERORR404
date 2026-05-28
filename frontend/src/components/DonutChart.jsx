import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#8C9A84', '#2D3A31', '#C27B66', '#DCCFC2'];

export default function DonutChart({ data = [] }) {
  const chartData = data.map(item => ({ name: item.category, value: item.percentage, details: item.details }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-[#E6E2DA] rounded-2xl p-3 shadow-med">
          <p className="text-xs font-serif font-bold text-[#2D3A31]">{payload[0].name}</p>
          <p className="text-sm font-bold text-[#8C9A84] mt-0.5">{payload[0].value}%</p>
          <p className="text-xs text-[#8C9A84] max-w-[180px] mt-1 italic leading-relaxed">{payload[0].payload.details}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 w-full h-full">
      <div className="w-full md:w-1/2 h-[220px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={85}
              paddingAngle={4} dataKey="value">
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#F9F8F4" strokeWidth={3} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs uppercase tracking-widest text-[#8C9A84] font-sans">Allocation</span>
          <span className="text-xl font-serif font-bold text-[#2D3A31]">100%</span>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex flex-col gap-3">
        {data.map((item, i) => (
          <div key={i} className="flex items-start gap-3 pb-3 border-b border-[#E6E2DA] last:border-0">
            <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-[#2D3A31] font-sans">{item.category}</span>
                <span className="text-sm font-bold text-[#8C9A84]">{item.percentage}%</span>
              </div>
              <p className="text-xs text-[#8C9A84] mt-0.5 leading-relaxed italic">{item.details}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
