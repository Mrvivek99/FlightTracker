'use client';

import { Flight } from '@/hooks/useFlights';
import { motion } from 'framer-motion';

interface FlightCardProps {
  flight: Flight;
}

export default function FlightCard({ flight }: FlightCardProps) {
  const departTime = new Date(flight.departureTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const arrivalTime = new Date(flight.arrivalTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-dark-card border border-dark-border border-gold border-opacity-30 rounded-xl p-4 hover:border-gold hover:border-opacity-100 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white group-hover:text-gold transition">
            {flight.airline} ({flight.flightNumber})
          </h3>
          <p className="text-gray-400 text-sm">{flight.class.charAt(0).toUpperCase() + flight.class.slice(1)}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gold">${flight.price}</p>
          <p className="text-gray-400 text-xs">{flight.currency}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="text-center flex-1">
          <p className="text-2xl font-bold text-white">{flight.from.code}</p>
          <p className="text-gray-400 text-xs">{departTime}</p>
          <p className="text-gray-500 text-xs">{flight.from.city}</p>
        </div>

        <div className="flex-1 px-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="h-px bg-gradient-to-r from-transparent via-gold to-transparent flex-1"></div>
            <span className="text-gold text-xs font-semibold">{flight.duration}</span>
            <div className="h-px bg-gradient-to-r from-transparent via-gold to-transparent flex-1"></div>
          </div>
          <p className="text-center text-gray-400 text-xs">
            {flight.stops === 0 ? 'Direct' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="text-center flex-1">
          <p className="text-2xl font-bold text-white">{flight.to.code}</p>
          <p className="text-gray-400 text-xs">{arrivalTime}</p>
          <p className="text-gray-500 text-xs">{flight.to.city}</p>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-gray-400 border-t border-dark-border pt-3">
        <span>Seats: {flight.seatsAvailable} available</span>
        <button className="btn-secondary text-xs px-3 py-1">
          Book Now
        </button>
      </div>
    </motion.div>
  );
}
