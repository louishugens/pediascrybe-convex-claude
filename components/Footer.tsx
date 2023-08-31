'use client'
import { Home, Wrench, DollarSign, Mail, Phone, Facebook, Twitter, Linkedin } from 'lucide-react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-white text-foreground py-8">
      <div className="container mx-auto px-8 md:px-16">
        <div className="flex flex-wrap justify-between items-start">
          {/* Logo and Description */}
          <div className="w-full mb-8 md:mb-16 text-center">
            <h1 className="text-4xl font-bold mb-4 text-primary italic">Pediascrybe</h1>
            <p>Transforming pediatric care with advanced AI integration.</p>
          </div>

          {/* Quick Links */}
          <div className="w-full md:w-1/4 mb-8 md:mb-0">
            <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
            <ul>
              <li className="mb-2 flex text-muted-foreground items-center"><Home size={18} className="mr-2" /> <Link href="/">Home</Link></li>
              {/* <li className="mb-2 flex text-muted-foreground items-center"><Wrench size={18} className="mr-2" /> <Link href="/features">Features</Link></li> */}
              <li className="mb-2 flex text-muted-foreground items-center"><DollarSign size={18} className="mr-2" /> <Link href="/pricing">Pricing</Link></li>
              <li className="mb-2 flex text-muted-foreground items-center"><Mail size={18} className="mr-2" /> <Link href="/contact">Contact</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="w-full md:w-1/4 mb-8 md:mb-0">
            <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
            <p className='text-muted-foreground'><Mail size={18} className="mr-2 inline" /> Email: support@pediascrybe.com</p>
            {/* <p><Phone size={18} className="mr-2 inline" /> Phone: +1 (123) 456-7890</p> */}
          </div>

          {/* Social Media */}
          <div className="w-full md:w-1/4">
            <h2 className="text-xl font-semibold mb-4">Follow Us</h2>
            <div className="flex space-x-4">
              <a href="#" className="text-2xl text-muted-foreground"><Facebook size={24} /></a>
              <a href="#" className="text-2xl text-muted-foreground"><Twitter size={24} /></a>
              <a href="#" className="text-2xl text-muted-foreground"><Linkedin size={24} /></a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-2 text-center border-t">
          <p>&copy; {new Date().getFullYear()} Pediascrybe. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
