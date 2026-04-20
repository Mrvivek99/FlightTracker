'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/utils/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatHistorySession {
  sessionId: string;
  messages: Array<{ role: string; content: string; timestamp: string }>;
  detectedIntent: { from: string; to: string; date: string };
  createdAt: string;
  updatedAt: string;
}

/** Send a message with full conversation history for multi-turn context */
export const useChat = () => {
  return useMutation({
    mutationFn: async ({
      message,
      history = [],
      sessionId
    }: {
      message: string;
      history?: Array<{ role: string; content: string }>;
      sessionId?: string | null;
    }) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history, sessionId })
      });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      return data as {
        message: string;
        sessionId: string;
        detectedIntent: { from: string; to: string; date: string } | null;
        timestamp: string;
      };
    }
  });
};

/** Fetch saved chat history sessions for the authenticated user */
export const useChatHistory = () => {
  return useQuery({
    queryKey: ['chatHistory'],
    queryFn: async () => {
      const response = await api.get('/chat/history');
      return response.data.sessions as ChatHistorySession[];
    },
    staleTime: 60000,
    retry: false // don't retry if user is not logged in
  });
};
