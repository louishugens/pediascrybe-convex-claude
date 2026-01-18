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

interface MagicLinkEmailProps {
  url: string;
  userName?: string;
  brandName?: string;
  brandTagline?: string;
  brandLogoUrl?: string;
}

const MagicLinkEmail = ({
  url,
  userName,
  brandName = "Pediascrybe",
  brandTagline = "Transforming Pediatric Care",
  brandLogoUrl = "https://app.pediascrybe.com/logo.svg",
}: MagicLinkEmailProps) => {
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
          <Preview>Sign in to Pediascrybe with this secure magic link</Preview>
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
                Your Secure Sign-In Link
              </Heading>
              
              <Text className="text-[#020304] text-[16px] leading-[24px] m-0 mb-[24px]">
                {userName ? `Hello ${userName},` : 'Hello,'}
              </Text>
              
              <Text className="text-[#020304] text-[16px] leading-[24px] m-0 mb-[32px]">
                We&apos;ve generated a secure magic link to sign you into your Pediascrybe account. 
                No password needed – just click the button below to access your pediatric documentation 
                platform instantly and securely.
              </Text>
              
              <Text className="text-[#020304] text-[16px] leading-[24px] m-0 mb-[32px]">
                Click the button below to sign in and continue providing exceptional pediatric care:
              </Text>
              
              <div className="text-center mb-[32px]">
                <Link
                  href={url}
                  target="_blank"
                  className="bg-[#3B82F6] text-white text-[16px] font-medium py-[12px] px-[32px] rounded-full no-underline inline-block box-border hover:bg-[#1d4ed8]"
                >
                  Sign In to Pediascrybe
                </Link>
              </div>
              
              <Text className="text-[#020304] text-[14px] leading-[20px] m-0 mb-[16px]">
                Or copy and paste this link into your browser:
              </Text>
              
              <Text className="text-[#3B82F6] text-[14px] leading-[20px] m-0 mb-[32px] break-all">
                {url}
              </Text>
              
              <Text className="text-[#020304] text-[16px] leading-[24px] m-0 mb-[24px]">
                Once signed in, you&apos;ll have access to:
              </Text>
              
              <Text className="text-[#020304] text-[16px] leading-[24px] m-0 mb-[8px] pl-[16px]">
                • AI-powered pediatric clinical documentation
              </Text>
              <Text className="text-[#020304] text-[16px] leading-[24px] m-0 mb-[8px] pl-[16px]">
                • Smart templates tailored for pediatric encounters
              </Text>
              <Text className="text-[#020304] text-[16px] leading-[24px] m-0 mb-[32px] pl-[16px]">
                • Streamlined workflow tools for your practice
              </Text>
              
              <Text className="text-[#64748b] text-[14px] leading-[20px] m-0 mt-[40px] pt-[24px]">
                <strong>Security Note:</strong> 
                {/* This magic link will expire in 15 minutes for your protection and can only be used once. */}
              </Text>
              
              <Text className="text-[#64748b] text-[14px] leading-[20px] m-0 mt-[16px]">
                If you didn&apos;t request this sign-in link, you can safely ignore this email. 
                Your account remains secure and no further action is required.
              </Text>
              
              <Text className="text-[#020304] text-[16px] leading-[24px] m-0 mt-[24px] font-medium">
                Ready to transform your pediatric documentation? Your patients are waiting!
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

MagicLinkEmail.PreviewProps = {
  url: "https://app.pediascrybe.com/auth/magic-link?token=abc123",
  userName: "Dr. Sarah Johnson",
};

export default MagicLinkEmail;