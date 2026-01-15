import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChartCarouselSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>

        {/* Chart Area */}
        <div className="relative h-[350px] rounded-xl bg-muted/20 overflow-hidden">
          {/* Y-axis labels */}
          <div className="absolute left-3 top-6 bottom-10 flex flex-col justify-between">
            {[160, 120, 80, 40, 0].map((label) => (
              <Skeleton key={label} className="h-3 w-6" />
            ))}
          </div>

          {/* Y-axis line */}
          <div className="absolute left-11 top-4 bottom-8 w-px bg-muted-foreground/30" />

          {/* X-axis line */}
          <div className="absolute left-11 right-4 bottom-8 h-px bg-muted-foreground/30" />

          {/* Chart lines - mimicking percentile curves */}
          <svg
            className="absolute left-12 right-4 top-6 bottom-10 w-[calc(100%-4rem)] h-[calc(100%-4rem)] animate-pulse"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Percentile curves from top to bottom */}
            {[25, 33, 41, 49, 57].map((baseY, i) => (
              <path
                key={i}
                d={`M 0 ${baseY + 25} Q 25 ${baseY + 15}, 50 ${baseY + 8} T 100 ${baseY - 10}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-blue-400/30"
              />
            ))}
          </svg>

          {/* X-axis labels */}
          <div className="absolute left-12 right-4 bottom-2 flex justify-between">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-8" />
            ))}
          </div>
        </div>

        {/* Footer dots */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-2 w-2 rounded-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
