import CTASection from '@/components/CTASection'
import FeaturesSection from '@/components/FeaturesSection'
import HeroSection from '@/components/HeroSection'
import HowItWorksSection from '@/components/HowItWorksSection'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

export default function Page() {
  return (
    <main className='w-screen min-h-screen '>
      <HeroSection />
      <FeaturesSection />
      {/* <HowItWorksSection /> */}
      <CTASection />
    </main>
  )
}
