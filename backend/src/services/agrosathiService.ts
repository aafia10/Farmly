export const agrosathiService = {
  processFarmerQuery(query: string, user?: { fullName?: string; district?: string }): { query: string; answer: string } {
    const clean = query.toLowerCase();
    const name = user?.fullName || "Kisan Mitra";

    if (clean.includes("payment") || clean.includes("bank") || clean.includes("money") || clean.includes("paise")) {
      return {
        query,
        answer: `Namaste ${name}! Escrow payments on Farmly advance automatically across 6 transparent milestones. Once the buyer submits the bank transaction reference (UTR), funds are cleared directly to your registered bank account within 24 hours. Check your Payments dashboard for real-time tracking.`,
      };
    }

    if (clean.includes("lot") || clean.includes("harvest") || clean.includes("batch")) {
      return {
        query,
        answer: `Namaste ${name}! Your harvest lots are registered with tamper-proof digital certificates, APMC assay grades, and weighment scale telemetry. Each lot has a unique QR code for instant buyer verification.`,
      };
    }

    if (clean.includes("msp") || clean.includes("price") || clean.includes("mandi") || clean.includes("bhav")) {
      return {
        query,
        answer: `Namaste ${name}! Farmly monitors official APMC modal prices and central MSP benchmarks across Maharashtra and national mandis daily. Visit the Fair Price section in your app to view the latest floor prices for Wheat, Basmati Rice, Soybean, and other crops.`,
      };
    }

    return {
      query,
      answer: `Namaste ${name}! AgroSathi Digital Assistant is synchronized with your farm records, APMC quality grades, and escrow ledgers. Contact your local field assistant Priya Sharma for on-ground assistance with weighments and crop documentation.`,
    };
  },
};
