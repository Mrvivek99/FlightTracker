'use client';

import { useSearchParams } from 'next/navigation';
import { useFlights } from '@/hooks/useFlights';
import SearchBar from '@/components/SearchBar';
import FlightCard from '@/components/FlightCard';
import LoadingSkeletons from '@/components/LoadingSkeletons';
import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';

function SearchContent() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || 'JFK';
  const to = searchParams.get('to') || 'LHR';
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const { data: flights, isLoading, error } = useFlights(from, to, date);
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'stops'>('price');

  const sortedFlights = flights ? [...flights].sort((a, b) => {
    if (sortBy === 'price') return a.price - b.price;
    if (sortBy === 'duration') {
      const durationA = parseInt(a.duration);
      const durationB = parseInt(b.duration);
      return durationA - durationB;
    }
    if (sortBy === 'stops') return a.stops - b.stops;
    return 0;
  }) : [];

  return (
    <div className="bg-dark min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-6">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <SearchBar />
        </motion.div>

        {/* Results Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white">
                {from} → {to}
              </h2>
              <p className="text-gray-400 mt-2">
                {date} • {sortedFlights.length} flights found
              </p>
            </div>

            {/* Sort Options */}
            <div className="flex gap-2">
              {(['price', 'duration', 'stops'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={`px-4 py-2 rounded-lg capitalize transition-all ${
                    sortBy === option
                      ? 'bg-gold text-black font-semibold'
                      : 'bg-dark-card border border-dark-border text-gray-300 hover:border-gold'
                  }`}
                >
                  Sort by {option}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Flights List */}
        <div className="space-y-4">
          {isLoading ? (
            <LoadingSkeletons />
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-900 bg-opacity-20 border border-red-600 border-opacity-30 rounded-xl p-6 text-center"
            >
              <p className="text-red-400 font-semibold">Failed to load flights</p>
              <p className="text-gray-400 mt-2">Please try again</p>
            </motion.div>
          ) : sortedFlights.length > 0 ? (
            sortedFlights.map((flight) => (
              <motion.div
                key={flight._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <FlightCard flight={flight} />
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-dark-card border border-dark-border rounded-xl p-12 text-center"
            >
              <p className="text-gray-400 text-lg mb-4">No flights found for this route</p>
              <p className="text-gray-500">Try adjusting your search dates or airports</p>
            </motion.div>
          )}
        </div>

        {/* Tips Section */}
        {sortedFlights.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 bg-dark-card border border-gold border-opacity-30 rounded-xl p-6"
          >
            <h3 className="text-xl font-bold text-gold mb-4">💡 Travel Tips</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Direct flights are usually more convenient but often pricier</li>
              <li>• Mid-week flights (Tue-Thu) are typically cheaper</li>
              <li>• Booking 2-3 weeks in advance saves an average of 20-30%</li>
              <li>• Ask our AI assistant for personalized recommendations</li>
            </ul>
          </motion.section>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark flex flex-col items-center justify-center pt-20"><LoadingSkeletons /></div>}>
      <SearchContent />
    </Suspense>
  );
}
