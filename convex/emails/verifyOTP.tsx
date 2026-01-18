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
  brandLogoUrl = "https://app.pediascrybe.com/logo.svg",
}: VerifyOTPProps) => {
  const footerLinks = [
    { text: "Features", href: "https://pediascrybe.com/#features" },
    { text: "Pricing", href: "https://pediascrybe.com/#pricing" },
    { text: "Support", href: "https://pediascrybe.com/contact" }
  ];

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Body className="bg-[#F6F8FA] font-sans py-[40px] m-0">
          <Preview>Your Pediascrybe verification code: {code}</Preview>
          <Container className="bg-[#FFFFFF] max-w-[600px] mx-auto px-[32px] py-[40px] rounded-[16px]">
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
              <Heading className="text-[#020304] text-[28px] font-bold leading-[32px] m-0 mb-[24px]">
                Verification Code Required
              </Heading>
              
              <Text className="text-[#020304] text-[16px] leading-[24px] m-0 mb-[24px]">
                {userName ? `Hello ${userName},` : 'Hello,'}
              </Text>
              
              <Text className="text-[#020304] text-[16px] leading-[24px] m-0 mb-[32px]">
                To ensure the security of your Pediascrybe account and protect your patient 
                documentation, we need to verify your identity. This extra step helps us 
                maintain the highest standards of data security for your practice.
              </Text>
              
              <Text className="text-[#020304] text-[16px] leading-[24px] m-0 mb-[24px]">
                Please enter the following verification code to proceed:
              </Text>
              
              {/* Verification Code Display */}
              <div className="text-center mb-[32px] py-[24px] px-[16px] bg-[#F6F8FA] rounded-[12px] border-2 border-solid border-[#3B82F6]">
                <Text className="text-[#020304] text-[14px] leading-[20px] m-0 mb-[8px] font-medium">
                  Your Verification Code
                </Text>
                <div className="bg-[#FFFFFF] py-[16px] px-[24px] rounded-[8px] inline-block">
                  <Text className="text-[#020304] text-[32px] font-bold leading-[40px] m-0 font-mono tracking-[8px]">
                    {code}
                  </Text>
                </div>
              </div>
              
              <Text className="text-[#020304] text-[16px] leading-[24px] m-0 mb-[24px]">
                Once verified, you can continue using Pediascrybe with confidence, knowing 
                your account and patient documentation remain secure.
              </Text>
              
              <Text className="text-[#64748b] text-[14px] leading-[20px] m-0 mt-[40px] pt-[24px]">
                <strong>Security Note:</strong> 
              </Text>
              
              <Text className="text-[#64748b] text-[14px] leading-[20px] m-0 mt-[16px]">
                If you didn&apos;t request this verification code, please contact our support team immediately 
                to ensure your account security.
              </Text>
              
              <Text className="text-[#020304] text-[16px] leading-[24px] m-0 mt-[24px] font-medium">
                Thank you for helping us keep your pediatric documentation secure.
              </Text>
            </div>

            {/* Footer */}
            <div className="mt-[48px] py-[20px] border-t border-solid border-[#e2e8f0] bg-[#F6F8FA] p-[20px] rounded-[12px]">
              {/* Footer Links */}
              <Text className="text-[#020304] text-[12px] leading-[18px] m-0 mb-[16px] text-center">
                {footerLinks.map((link, i) => (
                  <span key={i}>
                    <Link
                      href={link.href}
                      className="text-[#3B82F6] text-[12px] no-underline"
                    >
                      {link.text}
                    </Link>
                    {i < footerLinks.length - 1 && (
                      <span className="text-[#64748b] mx-[8px]">|</span>
                    )}
                  </span>
                ))}
              </Text>
              
              {/* Copyright */}
              <Text className="text-[#64748b] text-[12px] leading-[16px] text-center m-0">
                © {new Date().getFullYear()} Pediascrybe. All rights reserved.
              </Text>
              
              {/* Unsubscribe */}
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

VerifyOTP.PreviewProps = {
  code: "123456",
  userName: "Dr. Sarah Johnson",
};

export default VerifyOTP;