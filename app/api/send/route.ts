import PediascrybeWelcome from '@/convex/emails/welcome';
import { isAuthenticated } from '@/lib/auth-server';
import { emailRateLimit, checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit
  const ip = await getClientIp();
  const rateLimitResponse = await checkRateLimit(emailRateLimit, ip);
  if (rateLimitResponse) return rateLimitResponse;

  const { userName, email } = await req.json();
  try {
    const data = await resend.emails.send({
      from: 'Pediascrybe <info@email.pediascrybe.com>',
      to: [email],
      bcc: ['louishugens@gmail.com'],
      subject: 'Welcome to Pediascrybe - Transforming Pediatric Care!',
      react: PediascrybeWelcome({ userName: userName }),
      });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error });
  }
}
