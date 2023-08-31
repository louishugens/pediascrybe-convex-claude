// pages/contact.js
import Link from 'next/link';

const Contact = () => {
  return (
    <div className="min-h-screen bg-muted py-16">
      <div className="container px-8 md:px-16 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-8">Contact Us</h1>

        {/* Contact Form */}
        <div className="bg-white p-8 w-full md:w-2/3 rounded-lg shadow-md mb-12 ">
          <h2 className="text-2xl font-semibold mb-4">Send Us a Message</h2>
          <form>
            <div className="mb-4">
              <input type="text" placeholder="Your Name" className="w-full p-2 rounded border" />
            </div>
            <div className="mb-4">
              <input type="email" placeholder="Your Email" className="w-full p-2 rounded border" />
            </div>
            <div className="mb-4">
              <textarea placeholder="Your Message" rows={4} className="w-full p-2 rounded border"></textarea>
            </div>
            <button type="submit" className="bg-primary text-white px-6 py-2 rounded-full">
              Send
            </button>
          </form>
        </div>

        {/* Additional Contact Info */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Other Ways to Reach Us</h2>
          <p className="mb-2">Email: <a href="mailto:support@pediascrybe.com" className="text-blue-500">support@pediascrybe.com</a></p>
          {/* <p>Phone: <a href="tel:+11234567890" className="text-blue-500">+1 (123) 456-7890</a></p> */}
        </div>
      </div>
    </div>
  );
};

export default Contact;
