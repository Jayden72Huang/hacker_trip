'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

type MenuItem = {
  title: string;
  href: string;
  description?: string;
  icon?: React.ReactNode;
};

type NavDropdownProps = {
  label: string;
  items: MenuItem[];
};

/**
 * 导航下拉菜单组件
 * 鼠标悬停时展开，离开时收起
 */
export function NavDropdown({ label, items }: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="flex items-center gap-1 font-space-mono text-sm text-gray-400 hover:text-white transition-colors">
        {label}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-[#0d0e14]/95 border border-white/10 overflow-hidden shadow-2xl z-50 backdrop-blur-xl"
          >
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-5 py-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
              >
                <div className="flex items-start gap-3">
                  {item.icon && (
                    <div className="mt-0.5 text-purple-400">
                      {item.icon}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-white mb-1">
                      {item.title}
                    </div>
                    {item.description && (
                      <div className="text-xs text-gray-500">
                        {item.description}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
