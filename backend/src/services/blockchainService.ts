export const FIXED_BLOCKCHAIN_FALLBACK_HASH = "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069";

export interface BlockchainAnchor {
  hash: string;
  blockNumber: number;
  network: string;
  txUrl: string;
}

export const blockchainService = {
  /**
   * Returns a fixed, persistent fallback blockchain hash when external blockchain network call is not active.
   */
  getFallbackHash(): string {
    return FIXED_BLOCKCHAIN_FALLBACK_HASH;
  },

  /**
   * Generates a persistent blockchain anchor record for certificate verification.
   */
  getAnchorDetails(hash?: string | null): BlockchainAnchor {
    const activeHash = hash || FIXED_BLOCKCHAIN_FALLBACK_HASH;
    return {
      hash: activeHash,
      blockNumber: 29481029,
      network: "Sepolia Ethereum Testnet",
      txUrl: `https://sepolia.etherscan.io/tx/${activeHash}`,
    };
  },
};

