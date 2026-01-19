import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Link,
  Text,
  Img,
  Preview,
  Tailwind,
  Heading,
  Section,
} from "@react-email/components";

interface PediascrybeWelcomeProps {
  lastname?: string;
  brandName?: string;
  brandTagline?: string;
  brandLogoUrl?: string;
}

const PediascrybeWelcome = ({
  lastname,
  brandName = "Pediascrybe",
  brandTagline = "Transforming Pediatric Care",
  brandLogoUrl = "https://www.pediascrybe.com/logo.png",
}: PediascrybeWelcomeProps) => {
  const footerLinks = [
    { text: "Features", href: "https://www.pediascrybe.com/features" },
    { text: "Pricing", href: "https://www.pediascrybe.com/pricing" },
    { text: "Support", href: "https://www.pediascrybe.com/support" }
  ];

  const quickStartSteps = [
    {
      title: "Add Your First Patient",
      description: "Start by adding patient records to build your practice database.",
    },
    {
      title: "Create Appointments",
      description: "Schedule and manage consultations with ease.",
    },
    {
      title: "Use AI-Powered Features",
      description: "Get smart diagnostic suggestions, prescriptions, and lab recommendations.",
    },
  ];

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Body className="bg-[#f0f7ff] font-sans py-[40px] m-0">
          <Preview>Welcome to Pediascrybe - Let&apos;s get started!</Preview>
          <Container className="bg-[#ffffff] max-w-[600px] mx-auto px-[32px] py-[40px] rounded-[16px]">
            {/* Header with Logo */}
            <div className="text-center mb-[32px]">
              <Img
                src={brandLogoUrl}
                alt={`${brandName} Logo`}
                className="w-full h-auto object-cover max-w-[200px] mx-auto"
              />
            </div>

            {/* Main Content */}
            <div className="text-left">
              <Heading className="text-[#1e3a5f] text-[28px] font-bold leading-[32px] m-0 mb-[24px]">
                Welcome to Pediascrybe!
              </Heading>
              
              <Text className="text-[#1e3a5f] text-[16px] leading-[24px] m-0 mb-[24px]">
                {lastname ? `Hello Dr. ${lastname},` : 'Hello,'}
              </Text>
              
              <Text className="text-[#1e3a5f] text-[16px] leading-[24px] m-0 mb-[24px]">
                Thank you for joining Pediascrybe! We&apos;re excited to have you on board. 
                Our platform is designed to help pediatricians like you streamline patient 
                care, save time on documentation, and leverage AI-powered insights.
              </Text>

              {/* Welcome Banner */}
              <div className="text-center mb-[32px] py-[24px] px-[16px] bg-[#f0f7ff] rounded-[12px] border-2 border-solid border-[#2563eb]">
                <Text className="text-[#1e3a5f] text-[18px] leading-[24px] m-0 font-semibold">
                  Your 7-day free trial has started!
                </Text>
                <Text className="text-[#64748b] text-[14px] leading-[20px] m-0 mt-[8px]">
                  Explore all features with full access during your trial period.
                </Text>
              </div>

              {/* Quick Start Guide */}
              <Heading className="text-[#1e3a5f] text-[20px] font-bold leading-[24px] m-0 mb-[16px]">
                Quick Start Guide
              </Heading>

              {quickStartSteps.map((step, index) => (
                <Section key={index} className="mb-[16px]">
                  <table cellPadding="0" cellSpacing="0" style={{ width: '100%' }}>
                    <tr>
                      <td style={{ width: '40px', verticalAlign: 'top', paddingRight: '12px' }}>
                        <div style={{
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          lineHeight: '28px',
                        }}>
                          {index + 1}
                        </div>
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        <Text className="text-[#1e3a5f] text-[16px] leading-[24px] m-0 font-semibold">
                          {step.title}
                        </Text>
                        <Text className="text-[#64748b] text-[14px] leading-[20px] m-0">
                          {step.description}
                        </Text>
                      </td>
                    </tr>
                  </table>
                </Section>
              ))}

              {/* CTA Button */}
              <div className="text-center mt-[32px] mb-[32px]">
                <Button
                  href="https://www.pediascrybe.com/user"
                  className="bg-[#2563eb] text-[#ffffff] px-[32px] py-[14px] rounded-[8px] text-[16px] font-semibold no-underline inline-block"
                >
                  Go to Dashboard
                </Button>
              </div>

              {/* Key Features */}
              <Text className="text-[#1e3a5f] text-[16px] leading-[24px] m-0 mb-[16px] font-semibold">
                What you can do with Pediascrybe:
              </Text>
              
              <ul className="text-[#1e3a5f] text-[14px] leading-[24px] m-0 mb-[24px] pl-[20px]">
                <li className="mb-[8px]">Manage patient records with comprehensive EMR</li>
                <li className="mb-[8px]">Track growth with WHO growth charts</li>
                <li className="mb-[8px]">Get AI-powered diagnostic suggestions</li>
                <li className="mb-[8px]">Generate prescriptions with weight-based dosing</li>
                <li className="mb-[8px]">Create professional reports and receipts</li>
                <li className="mb-[8px]">Manage vaccination schedules</li>
              </ul>

              <Text className="text-[#64748b] text-[14px] leading-[20px] m-0 mt-[24px]">
                Need help getting started? Check out our{" "}
                <Link
                  href="https://www.pediascrybe.com/docs"
                  className="text-[#2563eb] no-underline hover:underline"
                >
                  documentation
                </Link>{" "}
                or reach out to our support team at{" "}
                <Link
                  href="mailto:support@pediascrybe.com"
                  className="text-[#2563eb] no-underline hover:underline"
                >
                  support@pediascrybe.com
                </Link>
              </Text>
              
              <Text className="text-[#1e3a5f] text-[16px] leading-[24px] m-0 mt-[24px] font-medium">
                Welcome aboard!
              </Text>
              <Text className="text-[#1e3a5f] text-[16px] leading-[24px] m-0">
                The Pediascrybe Team
              </Text>
            </div>

            {/* Footer */}
            <div className="mt-[48px] py-[20px] border-t border-solid border-[#e2e8f0] rounded-[8px]">
              {/* Footer Links */}
              <Text className="text-[#1e3a5f] text-[12px] leading-[18px] m-0 mb-[16px] text-center">
                {footerLinks.map((link, i) => (
                  <React.Fragment key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[#2563eb] text-[12px] no-underline hover:underline"
                    >
                      {link.text}
                    </Link>
                    {i < footerLinks.length - 1 && (
                      <span className="text-[#1e3a5f] mx-[8px]">•</span>
                    )}
                  </React.Fragment>
                ))}
              </Text>

              {/* Brand Footer Text */}
              <Text className="text-[#1e3a5f] text-[12px] leading-[18px] m-0 mb-[8px] text-center">
                {brandName} - {brandTagline}
              </Text>

              {/* Copyright */}
              <Text className="text-[#1e3a5f] text-[12px] leading-[18px] m-0 text-center">
                © 2025 Pediascrybe. All rights reserved.
              </Text>

              {/* Website Link */}
              <Text className="text-[#1e3a5f] text-[12px] leading-[18px] m-0 mt-[8px] text-center">
                <Link
                  href="https://www.pediascrybe.com"
                  className="text-[#2563eb] text-[12px] no-underline hover:underline"
                >
                  www.pediascrybe.com
                </Link>
              </Text>
            </div>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

PediascrybeWelcome.PreviewProps = {
  lastname: "Smith",
};

export default PediascrybeWelcome;
