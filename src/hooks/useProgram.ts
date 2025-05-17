import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import idl from "../idl/palapa.json"; // Adjust the path to your IDL file
import type { PalapaFunRooms } from "../idl/palapa.ts";

export const useProgram = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  const provider = useMemo(() => {
    if (!wallet || !connection) return null;
    return new AnchorProvider(connection, wallet, {
      preflightCommitment: "processed",
    });
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    // This constructor form (Program(idl, provider)) uses idl.metadata.address implicitly for the programId.
    // Ensure your idl JSON file (palapa.json) has "metadata": { "address": "YOUR_PROGRAM_ID" } correctly set.
    // Using 'idl as any' helps if the PalapaFunRooms type doesn't perfectly match the full IDL structure expected by Program constructor's strict typing for the idl parameter,
    // but Anchor itself is more lenient with the raw JSON IDL.
    return new Program<PalapaFunRooms>(idl as any, provider);
  }, [provider]); // idl is static, so not typically in deps unless it can change dynamically

  return program;
};
