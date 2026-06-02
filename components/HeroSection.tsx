'use client';
import Link from 'next/link';
import Image from 'next/image';
import doctor from '@/public/doctor.png'

import { motion } from 'motion/react';

const HeroSection = () => {

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.5
      }
    }
  }
  
  const item = {
    hidden: { opacity: 0, y: -20 },
    show: { opacity: 1, y: 0, transition: { duration: 1, ease: "easeOut" as const }}
  }

  return (
    <div className="relative h-screen overflow-hidden bg-linear-to-br from-muted via-primary/25 to-primary/10">
      <div className="z-40 flex flex-col md:flex-row px-8 md:px-16 h-screen mt-16 md:mt-0">
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col justify-center w-full gap-8"
        >
          <motion.h1
            variants={item}
            className="scroll-m-20 text-2xl font-bold tracking-tight md:text-4xl"
          >
            Save Time, Enhance your Practice
            {/* Pediatric Care, Elevated by Advanced AI Integration */}
          </motion.h1>
          <motion.p 
            variants={item}
            className="text-base md:text-xl text-muted-foreground"
          >
            Deliver exceptional pediatric care with our streamlined patient data management system and AI assistance.
            {/* Tailored for dedicated pediatricians, <span className='text-primary italic font-bold'>Pediascrybe</span> streamlines patient data management like never before. 
            Harness the power of advanced AI integration to elevate your practice. Experience efficiency and precision like never before. */}
          </motion.p>
          <motion.div
            variants={item}
          >
            <Link href={"/" as any} className="text-base md:text-xl font-medium text-foreground bg-primary w-fit px-8 py-4 rounded-full">
              Login
            </Link>
          </motion.div>
        </motion.div>
        <div className="flex flex-col justify-center w-full h-full md:h-auto relative">
          <Image 
            className='absolute bottom-0 left-3/4 -translate-x-2/3' 
            src={doctor}
            alt="Doctor" 
            height={600} 
            width={400} 
            priority 
            // placeholder='blur'
            quality={50}
          />
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
