import { useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Search, Truck, Shield, Zap, ArrowRight, Package, MapPin, Clock } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent } from '../components/ui/Card';
import Header from '../components/ui/Header';
import Footer from '../components/ui/Footer';

export default function Home() {
  const [trackingId, setTrackingId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleTrack = async (e) => {
    e.preventDefault();
    if (trackingId.trim()) {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push(`/track/${trackingId.trim()}`);
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Truck className="h-6 w-6" />,
      title: "Real-time Tracking",
      description: "Track your shipments in real-time with live location updates and status notifications."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure Delivery",
      description: "Secure escrow payments and proof of delivery for every shipment with digital signatures."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Fast & Reliable",
      description: "Optimized routes and reliable drivers for faster deliveries with 99.9% success rate."
    }
  ];

  const stats = [
    { label: "Active Shipments", value: "10,000+" },
    { label: "Happy Customers", value: "50,000+" },
    { label: "Cities Covered", value: "500+" },
    { label: "Success Rate", value: "99.9%" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <Header />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
            Track Your Shipments
            <span className="block bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Like Never Before
            </span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 sm:text-xl">
            Real-time tracking, secure delivery, and seamless logistics management powered by AI
          </p>
        </motion.div>

        {/* Tracking Form */}
        <motion.div 
          className="mt-12 max-w-lg mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="p-8 shadow-medium">
            <form onSubmit={handleTrack} className="space-y-6">
              <div>
                <Input
                  id="trackingId"
                  name="trackingId"
                  type="text"
                  required
                  placeholder="Enter your tracking ID"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  leftIcon={<Search className="h-5 w-5 text-gray-400" />}
                  className="text-center text-lg"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={isLoading}
                disabled={!trackingId.trim()}
              >
                {isLoading ? 'Tracking...' : 'Track Shipment'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-primary-600 sm:text-4xl">
                {stat.value}
              </div>
              <div className="mt-2 text-sm font-medium text-gray-600">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Features */}
        <motion.div 
          className="mt-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Why Choose TrackAS?
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the future of logistics with our cutting-edge technology and customer-first approach
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
              >
                <Card className="h-full text-center p-8 hover:shadow-strong transition-all duration-300 group-hover:scale-105">
                  <CardContent>
                    <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-primary text-white mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Demo Links */}
        <motion.div 
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Get Started Today
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Choose your role and access the powerful TrackAS platform
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
            <motion.a
              href="/company/login"
              className="group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card className="p-8 text-center hover:shadow-strong transition-all duration-300 group-hover:border-primary-300">
                <CardContent>
                  <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
                    <Package className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Company Dashboard
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Manage shipments, track deliveries, and handle payments
                  </p>
                  <Button variant="outline" className="w-full">
                    Access Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.a>
            
            <motion.a
              href="/driver/login"
              className="group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card className="p-8 text-center hover:shadow-strong transition-all duration-300 group-hover:border-primary-300">
                <CardContent>
                  <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
                    <Truck className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Driver Dashboard
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Accept jobs, update status, and manage deliveries
                  </p>
                  <Button variant="outline" className="w-full border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white">
                    Access Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.a>
            
            <motion.a
              href="/admin/login"
              className="group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card className="p-8 text-center hover:shadow-strong transition-all duration-300 group-hover:border-accent-300">
                <CardContent>
                  <div className="w-16 h-16 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-accent-200 transition-colors">
                    <Shield className="h-8 w-8 text-accent-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Admin Panel
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Oversee operations, manage users, and view analytics
                  </p>
                  <Button variant="outline" className="w-full border-accent-600 text-accent-600 hover:bg-accent-600 hover:text-white">
                    Access Panel
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.a>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
