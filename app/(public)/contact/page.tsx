'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Corrected import
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import BeatLoader from 'react-spinners/BeatLoader';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Toaster, toast } from 'sonner'


const FormSchema = z.object({
  senderEmail: z.string({required_error: "Please add your email"}).email('Invalid email address'),
  message: z.string({required_error: 'Please enter your message'}),
})


const Contact = () => {

  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [color, setColor] = useState('#ffffff');

  const submitMessage = async (data) => {
      setLoading(true);
      const { senderEmail, message } = data;

      const res = await fetch('/api/contact', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ senderEmail, message }),
      });

      if (res.status === 200) {
          setLoading(false);
          toast.success('Message sent successfully. We will get back to you soon.');
          form.reset({ senderEmail: '', message: ''});
      } else {
          setIsSubmitting(false);
          toast.error('Failed to send email. Please try again.');
      }
  };

  const onSubmit = (data) => submitMessage(data);

  const form = useForm({
    resolver: zodResolver(FormSchema),
  });

  return (
    <div className="min-h-screen bg-muted py-16">
      <div className="container px-8 md:px-16 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-8">Contact Us</h1>

        {/* Contact Form */}
        <div className="bg-white p-8 w-full md:w-2/3 rounded-lg shadow-md mb-12 ">
          <h2 className="text-2xl font-semibold mb-4">Send Us a Message</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
              <FormField
                control={form.control}
                name="senderEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="jdoe@gmail.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Type your message here." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-row w-full justify-center">
                <button className="py-2 px-4 rounded-full bg-primary  text-black text-lg font-semibold w-fit center mt-4 mx-auto" type='submit'>
                  {
                    loading
                      ? <BeatLoader color={color} size={10} aria-label="Loading Spinner" data-testid="loader" />
                      : "Send Message"
                  }
                </button>
                {error && <div className='text-red-600 text-xs pt-1 px-4'>{error}</div>}
              </div>
            </form>
          </Form>
          {/* <form>
            <div className="mb-4">
              <input type="text" placeholder="Your Name" className="w-full p-2 rounded border" />
            </div>
            <div className="mb-4">
              <input type="email" placeholder="Your Email" className="w-full p-2 rounded border" />
            </div>
            <div className="mb-4">
              <textarea placeholder="Your Message" rows={4} className="w-full p-2 rounded border"></textarea>
            </div>
            <button type="submit" className="bg-primary text-foreground px-6 py-2 rounded-full">
              Send
            </button>
          </form> */}
        </div>

        {/* Additional Contact Info */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Other Ways to Reach Us</h2>
          <p className="mb-2">Email: <a href="mailto:support@pediascrybe.com" className="text-blue-500">support@pediascrybe.com</a></p>
          {/* <p>Phone: <a href="tel:+11234567890" className="text-blue-500">+1 (123) 456-7890</a></p> */}
        </div>
      </div>
      <Toaster position='top-center' richColors={true} />
    </div>
  );
};

export default Contact;
