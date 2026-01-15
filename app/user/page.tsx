import AgeDistributionContainer from "@/components/dashboard/charts/AgeDistributionContainer";
import GenderDistributionContainer from "@/components/dashboard/charts/GenderDistributionContainer";
import ImmunizationStatusContainer from "@/components/dashboard/charts/ImmunizationStatusContainer";
import CommonConditionsContainer from "@/components/dashboard/charts/CommonConditionsContainer";
import DailyRevenueContainer from "@/components/dashboard/charts/DailyRevenueContainer";
import Greeter from "@/components/greeter";
import TotalPatientStat from "@/components/dashboard/stats/totalPatientStat";
import TotalConsultationStat from "@/components/dashboard/stats/totalConsultationStat";
import RecentConsultationStat from "@/components/dashboard/stats/recentConsultationStat";
import TodayRevenueStat from "@/components/dashboard/stats/todayRevenueStat";
import MonthlyRevenueStat from "@/components/dashboard/stats/monthlyRevenueStat";
import TodayPatientsStat from "@/components/dashboard/stats/todayPatientsStat";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Receipt } from "lucide-react";

export default async function Page() {

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Greeter />
          <p className="text-sm text-muted-foreground mt-2">Welcome to your dashboard</p>
        </div>
        <Link href="/user/transactions">
          <Button variant="default" className="gap-2 rounded-full">
            <Receipt className="h-4 w-4" />
            View Transactions
          </Button>
        </Link>
      </div> 
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <TodayRevenueStat />
        <MonthlyRevenueStat />
        <TodayPatientsStat />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
        <TotalPatientStat />
        <TotalConsultationStat />
        <RecentConsultationStat />
      </div>
      <div className="mt-4">
        <DailyRevenueContainer />
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mt-4">
        <AgeDistributionContainer />
        <GenderDistributionContainer />
        <ImmunizationStatusContainer />
        <CommonConditionsContainer />
      </div>
    </div>
  );
}
