'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ChartPreview from './chart-preview';

interface ChartData {
  age?: number;
  length?: number;
  '3rd': number | null;
  '15th': number | null;
  '50th': number | null;
  '85th': number | null;
  '97th': number | null;
  [key: string]: number | null | undefined;
}

interface Patient {
  _id: string;
  firstname?: string;
  lastname?: string;
  sex?: string;
  birthdate?: number;
}

interface ChartConfig {
  type: string;
  title: string;
  ylabel: string;
  xlabel: string;
  yUnit: string;
  xUnit: string;
  mesure: string;
  path: string;
}

const chartConfigs: ChartConfig[] = [
  {
    type: 'wfa',
    title: 'Weight for Age',
    ylabel: 'Weight (kg)',
    xlabel: 'Age (days)',
    yUnit: 'kg',
    xUnit: 'days',
    mesure: 'age',
    path: '',
  },
  {
    type: 'hfa',
    title: 'Height for Age',
    ylabel: 'Height (cm)',
    xlabel: 'Age (days)',
    yUnit: 'cm',
    xUnit: 'days',
    mesure: 'age',
    path: '/hfa',
  },
  {
    type: 'wfl',
    title: 'Weight for Length',
    ylabel: 'Weight (kg)',
    xlabel: 'Length (cm)',
    yUnit: 'kg',
    xUnit: 'cm',
    mesure: 'length',
    path: '/wfl',
  },
  {
    type: 'bfa',
    title: 'BMI for Age',
    ylabel: 'BMI (kg/m²)',
    xlabel: 'Age (days)',
    yUnit: 'kg/m²',
    xUnit: 'days',
    mesure: 'age',
    path: '/bfa',
  },
  {
    type: 'hcfa',
    title: 'Head Circumference',
    ylabel: 'Head Circ. (cm)',
    xlabel: 'Age (days)',
    yUnit: 'cm',
    xUnit: 'days',
    mesure: 'age',
    path: '/hcfa',
  },
];

interface AllChartData {
  wfa: ChartData[];
  hfa: ChartData[];
  wfl: ChartData[];
  bfa: ChartData[];
  hcfa: ChartData[];
}

interface ChartCarouselProps {
  patient: Patient;
  patientId: string;
  allChartData: AllChartData;
}

// Inline chart loader component
function ChartLoader() {
  return (
    <div className="relative h-[350px] rounded-xl bg-linear-to-br from-muted/30 via-muted/20 to-muted/10 border border-border/50 overflow-hidden">
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
                            linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* Animated gradient sweep */}
      <motion.div
        className="absolute inset-0 bg-linear-to-r from-transparent via-primary/5 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Chart content */}
      <div className="relative flex flex-col items-center justify-center h-full px-8">
        {/* Animated wave chart visualization */}
        <div className="flex items-end justify-center gap-[3px] h-32 w-full max-w-sm">
          {Array.from({ length: 24 }).map((_, i) => {
            const baseHeight = 30 + Math.sin(i * 0.5) * 25 + 15;
            return (
              <motion.div
                key={i}
                className="flex-1 rounded-t-sm bg-linear-to-t from-primary/30 to-primary/10"
                initial={{ height: 0, opacity: 0 }}
                animate={{ 
                  height: `${baseHeight}%`,
                  opacity: 1,
                }}
                transition={{
                  height: {
                    duration: 1.5,
                    delay: i * 0.03,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut',
                  },
                  opacity: {
                    duration: 0.4,
                    delay: i * 0.03,
                  },
                }}
              />
            );
          })}
        </div>

        {/* Loading text */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-primary/60"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-primary/60"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-primary/60"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
            />
          </div>
          <p className="text-sm text-muted-foreground/70 font-medium">
            Loading chart
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ChartCarousel({ patient, patientId, allChartData }: ChartCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPending, startTransition] = useTransition();

  const currentChart = chartConfigs[currentIndex];

  const goToNext = () => {
    setDirection(1);
    startTransition(() => {
      setCurrentIndex((prev) => (prev + 1) % chartConfigs.length);
    });
  };

  const goToPrev = () => {
    setDirection(-1);
    startTransition(() => {
      setCurrentIndex((prev) => (prev - 1 + chartConfigs.length) % chartConfigs.length);
    });
  };

  const goToIndex = (index: number) => {
    if (index === currentIndex) return;
    setDirection(index > currentIndex ? 1 : -1);
    startTransition(() => {
      setCurrentIndex(index);
    });
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  // Get the current chart's data
  const currentChartData = allChartData[currentChart.type as keyof AllChartData] || [];
  const showRealChart = currentChartData && currentChartData.length > 0;

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Card>
          <CardContent className="pt-4">
            {/* Header with Navigation */}
            <div className="flex items-center justify-between mb-2">
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: 'var(--muted)' }}
                whileTap={{ scale: 0.9 }}
                onClick={goToPrev}
                className="p-2 rounded-full transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </motion.button>

              <div className="flex-1 text-center">
                <AnimatePresence mode="wait">
                  <motion.h3
                    key={currentChart.type}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="font-semibold text-foreground"
                  >
                    {currentChart.title}
                  </motion.h3>
                </AnimatePresence>
              </div>

              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: 'var(--muted)' }}
                whileTap={{ scale: 0.9 }}
                onClick={goToNext}
                className="p-2 rounded-full transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </motion.button>
            </div>

            {/* Chart Content */}
            <div className="relative min-h-[350px] overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                {isPending ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="w-full"
                  >
                    <ChartLoader />
                  </motion.div>
                ) : (
                  <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: 'spring', stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 },
                    }}
                    className="w-full"
                  >
                    {showRealChart ? (
                      <ChartPreview
                        type={currentChart.type}
                        title={currentChart.title}
                        ylabel={currentChart.ylabel}
                        xlabel={currentChart.xlabel}
                        name={patient.firstname ?? 'patient'}
                        data={currentChartData}
                        mesure={currentChart.mesure}
                        xUnit={currentChart.xUnit}
                        yUnit={currentChart.yUnit}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[350px] px-8 text-center rounded-xl bg-linear-to-br from-muted/30 via-muted/20 to-muted/10 border border-border/50">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                          <span className="text-2xl">📊</span>
                        </div>
                        <h4 className="font-medium text-foreground mb-2">{currentChart.title}</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          No data available for this chart type yet.
                        </p>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/user/patients/${patientId}/charts${currentChart.path}`}>
                            View Full Chart
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dot Indicators and View All */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                {chartConfigs.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => goToIndex(index)}
                    className="relative p-1"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <motion.div
                      className="w-2 h-2 rounded-full bg-muted-foreground/30"
                      animate={{
                        scale: currentIndex === index ? 1.3 : 1,
                        backgroundColor: currentIndex === index ? 'var(--primary)' : 'var(--muted-foreground)',
                        opacity: currentIndex === index ? 1 : 0.3,
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    />
                  </motion.button>
                ))}
              </div>
              
              <Button asChild variant="outline" size="sm">
                <Link href={`/user/patients/${patientId}/charts`}>
                  View All Charts
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
  );
}
