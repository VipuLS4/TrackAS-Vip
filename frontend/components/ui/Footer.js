import { motion } from 'framer-motion';
import { Heart, Github, Linkedin, Mail } from 'lucide-react';
import Logo from './Logo';

const Footer = ({ className = '' }) => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: 'GitHub',
      icon: Github,
      href: 'https://github.com/VipuLS4',
      color: 'hover:text-gray-900'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      href: 'https://linkedin.com/in/vipul-sharma',
      color: 'hover:text-blue-600'
    },
    {
      name: 'Email',
      icon: Mail,
      href: 'mailto:vipul@trackas.com',
      color: 'hover:text-red-600'
    }
  ];

  return (
    <footer className={`bg-white/80 backdrop-blur-md border-t border-gray-200 mt-20 ${className}`}>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="text-center md:text-left">
            <Logo size="lg" className="justify-center md:justify-start mb-4" />
            <p className="text-gray-600 mb-4 max-w-md">
              Revolutionizing logistics with AI-powered tracking and management. 
              Built with passion and precision.
            </p>
            <div className="flex items-center justify-center md:justify-start space-x-1 text-sm text-gray-500">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-500 fill-current" />
              <span>by</span>
              <span className="font-semibold text-primary-600">Vipul Sharma</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
            <div className="space-y-2">
              <a href="/company/login" className="block text-gray-600 hover:text-primary-600 transition-colors">
                Company Dashboard
              </a>
              <a href="/driver/login" className="block text-gray-600 hover:text-primary-600 transition-colors">
                Driver Dashboard
              </a>
              <a href="/admin/login" className="block text-gray-600 hover:text-primary-600 transition-colors">
                Admin Panel
              </a>
              <a href="/track" className="block text-gray-600 hover:text-primary-600 transition-colors">
                Track Shipment
              </a>
            </div>
          </div>

          {/* Social Links */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect</h3>
            <div className="flex justify-center md:justify-start space-x-4">
              {socialLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-lg bg-gray-100 text-gray-600 transition-all duration-200 ${link.color} hover:bg-gray-200`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <link.icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <p>For support and inquiries:</p>
              <a 
                href="mailto:support@trackas.com" 
                className="text-primary-600 hover:underline"
              >
                support@trackas.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-400">
            &copy; {currentYear} TrackAS. All rights reserved. | 
            <span className="ml-1">
              Built with ❤️ by <span className="font-semibold text-primary-600">Vipul Sharma</span>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
