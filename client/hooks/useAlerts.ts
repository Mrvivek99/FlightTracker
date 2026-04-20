'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';

export interface PriceAlert {
  _id: string;
  origin: { code: string; city: string; country: string };
  destination: { code: string; city: string; country: string };
  maxPrice: number;
  currency: string;
  status: 'active' | 'inactive' | 'triggered';
  notifyVia: string[];
  createdAt: string;
  triggeredAt?: string;
  triggeredPrice?: number;
}

/** Get all alerts for the logged-in user */
export const useAlerts = () => {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const response = await api.get('/routes/alerts');
      return response.data.alerts as PriceAlert[];
    },
    staleTime: 30000,
    retry: false
  });
};

/** Create a new price alert */
export const useCreateAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      origin: { code: string; city: string; country?: string };
      destination: { code: string; city: string; country?: string };
      maxPrice: number;
      notifyVia?: string[];
    }) => {
      const response = await api.post('/routes/alert', data);
      return response.data.alert as PriceAlert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });
};

/** Update alert status (active/inactive) */
export const useUpdateAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.patch(`/routes/alert/${id}`, { status });
      return response.data.alert as PriceAlert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });
};

/** Delete a price alert */
export const useDeleteAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/routes/alert/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });
};
