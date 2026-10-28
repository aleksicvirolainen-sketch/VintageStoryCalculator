import { derived, writable } from "svelte/store";
import alloyDefinitionsRaw from "../data/alloys.json";
import {
  NUGGETS_PER_INGOT,
  UNITS_PER_INGOT,
  formatTemperature,
  getMetalColor
} from "../lib/constants";
import { validateAlloyRatios } from "../lib/calculations";
import { computeAlloyStackPlan, computeStackPlan, type StackInput } from "../lib/stack-plan";
import {
  formatFuelList,
  getBottleneckFuels,
  getIngredientFuelDetails,
  type IngredientFuelInfo
} from "../lib/fuels";
import { calculateAlloyAllocation, calculateAlloySplitFromNuggets } from "../lib/smelting";
import type { CalculationMode, Alloy } from "../types/index";

const DEFAULT_HAVE_NUGGETS = 100;

export type AlloyCalculatorState = {
  selectedAlloy: string;
  mode: CalculationMode;
  targetIngots: number;
  metalPercentages: Record<string, number>;
  metalNuggets: Record<string, number>;
};

type AlloyPartState = {
  metal: string;
  color?: string;
  min: number;
  max: number;
  pct: number;
};

export const ALLOY_PERCENT_PRECISION = 1;
export const ALLOY_PERCENT_STEP = Math.pow(10, -ALLOY_PERCENT_PRECISION);
const ALLOY_PERCENT_FACTOR = Math.pow(10, ALLOY_PERCENT_PRECISION);
const PERCENT_TOTAL = 100;
const PERCENT_EPSILON = 1e-6;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getPercentTotal = (parts: AlloyPartState[]) => parts.reduce((sum, part) => sum + part.pct, 0);

const getPercentCapacity = (part: AlloyPartState, direction: 1 | -1) =>
  direction > 0 ? part.max - part.pct : part.pct - part.min;

const adjustPercentTotal = (
  parts: AlloyPartState[],
  anchorIndex: number,
  tolerance = PERCENT_EPSILON
) => {
  const diff = PERCENT_TOTAL - getPercentTotal(parts);
  if (Math.abs(diff) <= tolerance) return;

  const direction: 1 | -1 = diff > 0 ? 1 : -1;
  let remaining = Math.abs(diff);
  const candidates = parts
    .map((part, idx) => ({ part, idx }))
    .sort((a, b) => {
      const aAnchor = a.idx === anchorIndex ? 1 : 0;
      const bAnchor = b.idx === anchorIndex ? 1 : 0;
      if (aAnchor !== bAnchor) return aAnchor - bAnchor;
      return getPercentCapacity(b.part, direction) - getPercentCapacity(a.part, direction);
    });

  for (const entry of candidates) {
    const capacity = getPercentCapacity(entry.part, direction);
    if (capacity <= tolerance) continue;
    const delta = Math.min(capacity, remaining);
    entry.part.pct += direction * delta;
    remaining -= delta;
    if (remaining <= tolerance) break;
  }
};

const ALLOY_DEFINITIONS = alloyDefinitionsRaw as Record<string, Alloy>;

const getAlloyDefinition = (key: string) => ALLOY_DEFINITIONS[key];

const buildDefaultParts = (alloy: Alloy): AlloyPartState[] => {
  const parts = alloy.parts.map((part) => {
    const min = Number.isFinite(part.min) ? part.min : 0;
    const max = Number.isFinite(part.max) && part.max >= min ? part.max : Math.max(min, 100);
    const midpoint = (min + max) / 2;
    const base =
      typeof part.default === "number" && Number.isFinite(part.default) ? part.default : midpoint;
    return {
      metal: part.metal,
      color: part.color || getMetalColor(part.metal),
      min,
      max,
      pct: clamp(base, min, max)
    };
  });

  normalizeParts(parts);
  return parts;
};

const buildPartsFromState = (alloy: Alloy, percentages: Record<string, number>) =>
  alloy.parts.map((part) => {
    const min = Number.isFinite(part.min) ? part.min : 0;
    const max = Number.isFinite(part.max) && part.max >= min ? part.max : Math.max(min, 100);
    const base =
      typeof part.default === "number" && Number.isFinite(part.default)
        ? part.default
        : (min + max) / 2;
    const pctOverride = percentages[part.metal];
    const pct =
      typeof pctOverride === "number" && Number.isFinite(pctOverride) ? pctOverride : base;
    return {
      metal: part.metal,
      color: part.color || getMetalColor(part.metal),
      min,
      max,
      pct: clamp(pct, min, max)
    };
  });

const normalizeParts = (parts: AlloyPartState[]) => {
  if (!parts.length) return;

  const total = getPercentTotal(parts);
  if (total === 0) {
    const share = PERCENT_TOTAL / parts.length;
    parts.forEach((part) => {
      part.pct = clamp(share, part.min, part.max);
    });
  } else {
    const scale = PERCENT_TOTAL / total;
    parts.forEach((part) => {
      part.pct = clamp(part.pct * scale, part.min, part.max);
    });
  }

  rebalancePercents(parts, 0);
  roundParts(parts, 0);
};

const rebalancePercents = (parts: AlloyPartState[], anchorIndex = 0) => {
  if (!parts.length) return;

  const clampAll = () => {
    parts.forEach((part) => {
      part.pct = clamp(part.pct, part.min, part.max);
    });
  };

  clampAll();

  const diff = PERCENT_TOTAL - getPercentTotal(parts);
  if (Math.abs(diff) <= 1e-6) return;

  const direction = diff > 0 ? 1 : -1;
  let remaining = Math.abs(diff);
  const others = parts
    .map((part, idx) => ({ part, idx }))
    .filter((entry) => entry.idx !== anchorIndex);

  const capacity = (entry: { part: AlloyPartState }) =>
    direction > 0 ? entry.part.max - entry.part.pct : entry.part.pct - entry.part.min;

  let guard = 0;
  while (remaining > 1e-4 && guard < 50) {
    guard += 1;
    const adjustable = others.filter((entry) => capacity(entry) > 1e-6);
    if (!adjustable.length) break;

    const share = remaining / adjustable.length;
    adjustable.forEach((entry) => {
      const delta = Math.min(capacity(entry), share);
      entry.part.pct += direction * delta;
      remaining -= delta;
    });
  }

  if (remaining > 1e-4 && parts[anchorIndex]) {
    const anchor = parts[anchorIndex];
    const anchorCapacity = direction > 0 ? anchor.max - anchor.pct : anchor.pct - anchor.min;
    const delta = Math.min(anchorCapacity, remaining);
    anchor.pct += direction * delta;
    remaining -= delta;
  }

  clampAll();

  if (remaining > 1e-3) {
    const unconstrainedTotal = getPercentTotal(parts);
    if (unconstrainedTotal > 0) {
      const scale = PERCENT_TOTAL / unconstrainedTotal;
      parts.forEach((part) => {
        part.pct = clamp(part.pct * scale, part.min, part.max);
      });
    }
  }

  adjustPercentTotal(parts, anchorIndex, 0.01);
};

const roundParts = (parts: AlloyPartState[], anchorIndex = 0) => {
  if (!parts.length) return;

  const entries = parts.map((part, idx) => {
    const minTicks = Math.ceil(part.min * ALLOY_PERCENT_FACTOR);
    const maxTicks = Math.max(minTicks, Math.floor(part.max * ALLOY_PERCENT_FACTOR));
    const ticks = clamp(Math.round(part.pct * ALLOY_PERCENT_FACTOR), minTicks, maxTicks);
    return { part, idx, minTicks, maxTicks, ticks };
  });

  const targetTicks = PERCENT_TOTAL * ALLOY_PERCENT_FACTOR;
  let diffTicks = targetTicks - entries.reduce((sum, entry) => sum + entry.ticks, 0);

  while (diffTicks !== 0) {
    const direction: 1 | -1 = diffTicks > 0 ? 1 : -1;
    const target = entries
      .map((entry) => ({
        entry,
        room: direction > 0 ? entry.maxTicks - entry.ticks : entry.ticks - entry.minTicks
      }))
      .filter((item) => item.room > 0)
      .sort((a, b) => {
        const aAnchor = a.entry.idx === anchorIndex ? 1 : 0;
        const bAnchor = b.entry.idx === anchorIndex ? 1 : 0;
        if (aAnchor !== bAnchor) return aAnchor - bAnchor;
        return b.room - a.room;
      })[0];

    if (!target) break;

    const adjustment = Math.min(Math.abs(diffTicks), target.room);
    target.entry.ticks += direction * adjustment;
    diffTicks -= direction * adjustment;
  }

  entries.forEach((entry) => {
    entry.part.pct = entry.ticks / ALLOY_PERCENT_FACTOR;
  });
};

const partsToPercentages = (parts: AlloyPartState[]) => {
  const percentages: Record<string, number> = {};
  parts.forEach((part) => {
    percentages[part.metal] = part.pct;
  });
  return percentages;
};

const buildDefaultNuggets = (alloy: Alloy): Record<string, number> => {
  const nuggets: Record<string, number> = {};
  for (const part of alloy.parts) {
    nuggets[part.metal] = DEFAULT_HAVE_NUGGETS;
  }
  return nuggets;
};

const initializeState = (): AlloyCalculatorState => {
  const alloyKeys = Object.keys(ALLOY_DEFINITIONS);
  const defaultAlloy = alloyKeys[0] ?? "";
  const definition = defaultAlloy ? getAlloyDefinition(defaultAlloy) : undefined;
  const defaultParts = definition ? buildDefaultParts(definition) : [];
  return {
    selectedAlloy: defaultAlloy,
    mode: "need",
    targetIngots: 10,
    metalPercentages: partsToPercentages(defaultParts),
    metalNuggets: definition ? buildDefaultNuggets(definition) : {}
  };
};

export const alloyCalculator = writable<AlloyCalculatorState>(initializeState());

export const setSelectedAlloy = (alloyKey: string) => {
  const definition = getAlloyDefinition(alloyKey);
  if (!definition) return;
  const defaultParts = buildDefaultParts(definition);
  alloyCalculator.update((state) => ({
    ...state,
    selectedAlloy: alloyKey,
    metalPercentages: partsToPercentages(defaultParts),
    metalNuggets: buildDefaultNuggets(definition)
  }));
};

export const setMode = (mode: CalculationMode) => {
  alloyCalculator.update((state) => {
    if (state.mode === mode) return state;
    const definition = getAlloyDefinition(state.selectedAlloy);
    return {
      ...state,
      mode,
      metalNuggets: definition ? buildDefaultNuggets(definition) : state.metalNuggets
    };
  });
};

export const setTargetIngots = (value: number | null) => {
  const target = Math.max(0, Number(value) || 0);
  alloyCalculator.update((state) => ({
    ...state,
    targetIngots: target
  }));
};

export const setMetalPercentage = (metal: string, value: number) => {
  alloyCalculator.update((state) => {
    const definition = getAlloyDefinition(state.selectedAlloy);
    if (!definition) return state;

    const parts = buildPartsFromState(definition, state.metalPercentages);
    const index = parts.findIndex((part) => part.metal === metal);
    if (index === -1) return state;

    const selected = parts[index];
    if (!selected) return state;
    selected.pct = clamp(value, selected.min, selected.max);
    rebalancePercents(parts, index);
    roundParts(parts, index);

    return {
      ...state,
      metalPercentages: partsToPercentages(parts)
    };
  });
};

export const setMetalNuggets = (metal: string, value: number) => {
  const safe = Math.max(0, Number(value) || 0);
  alloyCalculator.update((state) => ({
    ...state,
    metalNuggets: { ...state.metalNuggets, [metal]: safe }
  }));
};

export const applyState = (partial: Partial<AlloyCalculatorState>) => {
  alloyCalculator.update((state) => {
    const next = { ...state };

    if (partial.selectedAlloy !== undefined) {
      const def = getAlloyDefinition(partial.selectedAlloy);
      if (def) {
        next.selectedAlloy = partial.selectedAlloy;
        const defaultParts = buildDefaultParts(def);
        next.metalPercentages = partsToPercentages(defaultParts);
        next.metalNuggets = buildDefaultNuggets(def);
      }
    }

    if (partial.mode !== undefined) {
      next.mode = partial.mode;
    }

    if (partial.targetIngots !== undefined) {
      next.targetIngots = Math.max(0, Number(partial.targetIngots) || 0);
    }

    if (partial.metalPercentages !== undefined) {
      const definition = getAlloyDefinition(next.selectedAlloy);
      if (definition) {
        const merged = { ...next.metalPercentages, ...partial.metalPercentages };
        const parts = buildPartsFromState(definition, merged);
        normalizeParts(parts);
        next.metalPercentages = partsToPercentages(parts);
      }
    }

    if (partial.metalNuggets !== undefined) {
      next.metalNuggets = { ...next.metalNuggets, ...partial.metalNuggets };
    }

    return next;
  });
};

export const alloyCalculation = derived(alloyCalculator, (state) => {
  const definition = getAlloyDefinition(state.selectedAlloy);
  if (!definition) {
    return {
      mode: state.mode,
      alloyName: "",
      parts: [] as Array<
        AlloyPartState & { units: number; nuggets: number; available: number; leftover: number }
      >,
      totalUnits: 0,
      totalPercent: 0,
      producedIngots: 0,
      remainderNuggets: 0,
      smeltTemp: formatTemperature(undefined),
      compatibleFuels: formatFuelList(undefined),
      ingredientFuels: [] as IngredientFuelInfo[],
      barSegments: [{ label: "No metals", color: "#eee", flex: 1 }],
      stackInputs: [] as StackInput[],
      stackPlan: computeStackPlan([]),
      hasStackInputs: false,
      allocationWarning: ""
    };
  }

  const parts = buildPartsFromState(definition, state.metalPercentages);
  const { totalPercent } = validateAlloyRatios(parts);

  const metalNames = definition.parts.map((p) => p.metal);
  const ingredientFuels = getIngredientFuelDetails(metalNames);
  const bottleneck = getBottleneckFuels(metalNames);
  const compatibleFuels = bottleneck.fuels;

  const barSegments =
    totalPercent <= 0
      ? [{ label: "No metals", color: "#eee", flex: 1 }]
      : parts
          .filter((part) => part.pct > 0)
          .map((part) => ({
            label: `${part.metal} ${part.pct.toFixed(1)}%`,
            color: part.color || "#ccc",
            flex: part.pct
          }));

  if (state.mode === "have") {
    const splitResult = calculateAlloySplitFromNuggets(
      state.metalNuggets,
      parts.map((part) => ({
        metal: part.metal,
        color: part.color,
        min: part.min,
        max: part.max,
        pct: part.pct
      }))
    );

    const splitByMetal = new Map(splitResult.parts.map((entry) => [entry.metal, entry]));

    const partsWithAllocations = parts.map((part) => {
      const split = splitByMetal.get(part.metal);
      return {
        ...part,
        units: split?.units ?? 0,
        nuggets: split?.nuggets ?? 0,
        available: split?.available ?? state.metalNuggets[part.metal] ?? 0,
        leftover: split?.leftover ?? state.metalNuggets[part.metal] ?? 0
      };
    });

    const stackInputs = partsWithAllocations
      .filter((part) => part.nuggets > 0)
      .map((part) => ({
        metal: part.metal,
        color: part.color,
        nuggets: part.nuggets
      }));

    return {
      mode: state.mode,
      alloyName: definition.name,
      parts: partsWithAllocations,
      totalUnits: splitResult.producedUnits,
      totalPercent,
      producedIngots: splitResult.producedIngots,
      remainderNuggets: splitResult.totalNuggets % NUGGETS_PER_INGOT,
      smeltTemp: formatTemperature(definition.smeltTemp),
      compatibleFuels,
      ingredientFuels,
      barSegments,
      stackInputs,
      stackPlan: stackInputs.length
        ? computeAlloyStackPlan(
            stackInputs,
            parts.map((part) => ({
              metal: part.metal,
              color: part.color,
              min: part.min,
              max: part.max,
              pct: part.pct
            }))
          )
        : computeStackPlan([]),
      hasStackInputs: stackInputs.length > 0,
      allocationWarning: ""
    };
  }

  const totalUnits = Math.max(0, state.targetIngots) * UNITS_PER_INGOT;
  const alloyAllocation = calculateAlloyAllocation(
    totalUnits,
    parts.map((part) => ({
      metal: part.metal,
      color: part.color,
      min: part.min,
      max: part.max,
      pct: part.pct
    }))
  );
  const allocationByMetal = new Map(alloyAllocation.parts.map((entry) => [entry.metal, entry]));

  const partsWithAllocations = parts.map((part) => ({
    ...part,
    units: allocationByMetal.get(part.metal)?.units ?? 0,
    nuggets: allocationByMetal.get(part.metal)?.nuggets ?? 0,
    available: 0,
    leftover: 0
  }));

  const stackInputs = partsWithAllocations
    .filter((part) => part.nuggets > 0)
    .map((part) => ({
      metal: part.metal,
      color: part.color,
      nuggets: part.nuggets
    }));

  return {
    mode: state.mode,
    alloyName: definition.name,
    parts: partsWithAllocations,
    totalUnits,
    totalPercent,
    producedIngots: 0,
    remainderNuggets: 0,
    smeltTemp: formatTemperature(definition.smeltTemp),
    compatibleFuels,
    ingredientFuels,
    barSegments,
    stackInputs,
    stackPlan: stackInputs.length
      ? computeAlloyStackPlan(
          stackInputs,
          parts.map((part) => ({
            metal: part.metal,
            color: part.color,
            min: part.min,
            max: part.max,
            pct: part.pct
          }))
        )
      : computeStackPlan([]),
    hasStackInputs: stackInputs.length > 0,
    allocationWarning: alloyAllocation.error ?? ""
  };
});
