'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { popularAirports } from '@/utils/airports';

interface SearchBarProps {
  onSearch?: (from: string, to: string, date: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const router = useRouter();
  const [from, setFrom] = useState('JFK');
  const [to, setTo] = useState('LHR');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(from, to, date);
    } else {
      router.push(`/search?from=${from}&to=${to}&date=${date}`);
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-4"
    >
      <h2 className="text-2xl font-bold text-white mb-4">Find Your Perfect Flight</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex flex-col">
          <label className="text-gold text-sm font-semibold mb-2">From</label>
          <input
            type="text"
            value={from}
            onChange={(e) => setFrom(e.target.value.toUpperCase().slice(0, 3))}
            placeholder="NYC"
            list="airport-suggestions"
            className="bg-[#2a2a2a] border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold transition"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-gold text-sm font-semibold mb-2">To</label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value.toUpperCase().slice(0, 3))}
            placeholder="LHR"
            list="airport-suggestions"
            className="bg-[#2a2a2a] border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold transition"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-gold text-sm font-semibold mb-2">Departure</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-[#2a2a2a] border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold transition"
          />
        </div>

        <div className="flex flex-col justify-end">
          <button
            type="submit"
            className="btn-primary w-full"
          >
            Search Flights
          </button>
        </div>
      </div>

      <datalist id="airport-suggestions">
        {popularAirports.map((airport) => (
          <option key={airport.code} value={airport.code}>
            {airport.city} - {airport.name}
          </option>
        ))}
      </datalist>
    </form>
  );
}
