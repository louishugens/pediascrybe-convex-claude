'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Scale, Ruler, Activity, Brain, Weight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Route } from 'next';

interface ChartNavItem {
  href: Route;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
}

interface ChartsNavProps {
  patientId: string;
}

const ChartsNav = ({ patientId }: ChartsNavProps) => {
  const pathname = usePathname();
  
  const baseChartPath = `/user/patients/${patientId}/charts`;
  
  const navItems: ChartNavItem[] = [
    { href: baseChartPath as Route, label: 'Weight for Age', shortLabel: 'Weight', icon: Scale },
    { href: `${baseChartPath}/hfa` as Route, label: 'Height for Age', shortLabel: 'Height', icon: Ruler },
    { href: `${baseChartPath}/wfl` as Route, label: 'Weight for Height', shortLabel: 'W/H', icon: Activity },
    { href: `${baseChartPath}/bfa` as Route, label: 'BMI for Age', shortLabel: 'BMI', icon: Weight },
    { href: `${baseChartPath}/hcfa` as Route, label: 'Head Circ. for Age', shortLabel: 'Head', icon: Brain },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="flex flex-wrap items-center gap-2 max-w-full">
      {/* Back button */}
      <Link 
        href={`/user/patients/${patientId}` as Route}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium shrink-0",
          "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
          "border border-border/50 hover:border-border",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        <ArrowLeft className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">Leave</span>
      </Link>

      {/* Divider */}
      <div className="hidden sm:block h-6 w-px bg-border/60 shrink-0" />

      {/* Chart navigation items */}
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap",
              "transition-all duration-200 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              active ? [
                "bg-primary text-primary-foreground",
                "shadow-md shadow-primary/25",
              ] : [
                "bg-muted/30 text-muted-foreground",
                "hover:bg-muted hover:text-foreground",
                "border border-transparent hover:border-border/50",
              ]
            )}
          >
            <Icon className={cn(
              "h-4 w-4 shrink-0",
              active ? "text-primary-foreground" : "text-muted-foreground"
            )} />
            <span className="hidden xl:inline">{item.label}</span>
            <span className="xl:hidden">{item.shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default ChartsNav;
