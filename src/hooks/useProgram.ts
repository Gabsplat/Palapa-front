import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
// import { PublicKey } from "@solana/web3.js";
import idl from "../idl/palapa.json"; // Adjust the path to your IDL file
import type { PalapaFunRooms } from "../idl/palapa.ts";

export const useProgram = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  //   const programId = new PublicKey(
  //     "Fu5sXvLemQ5meB4y3GWM4oacD2uDwbF8URFh2WpmCMeR"
  //   );

  const provider = wallet
    ? new AnchorProvider(connection, wallet, {
        preflightCommitment: "processed",
      })
    : null;

  const program = provider ? new Program<PalapaFunRooms>(idl, provider) : null;

  return program;
};
