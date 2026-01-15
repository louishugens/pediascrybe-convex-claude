'use client';

import { motion } from 'motion/react';
import { Skeleton } from '@/components/ui/skeleton';

const ChartsNavSkeleton = () => {
  const items = [
    { width: 'w-16' },    // Leave button
    { width: 'w-20' },    // Weight
    { width: 'w-18' },    // Height  
    { width: 'w-14' },    // W/H
    { width: 'w-14' },    // BMI
    { width: 'w-16' },    // Head
  ];

  return (
    <nav className="flex flex-wrap items-center gap-2 max-w-full">
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3, 
            delay: index * 0.05,
            ease: 'easeOut'
          }}
        >
          <Skeleton 
            className={`h-9 ${item.width} rounded-full bg-muted/60`}
          />
        </motion.div>
      ))}
    </nav>
  );
};

export default ChartsNavSkeleton;
