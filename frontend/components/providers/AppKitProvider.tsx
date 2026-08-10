"use client";

import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { bsc } from "@reown/appkit/networks";
import { APP } from "@/lib/constants";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not defined");
}

createAppKit({
  adapters: [new EthersAdapter()],
  networks: [bsc],
  defaultNetwork: bsc,
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
