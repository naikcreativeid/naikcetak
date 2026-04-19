/**
 * Returns max sheet yield (bentangan per plano) checking both paper orientations.
 */
export function calculateImposition({ planoLength, planoWidth, flatLength, flatWidth, grip = 2 }) {
  if (!planoLength || !planoWidth || !flatLength || !flatWidth) return 0;
  if (flatLength <= 0 || flatWidth <= 0 || planoLength <= 0 || planoWidth <= 0) return 0;

  const usableL = planoLength - grip;
  const usableW = planoWidth - grip;

  if (usableL <= 0 || usableW <= 0) return 0;

  const o1 = Math.floor(usableL / flatLength) * Math.floor(usableW / flatWidth);
  const o2 = Math.floor(usableL / flatWidth) * Math.floor(usableW / flatLength);

  return Math.max(o1, o2, 0);
}

/**
 * Full HPP calculation engine. Returns null if inputs are insufficient.
 */
export function calculateResults({
  targetQty,
  maxYield,
  wasteRate = 5,
  paperPrice = 0,
  printCostPerSheet = 0,
  finishingCost = 0,
  printSetupCost = 0,
  pondCost = 0,
  margin = 35,
}) {
  if (!targetQty || targetQty <= 0 || !maxYield || maxYield <= 0) return null;

  // Paper calculation
  const rawSheets = Math.ceil(targetQty / maxYield);
  const totalPaper = Math.ceil(rawSheets * (1 + wasteRate / 100));

  // Cost breakdown
  const paperCost = totalPaper * paperPrice;
  const printCost = totalPaper * printCostPerSheet;
  const finishingTotal = targetQty * finishingCost;
  const totalVariableCost = paperCost + printCost + finishingTotal;
  const fixedCosts = printSetupCost + pondCost;
  const totalProductionCost = totalVariableCost + fixedCosts;

  // Per-unit economics
  const hpp = totalProductionCost / targetQty;
  const sellingPrice = margin < 100 ? hpp / (1 - margin / 100) : hpp * 2;
  const revenue = targetQty * sellingPrice;
  const netProfit = revenue - totalProductionCost;
  const roi = totalProductionCost > 0 ? (netProfit / totalProductionCost) * 100 : 0;

  // Break-even point (units to cover fixed costs)
  const varCostPerUnit = totalVariableCost / targetQty;
  const contributionMargin = sellingPrice - varCostPerUnit;
  const bep = contributionMargin > 0 ? Math.ceil(fixedCosts / contributionMargin) : 0;

  return {
    rawSheets,
    totalPaper,
    paperCost,
    printCost,
    finishingTotal,
    totalVariableCost,
    fixedCosts,
    totalProductionCost,
    hpp,
    sellingPrice,
    revenue,
    netProfit,
    roi,
    bep,
    varCostPerUnit,
    maxYield,
  };
}

/**
 * Simulate HPP and pricing across standard bulk quantities with tiered discounts.
 */
export function calculateBulkSimulation(specs, costs) {
  const quantities = [500, 1000, 2000, 5000];

  return quantities.map((qty) => {
    const maxYield = calculateImposition(specs);
    const res = calculateResults({ ...costs, targetQty: qty, maxYield });

    if (!res) return { qty, hpp: 0, sellingPrice: 0, discountedPrice: 0, discount: 0, netProfit: 0, totalPaper: 0 };

    let discount = 0;
    if (qty >= 5000) discount = 10;
    else if (qty >= 1000) discount = 5;

    const discountedPrice = res.sellingPrice * (1 - discount / 100);
    const netProfit = qty * discountedPrice - res.totalProductionCost;

    return {
      qty,
      totalPaper: res.totalPaper,
      hpp: res.hpp,
      sellingPrice: res.sellingPrice,
      discountedPrice,
      discount,
      netProfit,
    };
  });
}

export function formatRupiah(value) {
  if (value === null || value === undefined || isNaN(value)) return 'Rp 0';
  return 'Rp\u00A0' + Math.round(value).toLocaleString('id-ID');
}

export function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return Math.round(value).toLocaleString('id-ID');
}
