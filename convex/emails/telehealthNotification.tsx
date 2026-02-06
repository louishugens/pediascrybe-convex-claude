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

interface TelehealthNotificationProps {
  parentName?: string;
  doctorName?: string;
  childName: string;
  type: "telehealth_booking_request" | "telehealth_confirmed" | "telehealth_rescheduled" | "telehealth_cancelled" | "telehealth_reminder";
  message: string;
  portalUrl: string;
}

const NOTIFICATION_CONFIG = {
  telehealth_booking_request: {
    subject: "New Telehealth Appointment Request",
    previewText: "You have a new telehealth appointment request",
    heading: "New Appointment Request",
  },
  telehealth_confirmed: {
    subject: "Telehealth Appointment Confirmed",
    previewText: "Your telehealth appointment has been confirmed",
    heading: "Appointment Confirmed",
  },
  telehealth_rescheduled: {
    subject: "Telehealth Appointment Rescheduled",
    previewText: "A new time has been proposed for your telehealth appointment",
    heading: "Reschedule Proposal",
  },
  telehealth_cancelled: {
    subject: "Telehealth Appointment Cancelled",
    previewText: "Your telehealth appointment has been cancelled",
    heading: "Appointment Cancelled",
  },
  telehealth_reminder: {
    subject: "Telehealth Appointment Reminder",
    previewText: "Your telehealth appointment is coming up",
    heading: "Appointment Reminder",
  },
};

const TelehealthNotification = ({
  parentName,
  doctorName,
  childName = "Emma",
  type = "telehealth_confirmed",
  message = "Your telehealth appointment has been confirmed.",
  portalUrl = "https://app.pediascrybe.com/portal/telehealth/appointments",
}: TelehealthNotificationProps) => {
  const config = NOTIFICATION_CONFIG[type];

  const footerLinks = [
    { text: "Features", href: "https://pediascrybe.com/#features" },
    { text: "Support", href: "https://pediascrybe.com/contact" },
  ];

  const greeting = parentName
    ? `Hello ${parentName},`
    : doctorName
      ? `Hello Dr. ${doctorName},`
      : "Hello,";

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
                {greeting}
              </Text>

              <Text className="text-[#020304] text-[16px] leading-[24px] m-0 mb-[24px]">
                {message}
              </Text>

              {/* Details Card */}
              <div className="mb-[32px] py-[20px] px-[16px] bg-[#F6F8FA] rounded-[12px]">
                <Text className="text-[#64748b] text-[14px] leading-[20px] m-0">
                  <strong>Patient:</strong> {childName}
                </Text>
                {doctorName && (
                  <Text className="text-[#64748b] text-[14px] leading-[20px] m-0 mt-[4px]">
                    <strong>Doctor:</strong> {doctorName}
                  </Text>
                )}
              </div>

              {/* CTA Button */}
              <div className="text-center mb-[32px]">
                <Button
                  href={portalUrl}
                  className="bg-[#3B82F6] text-[#FFFFFF] px-[32px] py-[16px] rounded-full text-[18px] font-semibold no-underline inline-block box-border"
                >
                  View Appointment
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

TelehealthNotification.PreviewProps = {
  parentName: "Marie",
  childName: "Emma",
  doctorName: "Dr. Sarah Johnson",
  type: "telehealth_confirmed" as const,
  message: "Your telehealth appointment for Emma with Dr. Sarah Johnson on 2026-03-15 at 14:00 has been confirmed.",
  portalUrl: "https://app.pediascrybe.com/portal/telehealth/appointments",
};

export default TelehealthNotification;
