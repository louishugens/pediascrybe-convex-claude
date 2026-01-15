'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Sparkles } from 'lucide-react';

interface ScrybeInputProps {
  patientId: string;
}

export default function ScrybeInput({ patientId }: ScrybeInputProps) {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    // Navigate to ScrybeGPT after a brief moment to show the focus animation
    setTimeout(() => {
      router.push(`/user/patients/${patientId}/scrybegpt`);
    }, 150);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 shadow-sm"
    >
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        AI Assistant
      </h4>
      
      <motion.div
        animate={{
          scale: isFocused ? 1.02 : 1,
          boxShadow: isFocused 
            ? '0 0 0 3px var(--primary), 0 0 20px rgba(var(--primary), 0.3)' 
            : '0 0 0 0px transparent',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="relative rounded-full"
      >
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <Input
          placeholder="Ask about this patient..."
          className="pl-10 cursor-pointer"
          onFocus={handleFocus}
          readOnly
        />
      </motion.div>
      
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Click to chat with ScrybeGPT
      </p>
    </motion.div>
  );
}
