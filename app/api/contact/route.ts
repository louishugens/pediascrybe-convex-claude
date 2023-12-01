import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ message: 'Only POST requests allowed' }), { status: 405 });
    }

    const { senderEmail, message } = await req.json();;
    console.log("senderEmail, message>>",senderEmail, message)

    try {
        await resend.emails.send({
            from: 'noreply@pediascrybe.com', // Replace with your sender email address
            to: 'louishugens@gmail.com', // Replace with your support email address
            subject: 'New Contact Form Submission',
            html: `Message from: ${senderEmail}<br /><br />${message}`,
        });

        return new Response(JSON.stringify({ status: 'Email sent' }), { status: 200 });
    } catch (error) {
        console.error('Failed to send email:', error);
        return new Response(JSON.stringify({ message: 'Failed to send email', error }), { status: 500 });
    }
};

