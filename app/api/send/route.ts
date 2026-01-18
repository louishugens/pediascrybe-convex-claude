import PediascrybeWelcome from '../../../emails/welcome';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { lastname, email } = await req.json();
  try {
    const data = await resend.emails.send({
      from: 'Pediascrybe <info@email.pediascrybe.com>',
      to: [email],
      bcc: ['louishugens@gmail.com'],
      subject: 'Welcome to Pediascrybe - Transforming Pediatric Care!',
      react: PediascrybeWelcome({ lastname }),
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error });
  }
}
