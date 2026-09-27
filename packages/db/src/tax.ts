// Kenya hospitality taxes applied to every booking, bar sale and restaurant
// sale. Kept in one place so a rate change is a single edit.
export const VAT_RATE = 0.14; // 14% VAT
export const LEVY_RATE = 0.02; // 2% catering / tourism levy

export interface TaxBreakdown {
  subTotal: number;
  vat: number;
  levy: number;
  total: number;
}

/** Given a pre-tax subtotal, returns VAT, levy and the grand total. */
export function computeTax(subTotal: number): TaxBreakdown {
  const vat = subTotal * VAT_RATE;
  const levy = subTotal * LEVY_RATE;
  return { subTotal, vat, levy, total: subTotal + vat + levy };
}
