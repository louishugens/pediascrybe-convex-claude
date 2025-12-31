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

interface VerifyEmailProps {
  url: string;
  userName?: string;
  brandName?: string;
  brandTagline?: string;
  brandLogoUrl?: string;
}

const VerifyEmail = ({
  url,
  userName,
  brandName = "Pediascrybe",
  brandTagline = "Transforming Pediatric Care",
  brandLogoUrl = "https://www.pediascrybe.com/logo.png",
}: VerifyEmailProps) => {
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
          <Preview>Welcome to Pediascrybe! Verify your email to get started</Preview>
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
                {userName ? `Hello ${userName},` : 'Hello,'}
              </Text>
              
              <Text className="text-[#1e3a5f] text-[16px] leading-[24px] m-0 mb-[32px]">
                Thank you for joining Pediascrybe, the AI-powered documentation platform designed 
                specifically for pediatric healthcare professionals. You&apos;re about to transform 
                the way you document patient encounters and spend more time with your young patients.
              </Text>
              
              <Text className="text-[#1e3a5f] text-[16px] leading-[24px] m-0 mb-[32px]">
                To get started and unlock your access to our intelligent documentation tools, 
                please verify your email address by clicking the button below:
              </Text>
              
              <div className="text-center mb-[32px]">
                <Link
                  href={url}
                  className="bg-[#2563eb] text-white text-[16px] font-medium py-[12px] px-[32px] rounded-[8px] no-underline inline-block box-border hover:bg-[#1d4ed8]"
                >
                  Verify Your Email Address
                </Link>
              </div>
              
              <Text className="text-[#1e3a5f] text-[14px] leading-[20px] m-0 mb-[16px]">
                Or copy and paste this link into your browser:
              </Text>
              
              <Text className="text-[#2563eb] text-[14px] leading-[20px] m-0 mb-[32px] break-all">
                {url}
              </Text>
              
              <Text className="text-[#1e3a5f] text-[16px] leading-[24px] m-0 mb-[24px]">
                Once verified, you&apos;ll have access to:
              </Text>
              
              <Text className="text-[#1e3a5f] text-[16px] leading-[24px] m-0 mb-[8px] pl-[16px]">
                • AI-assisted clinical note generation for pediatric encounters
              </Text>
              <Text className="text-[#1e3a5f] text-[16px] leading-[24px] m-0 mb-[8px] pl-[16px]">
                • Age-specific templates and growth tracking documentation
              </Text>
              <Text className="text-[#1e3a5f] text-[16px] leading-[24px] m-0 mb-[32px] pl-[16px]">
                • Streamlined workflows that reduce documentation burden
              </Text>
              
              <Text className="text-[#64748b] text-[14px] leading-[20px] m-0 mt-[40px] pt-[24px]">
                If you didn&apos;t create an account with Pediascrybe, you can safely ignore this email. 
                No further action is required.
              </Text>
              
              <Text className="text-[#1e3a5f] text-[16px] leading-[24px] m-0 mt-[24px] font-medium">
                Ready to spend less time documenting and more time caring? Let&apos;s get started!
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

VerifyEmail.PreviewProps = {
  url: "https://www.pediascrybe.com/verify?token=abc123xyz",
  userName: "Dr. Maria",
};

export default VerifyEmail;
