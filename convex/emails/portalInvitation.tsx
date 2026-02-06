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

interface PortalInvitationProps {
  doctorName: string;
  childName: string;
  inviteUrl: string;
}

const PortalInvitation = ({
  doctorName = "Dr. Smith",
  childName = "Emma",
  inviteUrl = "https://app.pediascrybe.com/portal/join?token=abc123",
}: PortalInvitationProps) => {
  const footerLinks = [
    { text: "Features", href: "https://pediascrybe.com/#features" },
    { text: "Support", href: "https://pediascrybe.com/contact" },
  ];

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Body className="bg-[#F6F8FA] font-sans py-[40px] m-0">
          <Preview>You&apos;ve been invited to view {childName}&apos;s health records on Pediascrybe</Preview>
          <Container className="bg-[#FFFFFF] max-w-[600px] mx-auto px-[32px] py-[40px] rounded-[16px]">
            {/* Header with Logo */}
            <div className="text-center mb-[32px]">
              <Img
                src="https://app.pediascrybe.com/logo.png"
                alt="Pediascrybe Logo"
                className="w-full h-auto object-cover max-w-[200px] mx-auto"
              />
            </div>

            {/* Main Content */}
            <div className="text-left">
              <Heading className="text-[#020304] text-[28px] font-bold leading-[32px] m-0 mb-[24px]">
                Parent Portal Invitation
              </Heading>

              <Text className="text-[#020304] text-[16px] leading-[24px] m-0 mb-[24px]">
                Hello,
              </Text>

              <Text className="text-[#020304] text-[16px] leading-[24px] m-0 mb-[24px]">
                <strong>{doctorName}</strong> has invited you to access <strong>{childName}&apos;s</strong> health records
                through the Pediascrybe Parent Portal.
              </Text>

              {/* What you can access */}
              <div className="mb-[32px] py-[24px] px-[16px] bg-[#F6F8FA] rounded-[12px]">
                <Text className="text-[#020304] text-[16px] leading-[24px] m-0 font-semibold mb-[12px]">
                  With the Parent Portal, you can:
                </Text>
                <ul className="text-[#020304] text-[14px] leading-[20px] m-0 pl-[20px]">
                  <li className="mb-[8px]">View appointment summaries and medical notes</li>
                  <li className="mb-[8px]">Print prescriptions and lab exam requests</li>
                  <li className="mb-[8px]">Track vaccination records and compliance</li>
                  <li className="mb-[8px]">View growth charts and developmental progress</li>
                  <li className="mb-[8px]">Upload documents and images for your doctor</li>
                </ul>
              </div>

              {/* CTA Button */}
              <div className="text-center mb-[32px]">
                <Button
                  href={inviteUrl}
                  className="bg-[#3B82F6] text-[#FFFFFF] px-[32px] py-[16px] rounded-full text-[18px] font-semibold no-underline inline-block box-border"
                >
                  Accept Invitation
                </Button>
              </div>

              <Text className="text-[#64748b] text-[14px] leading-[20px] m-0 mb-[24px]">
                This invitation expires in 7 days. If you did not expect this invitation, you can safely ignore this email.
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
            </div>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

PortalInvitation.PreviewProps = {
  doctorName: "Dr. Sarah Johnson",
  childName: "Emma",
  inviteUrl: "https://app.pediascrybe.com/portal/join?token=abc123",
};

export default PortalInvitation;
