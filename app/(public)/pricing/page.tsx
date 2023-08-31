// pages/pricing.js
import Link from 'next/link';

const Pricing = () => {
  const plans = [
    {
      name: 'Free Trial',
      price: '1 Month Free',
      features: ['Add Patients', 'Consultations', 'Growth Charts', 'Then Read-Only'],
    },
    {
      name: 'Pro',
      price: '$25/mo',
      features: ['Add Patients', 'Consultations', 'Growth Charts'],
    },
    {
      name: 'Premium',
      price: '$45/mo',
      features: ['All Pro Features', 'AI Diagnostic', 'Drug & Exam Propositions'],
    },
  ];

  return (
    <div className="min-h-screen bg-muted py-16 pt-24">
      <div className="container px-8 md:px-16 text-center">
        <h1 className="text-4xl font-bold mb-8">Pricing Plans</h1>
        
        {/* Introductory Text */}
        <p className="text-lg mb-12">
          Choose the plan that best suits your needs. Start with a 1-month free trial and upgrade anytime.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {plans.map((plan, index) => (
            <div key={index} className="bg-white p-8 md:p-8 h-auto rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">{plan.name}</h2>
              <p className="text-4xl font-bold mb-6">{plan.price}</p>
              <ul className="mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="mb-2 text-muted-foreground">{feature}</li>
                ))}
              </ul>
              <Link href="/signup" className="bg-primary text-white px-8 py-4 rounded-full">
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
