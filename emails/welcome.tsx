import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface PediascrybeWelcomeProps {
  lastname?: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : '';

export const PediascrybeWelcome = ({
  lastname,
}: PediascrybeWelcomeProps) => {
  const previewText = `Welcome to Pediascrybe Dr ${lastname}! We are thrilled to have you on board.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] bg-[#ffffff] rounded my-[40px] mx-auto p-[20px] w-full max-w-[645px]">
            <Section className="mt-[32px]">
              <Link href="https://www.pediascrybe.com">
              <Heading className="text-[#16A349] text-[32px] italic font-normal text-center p-0 my-[30px] mx-0">
                <strong>Pediascrybe</strong>
              </Heading>
              </Link>
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              Dear Dr  {lastname},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Welcome to Pediascrybe! We are thrilled to have you join our community of pediatric professionals committed to enhancing child healthcare through innovative technology. Once you verify your email, click below to login and get started.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#16A349] px-[20px] py-[12px] rounded-full text-white text-[16px] font-semibold no-underline text-center"
                href="https://www.pediascrybe.com/signin"
              >
                Get started
              </Button>
            </Section>
            <Text className="text-black text-[14px] leading-[14px]">
              Warm regards,
            </Text>
            <Text className="text-black text-[14px] italic leading-[24px]">
              <strong>The Pediascrybe Team</strong>
            </Text>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default PediascrybeWelcome;