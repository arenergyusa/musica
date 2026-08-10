"use client";

import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { bsc } from "@reown/appkit/networks";
import { defineChain } from "viem";
import { APP } from "@/lib/constants";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "build-placeholder";

if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID && typeof window !== "undefined") {
  throw new Error("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not defined");
}

const musicaBsc = defineChain({
  ...bsc,
  rpcUrls: {
    default: {
      http: [
        "https://bsc-dataseed.binance.org",
        "https://bsc-dataseed1.binance.org",
        "https://bsc-dataseed2.binance.org",
        "https://bsc.publicnode.com",
        "https://1rpc.io/bnb",
      ],
    },
  },
});

createAppKit({
  adapters: [new EthersAdapter()],
  networks: [musicaBsc],
  defaultNetwork: musicaBsc,
  projectId,
  metadata: {
    name: APP.NAME,
    description: "Musica — Community Rewards & Income Platform",
    url: APP.URL,
    icons: [`${APP.URL}/brand/musica-icon-192.png`],
  },
  features: {
    analytics: false,
    email: false,
    socials: [],
  },
  themeMode: "dark",
});

export function AppKitProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
