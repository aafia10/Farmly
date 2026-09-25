export interface CropPriceBenchmark {
  crop: string;
  variety: string;
  msp: number; // ₹ per quintal
  apmcMin: number;
  apmcMax: number;
  modalPrice: number;
  trend: "up" | "stable" | "down";
  lastUpdated: string;
}

export const MANDI_BENCHMARKS: CropPriceBenchmark[] = [
  { crop: "Wheat", variety: "Sharbati / Lokwan", msp: 2275, apmcMin: 2200, apmcMax: 2650, modalPrice: 2450, trend: "up", lastUpdated: "17 Sep 2026" },
  { crop: "Basmati Rice", variety: "Pusa 1121", msp: 3100, apmcMin: 3200, apmcMax: 3850, modalPrice: 3500, trend: "up", lastUpdated: "17 Sep 2026" },
  { crop: "Soybean", variety: "Yellow Soybean", msp: 4600, apmcMin: 4400, apmcMax: 4950, modalPrice: 4750, trend: "stable", lastUpdated: "16 Sep 2026" },
  { crop: "Cotton", variety: "Medium Staple", msp: 7020, apmcMin: 6900, apmcMax: 7400, modalPrice: 7150, trend: "up", lastUpdated: "17 Sep 2026" },
  { crop: "Mustard Seed", variety: "Brown Mustard", msp: 5650, apmcMin: 5400, apmcMax: 6100, modalPrice: 5800, trend: "up", lastUpdated: "16 Sep 2026" },
  { crop: "Maize", variety: "Kharif Hybrid", msp: 2090, apmcMin: 1950, apmcMax: 2250, modalPrice: 2120, trend: "stable", lastUpdated: "15 Sep 2026" },
  { crop: "Tur / Arhar", variety: "Desi Red", msp: 7000, apmcMin: 6900, apmcMax: 7600, modalPrice: 7300, trend: "up", lastUpdated: "17 Sep 2026" },
  { crop: "Gram (Chana)", variety: "Desi Chana", msp: 5440, apmcMin: 5300, apmcMax: 5750, modalPrice: 5520, trend: "stable", lastUpdated: "16 Sep 2026" },
];

export const mandiService = {
  getBenchmarks(): CropPriceBenchmark[] {
    return MANDI_BENCHMARKS;
  },

  getBenchmarkForCrop(cropName: string): CropPriceBenchmark | undefined {
    return MANDI_BENCHMARKS.find(
      (b) => b.crop.toLowerCase().includes(cropName.toLowerCase())
    );
  },
};
