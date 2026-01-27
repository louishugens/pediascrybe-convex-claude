import { Resend } from 'resend';
import { checkBotId } from 'botid/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ message: 'Only POST requests allowed' }), { status: 405 });
    }

    // Bot protection check
    const verification = await checkBotId();
    if (verification.isBot) {
        return new Response(JSON.stringify({ message: 'Access denied' }), { status: 403 });
    }

    const { senderEmail, message, name } = await req.json();
  

    try {
        await resend.emails.send({
            from: 'Pediascrybe Contact <noreply@email.pediascrybe.com>',
            to: 'louishugens@gmail.com', // Replace with your support email address
            subject: `New Contact Form Submission from ${name}`,
            html: `Message from: ${senderEmail}<br /><br />${message}`,
        });

        return new Response(JSON.stringify({ status: 'Email sent' }), { status: 200 });
    } catch (error) {
        console.error('Failed to send email:', error);
        return new Response(JSON.stringify({ message: 'Failed to send email', error }), { status: 500 });
    }
};

