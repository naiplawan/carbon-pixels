'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home, BookOpen, Plus, History, Calculator, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

interface BreadcrumbItem {
  label: string;
  labelTh: string;
  href: string;
  icon?: React.ElementType;
}

// Define route mappings with Thai translations
const routeMap: Record<string, BreadcrumbItem> = {
  '/': {
    label: 'Home',
    labelTh: 'หน้าแรก',
    href: '/',
    icon: Home
  },
  '/diary': {
    label: 'Waste Diary',
    labelTh: 'ไดอารี่ขยะ',
    href: '/diary',
    icon: BookOpen
  },
  '/diary/manual': {
    label: 'Manual Entry',
    labelTh: 'เพิ่มข้อมูลเอง',
    href: '/diary/manual',
    icon: Plus
  },
  '/diary/history': {
    label: 'History',
    labelTh: 'ประวัติ',
    href: '/diary/history',
    icon: History
  },
  '/calculator': {
    label: 'Carbon Calculator',
    labelTh: 'คำนวณคาร์บอน',
    href: '/calculator',
    icon: Calculator
  },
  '/settings': {
    label: 'Settings',
    labelTh: 'ตั้งค่า',
    href: '/settings',
    icon: Settings
  }
};

interface BreadcrumbsProps {
  className?: string;
  showIcons?: boolean;
  language?: 'en' | 'th' | 'both';
  maxItems?: number;
}

export function Breadcrumbs({ 
  className = '',
  showIcons = true,
  language = 'both',
  maxItems = 5
}: BreadcrumbsProps) {
  const pathname = usePathname();

  // Generate breadcrumb items from current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (pathname === '/') return [];

    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with home
    breadcrumbs.push(routeMap['/']);

    // Build path incrementally
    let currentPath = '';
    for (const segment of pathSegments) {
      currentPath += `/${segment}`;
      
      if (routeMap[currentPath]) {
        breadcrumbs.push(routeMap[currentPath]);
      } else {
        // Handle dynamic routes or unknown paths
        breadcrumbs.push({
          label: segment.charAt(0).toUpperCase() + segment.slice(1),
          labelTh: segment,
          href: currentPath,
          icon: undefined
        });
      }
    }

    // Limit number of items if specified
    if (breadcrumbs.length > maxItems) {
      return [
        breadcrumbs[0], // Always keep home
        {
          label: '...',
          labelTh: '...',
          href: '#',
          icon: undefined
        },
        ...breadcrumbs.slice(-2) // Keep last 2 items
      ];
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs on home page
  }

  const getLabel = (item: BreadcrumbItem): string => {
    switch (language) {
      case 'th':
        return item.labelTh;
      case 'en':
        return item.label;
      case 'both':
      default:
        return `${item.label} / ${item.labelTh}`;
    }
  };

  return (
    <nav 
      aria-label="Breadcrumb navigation"
      className={`mb-4 ${className}`}
    >
      <ol className="flex items-center space-x-1 text-sm">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex items-center">
              {index > 0 && (
                <ChevronRight 
                  className="w-3 h-3 text-gray-400 mx-1 flex-shrink-0" 
                  aria-hidden="true"
                />
              )}
              
              {isLast ? (
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="flex items-center text-green-700 font-medium"
                  aria-current="page"
                >
                  {showIcons && Icon && (
                    <Icon className="w-4 h-4 mr-1 flex-shrink-0" />
                  )}
                  <span className="truncate max-w-32 sm:max-w-none">
                    {getLabel(item)}
                  </span>
                </motion.span>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  {item.href === '#' ? (
                    <span className="flex items-center text-gray-500">
                      {getLabel(item)}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className="flex items-center text-gray-600 hover:text-green-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 rounded px-1 py-0.5"
                    >
                      {showIcons && Icon && (
                        <Icon className="w-4 h-4 mr-1 flex-shrink-0" />
                      )}
                      <span className="truncate max-w-24 sm:max-w-none hover:underline">
                        {getLabel(item)}
                      </span>
                    </Link>
                  )}
                </motion.div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile-friendly simplified version */}
      <div className="sm:hidden mt-2">
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
          <Link
            href="/diary"
            className="flex items-center text-green-600 hover:text-green-700 transition-colors"
          >
            <Home className="w-4 h-4 mr-1" />
            <span className="text-sm">Back to Diary</span>
          </Link>
          
          <div className="text-xs text-gray-500">
            {breadcrumbs.length - 1} level{breadcrumbs.length > 2 ? 's' : ''} deep
          </div>
        </div>
      </div>
    </nav>
  );
}

// Specialized breadcrumb for specific sections
export function WasteDiaryBreadcrumbs() {
  const pathname = usePathname();
  
  const getDiaryPageTitle = () => {
    switch (pathname) {
      case '/diary/manual':
        return { en: 'Manual Entry', th: 'เพิ่มข้อมูลเอง', icon: Plus };
      case '/diary/history':
        return { en: 'History', th: 'ประวัติ', icon: History };
      case '/diary':
      default:
        return { en: 'Dashboard', th: 'แดชบอร์ด', icon: BookOpen };
    }
  };

  const pageInfo = getDiaryPageTitle();

  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-dashed border-gray-200">
      <Breadcrumbs showIcons={true} language="both" />
      
      <div className="hidden sm:flex items-center bg-green-50 px-3 py-1.5 rounded-full">
        <pageInfo.icon className="w-4 h-4 text-green-600 mr-2" />
        <span className="text-sm font-medium text-green-800">
          {pageInfo.en} / {pageInfo.th}
        </span>
      </div>
    </div>
  );
}

// Context provider for breadcrumb customization
interface BreadcrumbContextType {
  addCustomBreadcrumb: (item: BreadcrumbItem) => void;
  removeCustomBreadcrumb: (href: string) => void;
}

const BreadcrumbContext = React.createContext<BreadcrumbContextType | null>(null);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [customBreadcrumbs, setCustomBreadcrumbs] = React.useState<Record<string, BreadcrumbItem>>({});

  const addCustomBreadcrumb = React.useCallback((item: BreadcrumbItem) => {
    setCustomBreadcrumbs(prev => ({
      ...prev,
      [item.href]: item
    }));
  }, []);

  const removeCustomBreadcrumb = React.useCallback((href: string) => {
    setCustomBreadcrumbs(prev => {
      const { [href]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  // Update global route map with custom breadcrumbs
  React.useEffect(() => {
    Object.assign(routeMap, customBreadcrumbs);
  }, [customBreadcrumbs]);

  return (
    <BreadcrumbContext.Provider value={{ addCustomBreadcrumb, removeCustomBreadcrumb }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbs() {
  const context = React.useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumbs must be used within a BreadcrumbProvider');
  }
  return context;
}

// Schema.org structured data for breadcrumbs (SEO)
export function BreadcrumbSchema() {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbsForSchema(pathname);

  if (breadcrumbs.length <= 1) return null;

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: `https://carbon-pixels.vercel.app${item.href}`
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}

function generateBreadcrumbsForSchema(pathname: string): BreadcrumbItem[] {
  if (pathname === '/') return [];

  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [routeMap['/']];

  let currentPath = '';
  for (const segment of pathSegments) {
    currentPath += `/${segment}`;
    if (routeMap[currentPath]) {
      breadcrumbs.push(routeMap[currentPath]);
    }
  }

  return breadcrumbs;
}