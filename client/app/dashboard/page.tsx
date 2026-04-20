'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useAlerts, useCreateAlert, useUpdateAlert, useDeleteAlert, PriceAlert } from '@/hooks/useAlerts';
import { popularAirports } from '@/utils/airports';

const statusBadge = (status: PriceAlert['status']) => {
  const map = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    triggered: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  };
  return map[status] || map.inactive;
};

export default function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { data: alerts, isLoading: alertsLoading } = useAlerts();
  const createAlert = useCreateAlert();
  const updateAlert = useUpdateAlert();
  const deleteAlert = useDeleteAlert();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({
    fromCode: 'JFK',
    toCode: 'LHR',
    maxPrice: '400',
  });

  // Redirect if not logged in
  if (!loading && !isAuthenticated) {
    router.push('/');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <motion.div
          className="w-12 h-12 border-4 border-yellow-500/30 border-t-yellow-400 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const fromAirport = popularAirports.find(a => a.code === form.fromCode);
    const toAirport = popularAirports.find(a => a.code === form.toCode);

    await createAlert.mutateAsync({
      origin: { code: form.fromCode, city: fromAirport?.city || form.fromCode, country: fromAirport?.country },
      destination: { code: form.toCode, city: toAirport?.city || form.toCode, country: toAirport?.country },
      maxPrice: Number(form.maxPrice),
      notifyVia: ['email']
    });

    setShowCreateForm(false);
    setForm({ fromCode: 'JFK', toCode: 'LHR', maxPrice: '400' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-bold">
            <span className="text-white">Welcome back, </span>
            <span className="text-yellow-400">{user?.firstName || user?.email?.split('@')[0]}</span>
            <span className="text-white"> ✈️</span>
          </h1>
          <p className="text-[#888] mt-2">Manage your price alerts and track your favorite routes.</p>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            {
              icon: '🔔',
              label: 'Active Alerts',
              value: alerts?.filter(a => a.status === 'active').length ?? 0,
              color: 'text-green-400'
            },
            {
              icon: '🏆',
              label: 'Triggered Alerts',
              value: alerts?.filter(a => a.status === 'triggered').length ?? 0,
              color: 'text-yellow-400'
            },
            {
              icon: '📌',
              label: 'Total Alerts',
              value: alerts?.length ?? 0,
              color: 'text-blue-400'
            }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#111] border border-[#222] rounded-2xl p-6 flex items-center gap-4"
            >
              <span className="text-3xl">{stat.icon}</span>
              <div>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[#666] text-sm">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Price Alerts Section */}
        <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[#1e1e1e] flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Price Alerts</h2>
              <p className="text-[#666] text-sm mt-0.5">Get notified when flight prices drop below your target</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-5 py-2 rounded-xl font-semibold text-sm shadow-lg shadow-yellow-500/20"
            >
              {showCreateForm ? '✕ Cancel' : '+ New Alert'}
            </motion.button>
          </div>

          {/* Create Alert Form */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-b border-[#1e1e1e] overflow-hidden"
              >
                <form onSubmit={handleCreateAlert} className="p-6 bg-[#0d0d0d]">
                  <h3 className="text-sm font-semibold text-yellow-400 mb-4 uppercase tracking-widest">Create New Alert</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-[#888] mb-1.5 block">From Airport</label>
                      <select
                        value={form.fromCode}
                        onChange={e => setForm(f => ({ ...f, fromCode: e.target.value }))}
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] focus:border-yellow-500/60 rounded-xl px-4 py-2.5 text-white text-sm outline-none"
                      >
                        {popularAirports.map(a => (
                          <option key={a.code} value={a.code}>
                            {a.code} — {a.city}, {a.country}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[#888] mb-1.5 block">To Airport</label>
                      <select
                        value={form.toCode}
                        onChange={e => setForm(f => ({ ...f, toCode: e.target.value }))}
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] focus:border-yellow-500/60 rounded-xl px-4 py-2.5 text-white text-sm outline-none"
                      >
                        {popularAirports.map(a => (
                          <option key={a.code} value={a.code}>
                            {a.code} — {a.city}, {a.country}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[#888] mb-1.5 block">Max Price (USD)</label>
                      <input
                        type="number"
                        min="1"
                        value={form.maxPrice}
                        onChange={e => setForm(f => ({ ...f, maxPrice: e.target.value }))}
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] focus:border-yellow-500/60 rounded-xl px-4 py-2.5 text-white text-sm outline-none"
                        placeholder="e.g. 400"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={createAlert.isPending}
                      className="bg-yellow-500 text-black px-6 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50"
                    >
                      {createAlert.isPending ? 'Creating...' : '🔔 Create Alert'}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Alerts list */}
          <div className="divide-y divide-[#1a1a1a]">
            {alertsLoading ? (
              <div className="p-8 text-center text-[#555]">
                <motion.div
                  className="w-8 h-8 border-2 border-yellow-500/30 border-t-yellow-400 rounded-full mx-auto mb-3"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                Loading alerts...
              </div>
            ) : !alerts || alerts.length === 0 ? (
              <div className="p-12 text-center">
                <span className="text-5xl mb-4 block">🔔</span>
                <p className="text-[#555] text-lg">No alerts yet</p>
                <p className="text-[#444] text-sm mt-1">Create your first price alert to get notified when flights drop!</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {alerts.map((alert, idx) => (
                  <motion.div
                    key={alert._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: idx * 0.04 }}
                    className="px-6 py-5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="text-2xl">✈️</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white">
                            {alert.origin.city} ({alert.origin.code})
                          </span>
                          <span className="text-yellow-400">→</span>
                          <span className="font-bold text-white">
                            {alert.destination.city} ({alert.destination.code})
                          </span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full border capitalize ${statusBadge(alert.status)}`}>
                            {alert.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-yellow-400 font-semibold text-sm">
                            Alert: under ${alert.maxPrice}
                          </span>
                          {alert.triggeredPrice && (
                            <span className="text-green-400 text-sm">
                              Triggered at ${alert.triggeredPrice}
                            </span>
                          )}
                          <span className="text-[#555] text-xs">
                            Created {new Date(alert.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => updateAlert.mutate({
                          id: alert._id,
                          status: alert.status === 'active' ? 'inactive' : 'active'
                        })}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          alert.status === 'active'
                            ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                            : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                        }`}
                      >
                        {alert.status === 'active' ? 'Pause' : 'Resume'}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => deleteAlert.mutate(alert._id)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-[#333] text-[#666] hover:border-red-500/40 hover:text-red-400 transition-colors"
                      >
                        🗑️
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-[#111] border border-[#222] rounded-2xl p-6"
        >
          <h2 className="text-lg font-bold mb-3 text-white">Account Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[#555]">Email</span>
              <p className="text-white mt-0.5">{user?.email}</p>
            </div>
            <div>
              <span className="text-[#555]">Name</span>
              <p className="text-white mt-0.5">
                {user?.firstName || user?.lastName
                  ? `${user.firstName} ${user.lastName}`.trim()
                  : '—'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
