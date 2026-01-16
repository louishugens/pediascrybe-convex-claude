'use client'
import { motion, useAnimation } from 'motion/react';
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import React from 'react';

const features = [
  {
    title: 'Add Patients & Records',
    description: 'Easily input and manage patient details and medical records.',
    icon: '📝' // Placeholder icon. Replace with your desired icon or image.
  },
  {
    title: 'Growth Charts with WHO Reference Data',
    description: 'Monitor your patient\'s growth with accurate and up-to-date WHO reference data.',
    icon: '📈'
  },
  {
    title: 'Print Lab Exams & Drug Prescriptions',
    description: 'Generate and print lab exams and drug prescriptions with just a few clicks.',
    icon: '🖨️'
  },
  {
    title: 'AI Diagnostic Assistance',
    description: 'Get AI-powered diagnostic suggestions to assist in patient care.',
    icon: '🧠'
  },
  {
    title: 'Drug & Exam Propositions by AI',
    description: 'Let our AI recommend suitable drugs and exams based on patient data.',
    icon: '💊'
  },
  { 
    title: 'Chat with your patient\'s data', 
    description: 'Interact with AI on your patient\'s data to gain deeper insights into your patient\'s overall status.', 
    icon: '💬', 
    comingSoon: true 
  },
];

const FeaturesSection = () => {

  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  return (
    <div ref={ref} className="bg-muted py-12 min-h-screen">
      <div className="container mx-auto px-8 md:px-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial="hidden"
              animate={controls}
              variants={{
                hidden: { opacity: 0, y: 50 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
            >
              <div className="flex flex-col items-center bg-white p-8 rounded-md shadow-md relative">
                <div className="mb-4 text-4xl">
                  {feature.icon}  {/* Displaying the icon */}
                </div>
                <h3 className="text-xl font-semibold mb-2 self-start">{feature.title}</h3>
                <p className='text-muted-foreground'>{feature.description}</p>
                {feature.comingSoon && <span className="mt-2 text-xs bg-red-500 text-white px-2 py-1 rounded-full absolute top-2 right-2 -rotate-6">Coming Soon</span>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FeaturesSection;
