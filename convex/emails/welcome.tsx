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
  userName?: string;
}

const PediascrybeWelcome = ({
  userName,
}: PediascrybeWelcomeProps) => {
  const footerLinks = [
    { text: "Features", href: "https://pediascrybe.com/#features" },
    { text: "Pricing", href: "https://pediascrybe.com/#pricing" },
    { text: "Support", href: "https://pediascrybe.com/contact" }
  ];

  const quickStartSteps = [
    {
      title: "Complete Your Profile Setup",
      description: "Choose your subscription plan to activate your trial and access all platform features.",
    },
    {
      title: "Configure Practice Settings",
      description: "Set up your practice information and customize the platform to your workflow needs.",
    },
    {
      title: "Start Adding Patient Records",
      description: "Begin building your secure patient database with our HIPAA-compliant system.",
    },
  ];

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Body className="bg-[#F6F8FA] font-sans py-[40px] m-0">
          <Preview>Complete your Pediascrybe setup - Choose your plan to start your trial</Preview>
          <Container className="bg-[#FFFFFF] max-w-[600px] mx-auto px-[32px] py-[40px] rounded-[16px]">
            {/* Header with Logo */}
            <div className="text-center mb-[32px]">
              <Img
                src="https://app.pediascrybe.com/logo.svg"
                alt="Pediascrybe Logo"
                className="w-full h-auto object-cover max-w-[200px] mx-auto"
              />
            </div>

            {/* Main Content */}
            <div className="text-left">
              <Heading className="text-[#020304] text-[28px] font-bold leading-[32px] m-0 mb-[24px]">
                Welcome to Pediascrybe
              </Heading>
              
              <Text className="text-[#020304] text-[16px] leading-[24px] m-0 mb-[24px]">
                {userName ? `Dear Dr. ${userName},` : 'Dear Healthcare Professional,'}
              </Text>
              
              <Text className="text-[#020304] text-[16px] leading-[24px] m-0 mb-[24px]">
                Thank you for joining Pediascrybe, the trusted AI-powered platform for pediatric care management. 
                To complete your setup and begin your trial, please select a subscription plan that best fits your practice needs.
              </Text>

              {/* Action Required Banner */}
              <div className="text-center mb-[32px] py-[24px] px-[16px] bg-[#F6F8FA] rounded-[12px] border-2 border-solid border-[#3B82F6]">
                <Text className="text-[#020304] text-[18px] leading-[24px] m-0 font-semibold">
                  Action Required: Choose Your Plan
                </Text>
                <Text className="text-[#64748b] text-[14px] leading-[20px] m-0 mt-[8px]">
                  Complete your profile setup to activate your trial and access all features.
                </Text>
              </div>

              {/* CTA Button - Primary Action */}
              <div className="text-center mb-[32px]">
                <Button
                  href="https://app.pediascrybe.com/user/profile"
                  className="bg-[#3B82F6] text-[#FFFFFF] px-[32px] py-[16px] rounded-full text-[18px] font-semibold no-underline inline-block box-border"
                >
                  Complete Setup & Start Trial
                </Button>
              </div>

              {/* Setup Steps */}
              <Heading className="text-[#020304] text-[20px] font-bold leading-[24px] m-0 mb-[16px]">
                Next Steps to Get Started
              </Heading>

              {quickStartSteps.map((step, index) => (
                <Section key={index} className="mb-[16px]">
                  <div className="flex gap-[12px]">
                    <div className="bg-[#3B82F6] text-[#FFFFFF] w-[28px] h-[28px] rounded-full flex items-center justify-center text-[14px] font-bold shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <Text className="text-[#020304] text-[16px] leading-[24px] m-0 font-semibold">
                        {step.title}
                      </Text>
                      <Text className="text-[#64748b] text-[14px] leading-[20px] m-0">
                        {step.description}
                      </Text>
                    </div>
                  </div>
                </Section>
              ))}

              {/* Plan Benefits */}
              <Text className="text-[#020304] text-[16px] leading-[24px] m-0 mb-[16px] font-semibold">
                What you'll gain access to:
              </Text>
              
              <ul className="text-[#020304] text-[14px] leading-[20px] m-0 mb-[24px] pl-[20px]">
                <li className="mb-[8px]">AI-powered diagnostic assistance and clinical decision support</li>
                <li className="mb-[8px]">Automated patient documentation and record management</li>
                <li className="mb-[8px]">Intelligent prescription and lab recommendation systems</li>
                <li className="mb-[8px]">HIPAA-compliant data security and patient privacy protection</li>
                <li className="mb-[8px]">Streamlined appointment scheduling and practice management</li>
              </ul>

              {/* Trial Information */}
              <div className="bg-[#F6F8FA] p-[20px] rounded-[8px] mb-[24px]">
                <Text className="text-[#020304] text-[16px] leading-[24px] m-0 font-semibold mb-[8px]">
                  Trial Information
                </Text>
                <Text className="text-[#64748b] text-[14px] leading-[20px] m-0">
                  Your trial will begin immediately after plan selection. Experience the full capabilities 
                  of our platform with no commitment. Cancel anytime during your trial period.
                </Text>
              </div>

              {/* Support Section */}
              {/* <Text className="text-[#020304] text-[16px] leading-[24px] m-0 mb-[16px]">
                Need assistance with plan selection or setup? Our professional support team is ready to help. 
                <Link href="https://app.pediascrybe.com/support" className="text-[#3B82F6] no-underline">Contact our support team</Link> 
                for personalized guidance.
              </Text> */}

              <Text className="text-[#020304] text-[16px] leading-[24px] m-0 mb-[24px]">
                We look forward to supporting your pediatric practice with our advanced healthcare technology platform.
              </Text>

              <Text className="text-[#020304] text-[16px] leading-[24px] m-0">
                Best regards,<br />
                The Pediascrybe Team
              </Text>
            </div>

            {/* Footer */}
            <div className="mt-[40px] pt-[24px] border-t border-solid border-[#e5e7eb] bg-[#F6F8FA] p-[20px] rounded-[12px]">
              <div className="text-center mb-[16px]">
                {footerLinks.map((link, index) => (
                  <span key={index}>
                    <Link href={link.href} className="text-[#3B82F6] text-[14px] no-underline">
                      {link.text}
                    </Link>
                    {index < footerLinks.length - 1 && (
                      <span className="text-[#64748b] mx-[8px]">|</span>
                    )}
                  </span>
                ))}
              </div>
              
              <Text className="text-[#64748b] text-[12px] leading-[16px] text-center m-0">
                © {new Date().getFullYear()} Pediascrybe. All rights reserved.
              </Text>
              
              <Text className="text-[#64748b] text-[12px] leading-[16px] text-center m-0 mt-[8px]">
                <Link href="https://app.pediascrybe.com/unsubscribe" className="text-[#3B82F6] no-underline">
                  Unsubscribe
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
  userName: "Sarah Johnson",
};

export default PediascrybeWelcome;