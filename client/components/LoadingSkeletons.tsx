'use client';

import { motion } from 'framer-motion';

export default function LoadingSkeletons() {
  const skeletons = Array.from({ length: 3 });

  return (
    <div className="space-y-4">
      {skeletons.map((_, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
          className="bg-dark-card border border-dark-border rounded-xl p-4 h-24"
        >
          <div className="space-y-3">
            <div className="h-4 bg-dark-border rounded w-1/2"></div>
            <div className="h-4 bg-dark-border rounded w-3/4"></div>
            <div className="h-3 bg-dark-border rounded w-1/4"></div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
