/**
 * Medical Chat Tools
 *
 * Durable tools for the medical chat workflow.
 * Each tool is marked with "use step" for automatic retries and observability.
 *
 * Tools:
 * - selectGrowthChart: Present chart selection UI to the user
 * - displayGrowthChart: Display a specific growth chart with patient data
 */

import { tool } from "ai";
import { z } from "zod";
import { differenceInDays } from "date-fns";

// Chart type definitions
const CHART_TYPES = [
  'wfa', 'hfa', 'hfa5To19', 'bfa', 'bfa5To19', 'hcfa', 'wfl', 'wfl0To2'
] as const;

type ChartType = typeof CHART_TYPES[number];

// Chart titles mapping
const CHART_TITLES: Record<ChartType, string> = {
  wfa: 'Weight for Age (0-5 years)',
  hfa: 'Height for Age (0-5 years)',
  hfa5To19: 'Height for Age (5-19 years)',
  bfa: 'BMI for Age (0-5 years)',
  bfa5To19: 'BMI for Age (5-19 years)',
  hcfa: 'Head Circumference for Age (0-5 years)',
  wfl: 'Weight for Length (2-5 years)',
  wfl0To2: 'Weight for Length (0-2 years)',
};

/**
 * Tool to select and present growth chart options.
 * This is the default path for growth visualization.
 *
 * Marked with "use step" for:
 * - Automatic retries on failures
 * - Discrete step in observability
 * - Separate worker execution
 */
async function selectGrowthChartTool({
  context,
  showOptions,
  patientData,
}: {
  context: string;
  showOptions: boolean;
  patientData: {
    appointments: any[];
    birthdate?: number;
  };
}) {
  "use step";

  console.log('[selectGrowthChart] Tool called:', {
    context,
    showOptions,
    hasAppointments: !!patientData.appointments?.length,
    hasBirthdate: !!patientData.birthdate,
  });

  const appointments = patientData.appointments || [];

  // Analyze available patient data
  const availableData = {
    hasWeight: appointments.some((apt: any) => apt.weight != null),
    hasHeight: appointments.some((apt: any) => apt.height != null),
    hasHeadCircumference: appointments.some((apt: any) => apt.head != null),
    appointmentCount: appointments.length,
  };

  // Calculate patient age
  const ageInDays = patientData.birthdate
    ? differenceInDays(new Date(), patientData.birthdate)
    : 0;
  const ageInYears = Math.floor(ageInDays / 365.25);

  // Build available charts list
  const availableCharts: Array<{
    type: ChartType;
    title: string;
    description: string;
    recommended: boolean;
  }> = [];

  if (availableData.hasWeight) {
    availableCharts.push({
      type: 'wfa',
      title: CHART_TITLES.wfa,
      description: `Track weight development over time (${appointments.filter((apt: any) => apt.weight).length} weight measurements available)`,
      recommended: context.toLowerCase().includes('weight') || context.toLowerCase().includes('growth'),
    });
  }

  if (availableData.hasHeight) {
    if (ageInYears <= 5) {
      availableCharts.push({
        type: 'hfa',
        title: CHART_TITLES.hfa,
        description: `Track height development over time (${appointments.filter((apt: any) => apt.height).length} height measurements available)`,
        recommended: context.toLowerCase().includes('height') || context.toLowerCase().includes('tall'),
      });
    }
    if (ageInYears >= 2) {
      availableCharts.push({
        type: 'hfa5To19',
        title: CHART_TITLES.hfa5To19,
        description: `Track height development for older children (${appointments.filter((apt: any) => apt.height).length} height measurements available)`,
        recommended: context.toLowerCase().includes('height') && ageInYears > 5,
      });
    }
  }

  if (availableData.hasWeight && availableData.hasHeight) {
    if (ageInYears <= 5) {
      availableCharts.push({
        type: 'bfa',
        title: CHART_TITLES.bfa,
        description: `Track BMI development over time (${appointments.filter((apt: any) => apt.weight && apt.height).length} BMI calculations possible)`,
        recommended: context.toLowerCase().includes('bmi') || context.toLowerCase().includes('weight'),
      });
    }
    if (ageInYears >= 2) {
      availableCharts.push({
        type: 'bfa5To19',
        title: CHART_TITLES.bfa5To19,
        description: `Track BMI development for older children (${appointments.filter((apt: any) => apt.weight && apt.height).length} BMI calculations possible)`,
        recommended: context.toLowerCase().includes('bmi') && ageInYears > 5,
      });
    }

    // Weight for Length charts
    if (ageInYears <= 2) {
      availableCharts.push({
        type: 'wfl0To2',
        title: CHART_TITLES.wfl0To2,
        description: `Compare weight to length for infants and toddlers`,
        recommended: context.toLowerCase().includes('length') && ageInYears <= 2,
      });
    }
    if (ageInYears >= 2 && ageInYears <= 5) {
      availableCharts.push({
        type: 'wfl',
        title: CHART_TITLES.wfl,
        description: `Compare weight to length for young children`,
        recommended: context.toLowerCase().includes('length') && ageInYears > 2,
      });
    }
  }

  if (availableData.hasHeadCircumference && ageInYears <= 5) {
    availableCharts.push({
      type: 'hcfa',
      title: CHART_TITLES.hcfa,
      description: `Track head growth over time (${appointments.filter((apt: any) => apt.head).length} head circumference measurements available)`,
      recommended: context.toLowerCase().includes('head') || context.toLowerCase().includes('circumference'),
    });
  }

  const recommendedCharts = availableCharts.filter((chart) => chart.recommended);

  const result = {
    type: 'chartSelector' as const,
    patientAge: ageInYears,
    availableData,
    availableCharts,
    recommendedCharts,
    showOptions,
    context,
    message: showOptions
      ? "Here are the available growth charts for this patient. Which would you like to see?"
      : recommendedCharts.length > 0
        ? `Based on your request, I recommend the ${recommendedCharts[0].title}.`
        : "Let me show you the available growth charts for this patient.",
  };

  console.log('[selectGrowthChart] Returning:', {
    patientAge: ageInYears,
    availableChartsCount: availableCharts.length,
    recommendedChartsCount: recommendedCharts.length,
    availableChartTypes: availableCharts.map(c => c.type),
  });

  console.log('[selectGrowthChart] Full result object:', JSON.stringify(result, null, 2));

  return result;
}

/**
 * Tool to display a specific growth chart.
 *
 * Marked with "use step" for durability.
 */
async function displayGrowthChartTool({
  chartType,
  patientData,
}: {
  chartType: ChartType;
  patientData: {
    appointments: any[];
    birthdate?: number;
    sex?: string;
  };
}) {
  "use step";

  // Fetch WHO reference data for this chart type
  let referenceData = null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/charts/reference?chartId=${chartType}`);
    if (response.ok) {
      referenceData = await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch WHO reference data:', error);
  }

  const appointments = patientData.appointments || [];
  const patientBirthdate = patientData.birthdate;

  let patientDataPoints: any[] = [];
  let yLabel = '';
  let xLabel = '';
  let unit = '';

  switch (chartType) {
    case 'wfa': {
      patientDataPoints = appointments
        .map((appointment: any) => ({
          age: differenceInDays(appointment.startDate, patientBirthdate ?? new Date().getTime()),
          value: appointment.weight,
        }))
        .filter((item: any) => item.value != null);
      yLabel = 'Weight';
      xLabel = 'Age';
      unit = 'kg';
      break;
    }

    case 'hfa':
    case 'hfa5To19': {
      patientDataPoints = appointments
        .map((appointment: any) => ({
          age: chartType === 'hfa5To19'
            ? Math.floor(differenceInDays(appointment.startDate, patientBirthdate ?? new Date().getTime()) / 30.44)
            : differenceInDays(appointment.startDate, patientBirthdate ?? new Date().getTime()),
          value: appointment.height,
        }))
        .filter((item: any) => item.value != null);
      yLabel = 'Height';
      xLabel = 'Age';
      unit = 'cm';
      break;
    }

    case 'bfa':
    case 'bfa5To19': {
      patientDataPoints = appointments
        .map((appointment: any) => {
          if (appointment.weight && appointment.height) {
            const heightInM = appointment.height / 100;
            const bmi = appointment.weight / (heightInM * heightInM);
            return {
              age: chartType === 'bfa5To19'
                ? Math.floor(differenceInDays(appointment.startDate, patientBirthdate ?? new Date().getTime()) / 30.44)
                : differenceInDays(appointment.startDate, patientBirthdate ?? new Date().getTime()),
              value: Math.round(bmi * 100) / 100,
            };
          }
          return null;
        })
        .filter((item: any): item is { age: number; value: number } => item !== null);
      yLabel = 'BMI';
      xLabel = 'Age';
      unit = 'kg/m²';
      break;
    }

    case 'hcfa': {
      patientDataPoints = appointments
        .map((appointment: any) => ({
          age: differenceInDays(appointment.startDate, patientBirthdate ?? new Date().getTime()),
          value: appointment.head,
        }))
        .filter((item: any) => item.value != null);
      yLabel = 'Head Circumference';
      xLabel = 'Age';
      unit = 'cm';
      break;
    }

    case 'wfl':
    case 'wfl0To2': {
      patientDataPoints = appointments
        .map((appointment: any) => {
          if (appointment.weight && appointment.height) {
            return {
              length: appointment.height,
              value: appointment.weight,
            };
          }
          return null;
        })
        .filter((item: any): item is { length: number; value: number } => item !== null);
      yLabel = 'Weight';
      xLabel = 'Length';
      unit = 'kg';
      break;
    }
  }

  return {
    type: 'growthChart' as const,
    chartType,
    patientSex: patientData.sex ?? null,
    patientLabel: 'Patient',
    patientBirthdate,
    growthData: patientDataPoints,
    referenceData, // WHO reference data (percentiles)
    yLabel,
    xLabel,
    unit,
    title: CHART_TITLES[chartType],
    dataPoints: patientDataPoints.length,
  };
}

/**
 * Medical tools for the chat agent.
 *
 * These tools are called by the DurableAgent during chat conversations.
 * Each tool execution is durable and automatically retries on failures.
 */
export function createMedicalTools(patientData: {
  appointments: any[];
  birthdate?: number;
  sex?: string;
}) {
  return {
    selectGrowthChart: tool({
      description: `Show growth chart options to the user. Call this when the user asks to see growth charts, percentiles, or growth data without specifying a particular chart type. This presents available chart options based on patient data (age, available measurements). Use context to understand what the user is asking about (e.g., "weight", "height", "BMI", "growth").`,
      inputSchema: z.object({
        context: z.string().describe('What the user is asking about - their question or request about growth/charts'),
        showOptions: z.boolean().default(true).describe('Whether to show chart selection UI (default true)'),
      }),
      execute: async ({ context, showOptions }) => {
        return selectGrowthChartTool({ context, showOptions, patientData });
      },
    }),

    displayGrowthChart: tool({
      description: `Display a specific growth chart with patient measurements and WHO reference percentiles. Call this when the user asks for a specific chart type (WFA, HFA, BFA, etc.) or after they select from chart options. Available types: wfa (weight-age), hfa (height-age 0-5), hfa5To19 (height-age 5-19), bfa (BMI-age 0-5), bfa5To19 (BMI-age 5-19), hcfa (head circumference-age), wfl (weight-length 2-5), wfl0To2 (weight-length 0-2).`,
      inputSchema: z.object({
        chartType: z.enum(CHART_TYPES).describe('Type of growth chart: wfa, hfa, hfa5To19, bfa, bfa5To19, hcfa, wfl, wfl0To2'),
      }),
      execute: async ({ chartType }) => {
        return displayGrowthChartTool({ chartType, patientData });
      },
    }),
  };
}

// Export the tool types for type safety
export type MedicalTools = ReturnType<typeof createMedicalTools>;
