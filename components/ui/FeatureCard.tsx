'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface FeatureCardProps {
  title: string;
  subtitle: string;
  description: string;
  features: FeatureItem[];
  illustration: ReactNode;
  bgColor: string;
  delay?: number;
}

export function FeatureCard({
  title,
  subtitle,
  description,
  features,
  illustration,
  bgColor,
  delay = 0,
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-3xl overflow-hidden"
      style={{ background: bgColor }}
    >
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 p-8 lg:p-12">
        {/* Left: Content */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            <h3 className="text-3xl lg:text-4xl font-bold text-white mb-3">
              {title}
            </h3>
            <p className="text-white/80 text-lg font-light leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Description */}
          <p className="text-white/60 leading-relaxed">
            {description}
          </p>

          {/* Feature Grid */}
          <div className="grid sm:grid-cols-2 gap-4 pt-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: delay + 0.1 + index * 0.1 }}
                  className="group p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 hover:border-white/20 transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold text-sm mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-white/60 text-xs leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: Illustration */}
        <div className="flex items-center justify-center lg:justify-end">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: delay + 0.2 }}
            className="w-full max-w-md"
          >
            {illustration}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
