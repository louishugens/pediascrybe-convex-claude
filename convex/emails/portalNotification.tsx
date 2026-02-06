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
} from "@react-email/components";

interface PortalNotificationProps {
  parentName?: string;
  childName: string;
  doctorName: string;
  notificationType: "new_prescription" | "new_lab_exam" | "appointment_summary" | "new_vaccine_record" | "new_report";
  message: string;
  portalUrl: string;
}

const NOTIFICATION_CONFIG = {
  new_prescription: {
    subject: "New Prescription Available",
    previewText: "A new prescription has been added",
    heading: "New Prescription",
  },
  new_lab_exam: {
    subject: "New Lab Exam Request",
    previewText: "A new lab exam has been requested",
    heading: "New Lab Exam",
  },
  appointment_summary: {
    subject: "Appointment Summary Available",
    previewText: "Your appointment summary is ready",
    heading: "Appointment Summary",
  },
  new_vaccine_record: {
    subject: "Vaccination Record Updated",
    previewText: "A new vaccination has been recorded",
    heading: "Vaccination Update",
  },
  new_report: {
    subject: "New Report Available",
    previewText: "A new report has been created",
    heading: "New Report",
  },
};

const PortalNotification = ({
  parentName,
  childName = "Emma",
  doctorName = "Dr. Smith",
  notificationType = "new_prescription",
  message = "A new prescription has been added for your child.",
  portalUrl = "https://app.pediascrybe.com/portal",
}: PortalNotificationProps) => {
  const config = NOTIFICATION_CONFIG[notificationType];

  const footerLinks = [
    { text: "Features", href: "https://pediascrybe.com/#features" },
    { text: "Support", href: "https://pediascrybe.com/contact" },
  ];

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Body className="bg-[#F6F8FA] font-sans py-[40px] m-0">
          <Preview>{config.previewText} for {childName}</Preview>
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
                {config.heading}
              </Heading>

              <Text className="text-[#020304] text-[16px] leading-[24px] m-0 mb-[24px]">
                {parentName ? `Hello ${parentName},` : 'Hello,'}
              </Text>

              <Text className="text-[#020304] text-[16px] leading-[24px] m-0 mb-[24px]">
                {message}
              </Text>

              {/* Details Card */}
              <div className="mb-[32px] py-[20px] px-[16px] bg-[#F6F8FA] rounded-[12px]">
                <Text className="text-[#64748b] text-[14px] leading-[20px] m-0">
                  <strong>Patient:</strong> {childName}
                </Text>
                <Text className="text-[#64748b] text-[14px] leading-[20px] m-0 mt-[4px]">
                  <strong>Doctor:</strong> {doctorName}
                </Text>
              </div>

              {/* CTA Button */}
              <div className="text-center mb-[32px]">
                <Button
                  href={portalUrl}
                  className="bg-[#3B82F6] text-[#FFFFFF] px-[32px] py-[16px] rounded-full text-[18px] font-semibold no-underline inline-block box-border"
                >
                  View in Portal
                </Button>
              </div>

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

PortalNotification.PreviewProps = {
  parentName: "Marie",
  childName: "Emma",
  doctorName: "Dr. Sarah Johnson",
  notificationType: "new_prescription" as const,
  message: "Dr. Sarah Johnson has added a new prescription for Emma. You can view and print it from the Parent Portal.",
  portalUrl: "https://app.pediascrybe.com/portal",
};

export default PortalNotification;
