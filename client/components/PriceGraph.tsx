'use client';

import { motion } from 'framer-motion';

interface PriceDataPoint {
  date: string;
  price: number;
}

interface PriceGraphProps {
  data?: PriceDataPoint[];
  title?: string;
}

export default function PriceGraph({
  data = [
    { date: 'Mon', price: 450 },
    { date: 'Tue', price: 420 },
    { date: 'Wed', price: 480 },
    { date: 'Thu', price: 390 },
    { date: 'Fri', price: 520 },
    { date: 'Sat', price: 380 },
    { date: 'Sun', price: 410 }
  ],
  title = 'Price Trends'
}: PriceGraphProps) {
  const maxPrice = Math.max(...data.map(d => d.price));
  const minPrice = Math.min(...data.map(d => d.price));
  const avgPrice = Math.round(data.reduce((sum, d) => sum + d.price, 0) / data.length);

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
      <h3 className="text-xl font-bold text-gold mb-4">{title}</h3>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-black bg-opacity-30 rounded-lg p-3 text-center">
          <p className="text-gray-400 text-xs uppercase">Lowest</p>
          <p className="text-2xl font-bold text-green-400">${minPrice}</p>
        </div>
        <div className="bg-black bg-opacity-30 rounded-lg p-3 text-center">
          <p className="text-gray-400 text-xs uppercase">Average</p>
          <p className="text-2xl font-bold text-gold">${avgPrice}</p>
        </div>
        <div className="bg-black bg-opacity-30 rounded-lg p-3 text-center">
          <p className="text-gray-400 text-xs uppercase">Highest</p>
          <p className="text-2xl font-bold text-red-400">${maxPrice}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end justify-around h-48 gap-2 mb-4 bg-black bg-opacity-20 p-4 rounded-lg">
        {data.map((point, idx) => {
          const heightPercent = ((point.price - minPrice) / (maxPrice - minPrice)) * 100;
          return (
            <motion.div
              key={idx}
              initial={{ height: 0 }}
              animate={{ height: `${heightPercent}%` }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              whileHover={{ backgroundColor: '#d4af37' }}
              className="flex-1 bg-gradient-to-t from-gold to-gold bg-opacity-60 rounded-t-lg cursor-pointer group relative"
            >
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-dark-border px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                ${point.price}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-around text-xs text-gray-400">
        {data.map((point, idx) => (
          <span key={idx}>{point.date}</span>
        ))}
      </div>

      {/* Recommendation */}
      <div className="mt-6 p-3 bg-green-900 bg-opacity-20 border border-green-600 border-opacity-30 rounded-lg">
        <p className="text-green-400 text-sm font-semibold">💡 Best time to book</p>
        <p className="text-gray-300 text-xs mt-1">Saturday has the lowest price. Consider booking 2-3 weeks in advance for better rates.</p>
      </div>
    </div>
  );
}
