/**
 * Clinical Safety Module
 *
 * Safety checks applied to all medication proposals:
 * - Allergy cross-check (flag drugs in patient's allergy class)
 * - Weight-based dosing calculator (mg/kg for pediatric doses)
 * - Age-appropriateness check
 * - Drug interaction check (against current medications)
 * - Duplicate prescription warning
 */

// ==================== Allergy Cross-Check ====================

/**
 * Known drug class mappings for allergy cross-referencing.
 * Maps allergy names to drug classes that should be avoided.
 */
const ALLERGY_DRUG_CLASSES: Record<string, string[]> = {
  // Penicillin family
  penicillin: [
    "amoxicillin", "ampicillin", "penicillin", "piperacillin",
    "ticarcillin", "nafcillin", "oxacillin", "dicloxacillin",
    "amoxicillin/clavulanate", "augmentin", "ampicillin/sulbactam",
  ],
  amoxicillin: [
    "amoxicillin", "amoxicillin/clavulanate", "augmentin",
  ],
  // Cephalosporin family (cross-reactivity with penicillin ~1-2%)
  cephalosporin: [
    "cephalexin", "cefazolin", "cefadroxil", "cefuroxime",
    "cefaclor", "cefprozil", "ceftriaxone", "cefotaxime",
    "ceftazidime", "cefixime", "cefpodoxime", "cefdinir",
    "cefepime",
  ],
  // Sulfonamide family
  sulfonamide: [
    "sulfamethoxazole", "trimethoprim/sulfamethoxazole", "bactrim",
    "sulfasalazine", "sulfadiazine",
  ],
  sulfamide: [
    "sulfamethoxazole", "trimethoprim/sulfamethoxazole", "bactrim",
  ],
  // Macrolide family
  macrolide: [
    "azithromycin", "erythromycin", "clarithromycin",
  ],
  // NSAID family
  nsaid: [
    "ibuprofen", "naproxen", "aspirin", "diclofenac",
    "indomethacin", "ketorolac", "meloxicam", "piroxicam",
  ],
  ibuprofen: ["ibuprofen", "advil", "motrin"],
  aspirin: ["aspirin", "acetylsalicylic acid"],
  // Tetracycline family
  tetracycline: [
    "tetracycline", "doxycycline", "minocycline",
  ],
  // Fluoroquinolone family
  fluoroquinolone: [
    "ciprofloxacin", "levofloxacin", "moxifloxacin",
    "ofloxacin", "norfloxacin",
  ],
};

/**
 * Cross-reactivity warnings (e.g., penicillin allergic patients
 * have ~1-2% chance of cephalosporin cross-reaction).
 */
const CROSS_REACTIVITY: Record<string, { classes: string[]; risk: string }> = {
  penicillin: {
    classes: ["cephalosporin"],
    risk: "1-2% cross-reactivity risk with cephalosporins",
  },
};

export interface AllergyCheckResult {
  safe: boolean;
  warnings: AllergyWarning[];
}

export interface AllergyWarning {
  drug: string;
  allergen: string;
  severity: "block" | "caution";
  message: string;
  alternative?: string;
}

/**
 * Check if a list of drugs conflicts with patient's allergies.
 */
export function checkAllergies(
  drugs: string[],
  allergies: string | null | undefined
): AllergyCheckResult {
  if (!allergies) return { safe: true, warnings: [] };

  const allergyList = allergies
    .toLowerCase()
    .split(/[,;]/)
    .map((a) => a.trim())
    .filter(Boolean);

  const warnings: AllergyWarning[] = [];

  for (const drug of drugs) {
    const drugLower = drug.toLowerCase();

    for (const allergy of allergyList) {
      // Direct match — allergy matches a drug class
      const blockedDrugs = ALLERGY_DRUG_CLASSES[allergy] || [];
      if (blockedDrugs.some((d) => drugLower.includes(d))) {
        warnings.push({
          drug,
          allergen: allergy,
          severity: "block",
          message: `${drug} is contraindicated — patient is allergic to ${allergy}`,
          alternative: suggestAlternative(drug, allergy),
        });
        continue;
      }

      // Direct name match (allergy IS the drug name)
      if (drugLower.includes(allergy) || allergy.includes(drugLower)) {
        warnings.push({
          drug,
          allergen: allergy,
          severity: "block",
          message: `${drug} is contraindicated — patient is allergic to ${allergy}`,
          alternative: suggestAlternative(drug, allergy),
        });
        continue;
      }

      // Cross-reactivity check
      const crossReact = CROSS_REACTIVITY[allergy];
      if (crossReact) {
        for (const crossClass of crossReact.classes) {
          const crossDrugs = ALLERGY_DRUG_CLASSES[crossClass] || [];
          if (crossDrugs.some((d) => drugLower.includes(d))) {
            warnings.push({
              drug,
              allergen: allergy,
              severity: "caution",
              message: `${drug} (${crossClass}) — ${crossReact.risk} with ${allergy} allergy`,
            });
          }
        }
      }
    }
  }

  return {
    safe: warnings.filter((w) => w.severity === "block").length === 0,
    warnings,
  };
}

/**
 * Suggest a safe alternative for a blocked drug.
 */
function suggestAlternative(drug: string, allergy: string): string | undefined {
  const drugLower = drug.toLowerCase();
  const allergyLower = allergy.toLowerCase();

  // Penicillin allergy → suggest azithromycin or cephalosporin (with caution)
  if (
    allergyLower === "penicillin" &&
    ALLERGY_DRUG_CLASSES.penicillin.some((d) => drugLower.includes(d))
  ) {
    return "Consider azithromycin or a cephalosporin (with caution — 1-2% cross-reactivity)";
  }

  // NSAID allergy → suggest acetaminophen
  if (
    allergyLower === "nsaid" ||
    allergyLower === "ibuprofen" ||
    allergyLower === "aspirin"
  ) {
    if (ALLERGY_DRUG_CLASSES.nsaid.some((d) => drugLower.includes(d))) {
      return "Consider acetaminophen (paracetamol) as an alternative";
    }
  }

  // Macrolide allergy → suggest fluoroquinolone (if age-appropriate)
  if (allergyLower === "macrolide") {
    return "Consider a fluoroquinolone (if age-appropriate) or trimethoprim/sulfamethoxazole";
  }

  return undefined;
}

// ==================== Weight-Based Dosing ====================

export interface DosingResult {
  drug: string;
  calculatedDose: string;
  perKgDose: string;
  maxDose?: string;
  warning?: string;
}

/**
 * Common pediatric drug dosing guidelines (mg/kg).
 */
const PEDIATRIC_DOSING: Record<
  string,
  {
    perKg: number;
    unit: string;
    frequency: string;
    maxDose?: number;
    maxDoseUnit?: string;
    minAge?: number; // months
    maxAge?: number; // months
  }
> = {
  amoxicillin: { perKg: 25, unit: "mg", frequency: "q8h", maxDose: 500, maxDoseUnit: "mg" },
  "amoxicillin_high": { perKg: 45, unit: "mg", frequency: "q12h", maxDose: 1000, maxDoseUnit: "mg" },
  azithromycin: { perKg: 10, unit: "mg", frequency: "once daily (day 1), then 5mg/kg", maxDose: 500, maxDoseUnit: "mg" },
  ibuprofen: { perKg: 10, unit: "mg", frequency: "q6-8h", maxDose: 400, maxDoseUnit: "mg", minAge: 6 },
  acetaminophen: { perKg: 15, unit: "mg", frequency: "q4-6h", maxDose: 1000, maxDoseUnit: "mg" },
  cephalexin: { perKg: 25, unit: "mg", frequency: "q6h", maxDose: 500, maxDoseUnit: "mg" },
  cefdinir: { perKg: 7, unit: "mg", frequency: "q12h", maxDose: 300, maxDoseUnit: "mg" },
  trimethoprim: { perKg: 4, unit: "mg", frequency: "q12h (TMP component)" },
  prednisolone: { perKg: 1, unit: "mg", frequency: "once daily", maxDose: 60, maxDoseUnit: "mg" },
  cetirizine: { perKg: 0, unit: "mg", frequency: "once daily" }, // Fixed dosing by age
};

/**
 * Calculate weight-based dosing for a drug.
 */
export function calculateDosing(
  drug: string,
  weightKg: number | undefined,
  ageMonths: number
): DosingResult | null {
  if (!weightKg) return null;

  const drugKey = drug.toLowerCase().replace(/[^a-z]/g, "");
  const dosing = Object.entries(PEDIATRIC_DOSING).find(([key]) =>
    drugKey.includes(key.replace(/_.*/, ""))
  );

  if (!dosing) return null;

  const [, guidelines] = dosing;

  // Age check
  if (guidelines.minAge && ageMonths < guidelines.minAge) {
    return {
      drug,
      calculatedDose: "N/A",
      perKgDose: `${guidelines.perKg}${guidelines.unit}/kg`,
      warning: `Not recommended for patients under ${guidelines.minAge} months`,
    };
  }

  const rawDose = guidelines.perKg * weightKg;
  const dose = Math.round(rawDose * 10) / 10;
  const finalDose =
    guidelines.maxDose && dose > guidelines.maxDose
      ? guidelines.maxDose
      : dose;

  return {
    drug,
    calculatedDose: `${finalDose}${guidelines.unit} ${guidelines.frequency}`,
    perKgDose: `${guidelines.perKg}${guidelines.unit}/kg`,
    maxDose: guidelines.maxDose
      ? `${guidelines.maxDose}${guidelines.maxDoseUnit}`
      : undefined,
    warning:
      guidelines.maxDose && dose > guidelines.maxDose
        ? `Calculated dose (${dose}${guidelines.unit}) exceeds max — capped at ${guidelines.maxDose}${guidelines.maxDoseUnit}`
        : undefined,
  };
}

// ==================== Age Appropriateness ====================

/**
 * Drugs not recommended for certain pediatric age groups.
 */
const AGE_RESTRICTIONS: Record<string, { minAgeMonths: number; reason: string }> = {
  aspirin: { minAgeMonths: 216, reason: "Risk of Reye's syndrome in children under 18 years" }, // 18y
  tetracycline: { minAgeMonths: 96, reason: "Can cause permanent tooth discoloration under 8 years" },
  doxycycline: { minAgeMonths: 96, reason: "Can cause permanent tooth discoloration under 8 years" },
  ciprofloxacin: { minAgeMonths: 216, reason: "Risk of cartilage damage in growing children" },
  levofloxacin: { minAgeMonths: 216, reason: "Risk of cartilage damage in growing children" },
  codeine: { minAgeMonths: 144, reason: "FDA contraindicated in children under 12 years" },
  loperamide: { minAgeMonths: 24, reason: "Not recommended under 2 years" },
  bismuth: { minAgeMonths: 144, reason: "Contains salicylate — Reye's syndrome risk under 12 years" },
};

export interface AgeCheckResult {
  safe: boolean;
  warnings: { drug: string; reason: string }[];
}

/**
 * Check if drugs are age-appropriate for the patient.
 */
export function checkAgeAppropriateness(
  drugs: string[],
  ageMonths: number
): AgeCheckResult {
  const warnings: { drug: string; reason: string }[] = [];

  for (const drug of drugs) {
    const drugLower = drug.toLowerCase();
    for (const [restricted, restriction] of Object.entries(AGE_RESTRICTIONS)) {
      if (drugLower.includes(restricted) && ageMonths < restriction.minAgeMonths) {
        warnings.push({
          drug,
          reason: restriction.reason,
        });
      }
    }
  }

  return {
    safe: warnings.length === 0,
    warnings,
  };
}

// ==================== Drug Interaction Check ====================

/**
 * Known significant drug-drug interactions in pediatrics.
 */
const DRUG_INTERACTIONS: Array<{
  drugs: [string, string];
  severity: "major" | "moderate";
  effect: string;
}> = [
  { drugs: ["azithromycin", "amiodarone"], severity: "major", effect: "QT prolongation risk" },
  { drugs: ["erythromycin", "theophylline"], severity: "major", effect: "Increased theophylline levels — risk of toxicity" },
  { drugs: ["methotrexate", "trimethoprim"], severity: "major", effect: "Increased methotrexate toxicity" },
  { drugs: ["warfarin", "azithromycin"], severity: "moderate", effect: "Increased bleeding risk" },
  { drugs: ["ibuprofen", "corticosteroid"], severity: "moderate", effect: "Increased GI bleeding risk" },
  { drugs: ["prednisolone", "ibuprofen"], severity: "moderate", effect: "Increased GI bleeding risk" },
  { drugs: ["ciprofloxacin", "theophylline"], severity: "major", effect: "Increased theophylline levels" },
  { drugs: ["fluconazole", "erythromycin"], severity: "major", effect: "QT prolongation risk" },
];

export interface InteractionCheckResult {
  safe: boolean;
  interactions: {
    drug1: string;
    drug2: string;
    severity: "major" | "moderate";
    effect: string;
  }[];
}

/**
 * Check for drug-drug interactions between proposed and current medications.
 */
export function checkDrugInteractions(
  proposedDrugs: string[],
  currentMedications: string[]
): InteractionCheckResult {
  const interactions: InteractionCheckResult["interactions"] = [];
  const allDrugs = [...proposedDrugs, ...currentMedications];

  for (const interaction of DRUG_INTERACTIONS) {
    const [drug1, drug2] = interaction.drugs;
    const hasDrug1 = allDrugs.some((d) => d.toLowerCase().includes(drug1));
    const hasDrug2 = allDrugs.some((d) => d.toLowerCase().includes(drug2));

    if (hasDrug1 && hasDrug2) {
      // Find the actual drug names
      const actualDrug1 = allDrugs.find((d) => d.toLowerCase().includes(drug1)) || drug1;
      const actualDrug2 = allDrugs.find((d) => d.toLowerCase().includes(drug2)) || drug2;

      interactions.push({
        drug1: actualDrug1,
        drug2: actualDrug2,
        severity: interaction.severity,
        effect: interaction.effect,
      });
    }
  }

  return {
    safe: interactions.filter((i) => i.severity === "major").length === 0,
    interactions,
  };
}

// ==================== Duplicate Check ====================

export interface DuplicateCheckResult {
  hasDuplicates: boolean;
  duplicates: { proposed: string; existing: string; message: string }[];
}

/**
 * Check if proposed medications duplicate existing ones.
 */
export function checkDuplicates(
  proposedDrugs: string[],
  currentMedications: { drug: string }[]
): DuplicateCheckResult {
  const duplicates: DuplicateCheckResult["duplicates"] = [];

  for (const proposed of proposedDrugs) {
    const proposedLower = proposed.toLowerCase();
    for (const existing of currentMedications) {
      const existingLower = existing.drug.toLowerCase();

      // Exact or partial match
      if (
        proposedLower.includes(existingLower) ||
        existingLower.includes(proposedLower)
      ) {
        duplicates.push({
          proposed,
          existing: existing.drug,
          message: `${proposed} may duplicate existing ${existing.drug}`,
        });
      }
    }
  }

  return {
    hasDuplicates: duplicates.length > 0,
    duplicates,
  };
}

// ==================== Combined Safety Check ====================

export interface SafetyCheckResult {
  safe: boolean;
  allergyWarnings: AllergyWarning[];
  ageWarnings: { drug: string; reason: string }[];
  interactions: InteractionCheckResult["interactions"];
  duplicates: DuplicateCheckResult["duplicates"];
  dosingNotes: DosingResult[];
  summary: string;
}

/**
 * Run all safety checks on a proposed medication list.
 */
export function runFullSafetyCheck(options: {
  proposedDrugs: string[];
  allergies: string | null | undefined;
  weightKg: number | undefined;
  ageMonths: number;
  currentMedications: { drug: string }[];
}): SafetyCheckResult {
  const { proposedDrugs, allergies, weightKg, ageMonths, currentMedications } = options;

  const allergyResult = checkAllergies(proposedDrugs, allergies);
  const ageResult = checkAgeAppropriateness(proposedDrugs, ageMonths);
  const interactionResult = checkDrugInteractions(
    proposedDrugs,
    currentMedications.map((m) => m.drug)
  );
  const duplicateResult = checkDuplicates(proposedDrugs, currentMedications);

  // Calculate dosing for each drug
  const dosingNotes: DosingResult[] = proposedDrugs
    .map((drug) => calculateDosing(drug, weightKg, ageMonths))
    .filter((d): d is DosingResult => d !== null);

  const safe =
    allergyResult.safe &&
    ageResult.safe &&
    interactionResult.safe &&
    !duplicateResult.hasDuplicates;

  // Build summary
  const issues: string[] = [];
  if (!allergyResult.safe) {
    issues.push(
      `ALLERGY: ${allergyResult.warnings.filter((w) => w.severity === "block").map((w) => w.message).join("; ")}`
    );
  }
  if (!ageResult.safe) {
    issues.push(
      `AGE: ${ageResult.warnings.map((w) => `${w.drug} — ${w.reason}`).join("; ")}`
    );
  }
  if (!interactionResult.safe) {
    issues.push(
      `INTERACTION: ${interactionResult.interactions.filter((i) => i.severity === "major").map((i) => `${i.drug1} + ${i.drug2}: ${i.effect}`).join("; ")}`
    );
  }
  if (duplicateResult.hasDuplicates) {
    issues.push(
      `DUPLICATE: ${duplicateResult.duplicates.map((d) => d.message).join("; ")}`
    );
  }

  return {
    safe,
    allergyWarnings: allergyResult.warnings,
    ageWarnings: ageResult.warnings,
    interactions: interactionResult.interactions,
    duplicates: duplicateResult.duplicates,
    dosingNotes,
    summary: safe
      ? "All safety checks passed"
      : `⚠️ Safety concerns: ${issues.join(" | ")}`,
  };
}
