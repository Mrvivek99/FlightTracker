'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';

export interface Flight {
  _id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  from: { code: string; city: string; country: string };
  to: { code: string; city: string; country: string };
  departureTime: string;
  arrivalTime: string;
  price: number;
  currency: string;
  duration: string;
  stops: number;
  stopCities: string[];
  seatsAvailable: number;
  class: string;
}

export const useFlights = (from: string, to: string, departDate?: string) => {
  return useQuery({
    queryKey: ['flights', from, to, departDate],
    queryFn: async () => {
      const response = await api.get('/flights/search', {
        params: { from, to, departDate }
      });
      return response.data.flights as Flight[];
    },
    enabled: !!from && !!to,
    staleTime: 300000 // 5 minutes
  });
};

export const usePopularRoutes = () => {
  return useQuery({
    queryKey: ['popularRoutes'],
    queryFn: async () => {
      const response = await api.get('/flights/popular');
      return response.data.routes;
    },
    staleTime: 600000 // 10 minutes
  });
};
