'use client'
import Image from 'next/image';
import { motion, useAnimation } from 'framer-motion';
import Link from 'next/link';
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

const CTASection = () => {

  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.7,
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  return (
    <div ref={ref} className="relative h-screen flex items-center justify-center bg-primary text-white overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image 
          src="/pediatre.jpg" 
          alt="Background" 
          width={1920} 
          height={1080}
          // layout="fill" 
          // objectFit="cover" 
          className="opacity-50" 
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-8 flex flex-col justify-center items-center">
        <motion.h2
          initial="hidden"
          animate={controls}
          variants={{
            hidden: { y: -50, opacity: 0 },
            visible: { y: 0, opacity: 1 },
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-4xl font-bold mb-4"
        >
          Transform Pediatric Care with Pediascrybe
        </motion.h2>
        <motion.p
          initial="hidden"
          animate={controls}
          variants={{
            hidden: { y: 50, opacity: 0 },
            visible: { y: 0, opacity: 1 },
          }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          className="text-lg mb-8"
        >
          Harness the power of AI to provide better care for your young patients.
        </motion.p>
        <motion.div
          initial="hidden"
          animate={controls}
          variants={{
            hidden: { scale: 0.9, opacity: 0 },
            visible: { scale: 1, opacity: 1 },
          }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
          className="bg-white text-primary px-8 py-4 rounded-full text-lg w-fit font-semibold hover:bg-gray-100"
        >
          <Link href="/signup" >
            Start Free Trial
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default CTASection;
