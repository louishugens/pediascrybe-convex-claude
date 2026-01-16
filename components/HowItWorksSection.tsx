// components/HowItWorksSection.js

import React from 'react';

const steps = [
  {
    title: 'Sign Up',
    description: 'Begin your journey with Pediascrybe by creating an account.',
    icon: '📝' // Placeholder icon. Replace with your desired icon or image.
  },
  {
    title: 'Add Patients',
    description: 'Easily input and manage patient details.',
    icon: '👶'
  },
  {
    title: 'Create Records & Diagnose',
    description: 'Use AI-powered diagnostic suggestions when creating records.',
    icon: '🔍'
  },
  {
    title: 'Generate Reports',
    description: 'Print lab exams, drug prescriptions, and growth charts.',
    icon: '📊'
  },
  {
    title: 'Review & Analyze',
    description: 'Harness AI recommendations for drugs and exams based on patient data.',
    icon: '🧠'
  }
];

const HowItWorksSection = () => {
  return (
    <div className="bg-background py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8 text-center">How It Works</h2>
        <div className="space-y-8">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start">
              <div className="text-4xl mr-6">{index + 1}.</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HowItWorksSection;
