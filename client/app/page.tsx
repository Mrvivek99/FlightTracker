'use client';

import { usePopularRoutes } from '@/hooks/useFlights';
import SearchBar from '@/components/SearchBar';
import PriceGraph from '@/components/PriceGraph';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  const { data: popularRoutes, isLoading } = usePopularRoutes();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  return (
    <div className="bg-gradient-to-b from-dark via-dark-card to-dark min-h-screen">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto px-6 py-20"
      >
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-7xl font-bold mb-4">
            <span className="text-white">Find Your</span>
            <br />
            <span className="text-gold">Perfect Flight</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-8">
            AI-powered price tracking and intelligent flight recommendations for smarter travel decisions.
          </p>
          <Link href="/search" className="btn-primary inline-block text-lg">
            Start Searching →
          </Link>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16"
        >
          <SearchBar />
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {[
            {
              icon: '🤖',
              title: 'AI Assistant',
              desc: 'Get intelligent flight recommendations powered by Gemini AI'
            },
            {
              icon: '📊',
              title: 'Price Tracking',
              desc: 'Monitor flight prices and get alerts when deals drop'
            },
            {
              icon: '💰',
              title: 'Best Deals',
              desc: 'Find the cheapest flights across all airlines instantly'
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="bg-dark-card border border-dark-border hover:border-gold rounded-xl p-6 group transition-all duration-300"
            >
              <div className="text-4xl mb-4 group-hover:scale-125 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2 text-white group-hover:text-gold transition">
                {feature.title}
              </h3>
              <p className="text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Popular Routes */}
        {!isLoading && popularRoutes && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-gold mb-8">Popular Routes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {popularRoutes?.map((route: any, idx: number) => (
                <Link
                  key={idx}
                  href={`/search?from=${route.from}&to=${route.to}`}
                  className="bg-dark-card border border-dark-border hover:border-gold rounded-lg p-4 group transition-all duration-300 hover:shadow-lg hover:shadow-gold/20"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-bold text-white">{route.from}</span>
                    <span className="text-gold">→</span>
                    <span className="text-lg font-bold text-white">{route.to}</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">
                    {route.fromCity} → {route.toCity}
                  </p>
                  <p className="text-gold font-bold">
                    From ${route.cheapestPrice || 'N/A'}
                  </p>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* Price Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mb-16"
        >
          <PriceGraph title="Sample Price Trends (NYC → London)" />
        </motion.div>
      </motion.section>

      {/* CTA Section */}
      <section className="bg-dark-card border-t border-b border-dark-border py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Save on Your Next Flight?</h2>
          <p className="text-gray-400 mb-8">Join thousands of travelers finding the best deals</p>
          <Link href="/search" className="btn-primary inline-block text-lg">
            Start Searching →
          </Link>
        </div>
      </section>
    </div>
  );
}
