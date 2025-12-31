import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Text,
  Img,
  Preview,
  Tailwind,
  Heading,
} from "@react-email/components";

interface VerifyOTPProps {
  code: string;
  userName?: string;
  brandName?: string;
  brandTagline?: string;
  brandLogoUrl?: string;
}

const VerifyOTP = ({
  code,
  userName,
  brandName = "Pediascrybe",
  brandTagline = "Transforming Pediatric Care",
  brandLogoUrl = "https://www.pediascrybe.com/logo.png",
}: VerifyOTPProps) => {
  const footerLinks = [
    { text: "Features", href: "https://www.pediascrybe.com/features" },
    { text: "Pricing", href: "https://www.pediascrybe.com/pricing" },
    { text: "Support", href: "https://www.pediascrybe.com/support" }
  ];

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Body className="bg-[#f0f7ff] font-sans py-[40px] m-0">
          <Preview>Your Pediascrybe verification code: {code}</Preview>
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
                Verification Code Required
              </Heading>
              
              <Text className="text-[#1e3a5f] text-[16px] leading-[24px] m-0 mb-[24px]">
                {userName ? `Hello ${userName},` : 'Hello,'}
              </Text>
              
              <Text className="text-[#1e3a5f] text-[16px] leading-[24px] m-0 mb-[32px]">
                To ensure the security of your Pediascrybe account and protect your patient 
                documentation, we need to verify your identity. This extra step helps us 
                maintain the highest standards of data security for your practice.
              </Text>
              
              <Text className="text-[#1e3a5f] text-[16px] leading-[24px] m-0 mb-[24px]">
                Please enter the following verification code to proceed:
              </Text>
              
              {/* Verification Code Display */}
              <div className="text-center mb-[32px] py-[24px] px-[16px] bg-[#f0f7ff] rounded-[12px] border-2 border-solid border-[#2563eb]">
                <Text className="text-[#1e3a5f] text-[14px] leading-[20px] m-0 mb-[8px] font-medium">
                  Your Verification Code
                </Text>
                <div className="bg-[#ffffff] py-[16px] px-[24px] rounded-[8px] inline-block">
                  <Text className="text-[#1e3a5f] text-[32px] font-bold leading-[40px] m-0 font-mono tracking-[8px]">
                    {code}
                  </Text>
                </div>
              </div>
              
              <Text className="text-[#1e3a5f] text-[16px] leading-[24px] m-0 mb-[24px]">
                Once verified, you can continue using Pediascrybe with confidence, knowing 
                your account and patient documentation remain secure.
              </Text>
              
              <Text className="text-[#64748b] text-[14px] leading-[20px] m-0 mt-[40px] pt-[24px]">
                <strong>Security Note:</strong> This verification code will expire in 10 minutes for your protection.
              </Text>
              
              <Text className="text-[#64748b] text-[14px] leading-[20px] m-0 mt-[16px]">
                If you didn&apos;t request this verification code, please contact our support team immediately 
                to ensure your account security.
              </Text>
              
              <Text className="text-[#1e3a5f] text-[16px] leading-[24px] m-0 mt-[24px] font-medium">
                Thank you for helping us keep your pediatric documentation secure.
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

VerifyOTP.PreviewProps = {
  code: "847293",
  userName: "Dr. Elena",
};

export default VerifyOTP;
