import { Package } from 'lucide-react';
import { motion } from 'framer-motion';

const Logo = ({ 
  size = 'md', 
  showText = true, 
  className = '',
  animated = false 
}) => {
  const sizes = {
    sm: {
      icon: 'h-4 w-4',
      text: 'text-sm',
      container: 'space-x-1'
    },
    md: {
      icon: 'h-6 w-6',
      text: 'text-lg',
      container: 'space-x-2'
    },
    lg: {
      icon: 'h-8 w-8',
      text: 'text-2xl',
      container: 'space-x-3'
    },
    xl: {
      icon: 'h-10 w-10',
      text: 'text-3xl',
      container: 'space-x-4'
    }
  };

  const sizeConfig = sizes[size];

  const LogoContent = () => (
    <div className={`flex items-center ${sizeConfig.container} ${className}`}>
      <div className={`${sizeConfig.icon} bg-gradient-primary rounded-lg flex items-center justify-center`}>
        <Package className="h-3/4 w-3/4 text-white" />
      </div>
      {showText && (
        <span className={`font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent ${sizeConfig.text}`}>
          TrackAS
        </span>
      )}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <LogoContent />
      </motion.div>
    );
  }

  return <LogoContent />;
};

export default Logo;
