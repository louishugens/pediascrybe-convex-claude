import { Resend } from 'resend';
import { checkBotId } from 'botid/server';
import { publicRateLimit, checkRateLimit, getClientIp } from '@/lib/rate-limit';

const resend = new Resend(process.env.RESEND_API_KEY);

// Sanitize HTML to prevent injection
function sanitize(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export async function POST(req: Request) {
  // Rate limit (public endpoint)
  const ip = await getClientIp();
  const rateLimitResponse = await checkRateLimit(publicRateLimit, ip);
  if (rateLimitResponse) return rateLimitResponse;

  // Bot protection check
  const verification = await checkBotId();
  if (verification.isBot) {
    return new Response(JSON.stringify({ message: 'Access denied' }), { status: 403 });
  }

  const { senderEmail, message, name } = await req.json();

  // Input validation
  if (!senderEmail || typeof senderEmail !== 'string' || senderEmail.length > 254) {
    return new Response(JSON.stringify({ message: 'Invalid email' }), { status: 400 });
  }
  if (!message || typeof message !== 'string' || message.length > 5000) {
    return new Response(JSON.stringify({ message: 'Message too long or missing' }), { status: 400 });
  }
  if (!name || typeof name !== 'string' || name.length > 200) {
    return new Response(JSON.stringify({ message: 'Invalid name' }), { status: 400 });
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(senderEmail)) {
    return new Response(JSON.stringify({ message: 'Invalid email format' }), { status: 400 });
  }

  try {
    await resend.emails.send({
      from: 'Pediascrybe Contact <noreply@email.pediascrybe.com>',
      to: 'louishugens@gmail.com',
      subject: `New Contact Form Submission from ${sanitize(name)}`,
      html: `Message from: ${sanitize(senderEmail)}<br /><br />${sanitize(message)}`,
    });

    return new Response(JSON.stringify({ status: 'Email sent' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Failed to send email' }), { status: 500 });
  }
}
