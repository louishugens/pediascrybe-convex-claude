import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChartLoading() {
  return (
    <div className="p-4">
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row justify-between items-center pb-2">
          <div className="space-y-2">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-24 rounded-full" />
        </CardHeader>

        <CardContent>
          {/* Chart Area */}
          <div className="relative h-[400px] rounded-xl bg-muted/20 overflow-hidden">
            {/* Y-axis labels */}
            <div className="absolute left-3 top-6 bottom-12 flex flex-col justify-between">
              {[160, 120, 80, 40, 0].map((label) => (
                <Skeleton key={label} className="h-3 w-8" />
              ))}
            </div>

            {/* Y-axis line */}
            <div className="absolute left-13 top-4 bottom-10 w-px bg-muted-foreground/30" />

            {/* X-axis line */}
            <div className="absolute left-13 right-6 bottom-10 h-px bg-muted-foreground/30" />

            {/* Chart lines - mimicking percentile curves */}
            <svg
              className="absolute left-14 right-6 top-6 bottom-12 w-[calc(100%-5rem)] h-[calc(100%-4.5rem)] animate-pulse"
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
            <div className="absolute left-14 right-6 bottom-2 flex justify-between">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-10" />
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-sm" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
