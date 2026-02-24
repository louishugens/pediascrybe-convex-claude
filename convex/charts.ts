import { query } from "./_generated/server";
import { v } from "convex/values";

// List all available charts (for debugging)
export const listAllCharts = query({
  args: {},
  handler: async (ctx) => {
    const charts = await ctx.db.query("charts").collect();
    return charts.map(chart => ({
      _id: chart._id,
      chartId: chart.chartId,
      hasP03: !!chart.p03,
      hasP50: !!chart.p50,
      hasP97: !!chart.p97,
    }));
  },
});

// Get all charts with full data (for offline caching)
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("charts").collect();
  },
});

// Get chart reference data by chart type
export const getReferenceData = query({
  args: { 
    chartType: v.string(),
    sex: v.optional(v.union(v.literal("male"), v.literal("female"), v.null())),
  },
  handler: async (ctx, args) => {
    // Determine the chart ID based on type and sex
    let chartId: string;
    
    switch (args.chartType) {
      case "wfa":
        chartId = args.sex === "female" ? "gwfa" : "bwfa";
        break;
      case "hfa":
        chartId = args.sex === "female" ? "ghfa" : "bhfa";
        break;
      case "hfa5To19":
        chartId = args.sex === "female" ? "ghfa_5_19" : "bhfa_5_19";
        break;
      case "bfa":
        chartId = args.sex === "female" ? "gbfa" : "bbfa";
        break;
      case "bfa5To19":
        chartId = args.sex === "female" ? "gbfa_5_19" : "bbfa_5_19";
        break;
      case "hcfa":
        chartId = args.sex === "female" ? "ghcfa" : "bhcfa";
        break;
      case "wfl":
        chartId = args.sex === "female" ? "gwfh" : "bwfh";
        break;
      case "wfl0To2":
        chartId = args.sex === "female" ? "gwfh_0_2" : "bwfh_0_2";
        break;
      default:
        return null;
    }
    
    // Query charts table using the by_chartId index
    const chart = await ctx.db
      .query("charts")
      .withIndex("by_chartId", (q) => q.eq("chartId", chartId))
      .first();
    return chart || null;
  },
});

// Get chart reference by direct chartId (for print pages)
export const getChartReference = query({
  args: { chartId: v.string() },
  handler: async (ctx, args) => {
    // Query charts table by chartId
    const chart = await ctx.db
      .query("charts")
      .withIndex("by_chartId", (q) => q.eq("chartId", args.chartId))
      .first();
    return chart || null;
  },
});

// Get all chart reference data for a patient
export const getPatientChartData = query({
  args: { 
    patientId: v.id("patients"),
    chartType: v.string(),
  },
  handler: async (ctx, args) => {
    const patient = await ctx.db.get(args.patientId);
    if (!patient) return null;
    
    // Get appointments ordered by date
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .collect();
    
    // Sort by startDate ascending
    appointments.sort((a, b) => a.startDate - b.startDate);
    
    return {
      patient,
      appointments,
    };
  },
});

