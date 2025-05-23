import { Buffer } from "buffer";
window.Buffer = Buffer;
("use client");

import { BN } from "@coral-xyz/anchor";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  AlertCircle,
  Award,
  Calendar,
  CircleCheck,
  Clock,
  Coins,
  Copy,
  LogOut,
  Play,
  Plus,
  RefreshCw,
  Trophy,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useProgram } from "./hooks/useProgram";

// Interface for type safety (align with your IDL's RoomData structure)
interface RoomAccount {
  publicKey: PublicKey;
  account: {
    creator: PublicKey;
    roomSeed: string; // In Rust: room_seed
    bump: number;
    vaultBump: number; // In Rust: vault_bump
    status: { [key: string]: object }; // e.g., { openForJoining: {} } or { created: {} }
    winner: PublicKey | null;
    maxPlayers: number; // In Rust: max_players (u16 becomes number)
    entryFee: BN; // In Rust: entry_fee (u64 becomes BN)
    players: PublicKey[];
    creationTimestamp: BN; // In Rust: creation_timestamp (i64 becomes BN)
    endTimestamp: BN | null; // In Rust: end_timestamp (Option<i64> becomes BN | null)
  };
}

export default function TestContract() {
  const anchorWallet = useAnchorWallet();
  const { connected, publicKey, disconnect: walletDisconnect } = useWallet();
  const { connection } = useConnection();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const program = useProgram();
  const [availableRooms, setAvailableRooms] = useState<RoomAccount[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [feedbackType, setFeedbackType] = useState<
    "success" | "error" | "info"
  >("info");
  const [selectedWinners, setSelectedWinners] = useState<{
    [roomPubKey: string]: string;
  }>({});
  const [entryFeeSOL, setEntryFeeSOL] = useState<string>("0.1");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(false);

  const SERVICE_WALLET_PUBKEY = new PublicKey(
    "FDKFLU6mUjfYZRRSrqbS9CPH87MFpae8JSH9Ddt79oRN"
  );

  const showFeedback = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      setFeedbackMessage(message);
      setFeedbackType(type);

      // Auto-clear success messages after 5 seconds
      if (type === "success") {
        setTimeout(() => {
          setFeedbackMessage("");
        }, 5000);
      }
    },
    [setFeedbackMessage, setFeedbackType]
  );

  useEffect(() => {
    const getBalance = async () => {
      if (connected && publicKey && connection) {
        setIsBalanceLoading(true);
        try {
          const balanceLamports = await connection.getBalance(publicKey);
          setSolBalance(balanceLamports / LAMPORTS_PER_SOL);
        } catch (error) {
          console.error("Error fetching balance:", error);
          setSolBalance(null);
          // Optionally show feedback for balance error
          // showFeedback("Could not fetch SOL balance.", "error");
        } finally {
          setIsBalanceLoading(false);
        }
      } else {
        setSolBalance(null);
      }
    };
    getBalance();
  }, [connected, publicKey, connection]); // Removed showFeedback from deps for now

  const fetchAvailableRooms = useCallback(async () => {
    if (!program) {
      // Do not show error if program is simply not yet initialized
      // showFeedback("Program not available to fetch rooms.", "error");
      setAvailableRooms([]);
      return;
    }

    showFeedback("Fetching available rooms...", "info");
    setIsLoading(true);

    try {
      console.log("Fetching all RoomData accounts...");
      const allRoomAccounts = await program.account.roomData.all();
      console.log(`Fetched ${allRoomAccounts.length} total RoomData accounts.`);

      const filteredRooms = allRoomAccounts.filter((room: RoomAccount) => {
        return (
          room.account.status &&
          (room.account.status.openForJoining !== undefined ||
            room.account.status.inProgress !== undefined)
        );
      });

      console.log(
        `Found ${filteredRooms.length} rooms 'OpenForJoining' or 'InProgress'.`
      );
      setAvailableRooms(filteredRooms as RoomAccount[]);

      showFeedback(
        filteredRooms.length > 0
          ? `Found ${filteredRooms.length} relevant room(s).`
          : "No open or in-progress rooms found.",
        filteredRooms.length > 0 ? "success" : "info"
      );
    } catch (error) {
      console.error("Error fetching available rooms:", error);
      showFeedback("Error fetching available rooms.", "error");
      setAvailableRooms([]);

      if (error && typeof error === "object" && "logs" in error) {
        console.log(
          "Program logs (fetch rooms):",
          (error as { logs: string[] }).logs
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [program, showFeedback, setAvailableRooms, setIsLoading]);

  // Fetch rooms when program is available or connection status changes
  useEffect(() => {
    // Fetch if program is ready. This covers initial load and cases where program becomes available later.
    // Also re-fetch if user connects/disconnects, as their ability to interact changes.
    if (program) {
      // Check if program is available before fetching
      fetchAvailableRooms();
    }
    // If you specifically only want to fetch when connected or program just loaded:
    // if (program && (connected || !availableRooms.length)) { // Example condition
    //   fetchAvailableRooms();
    // }
  }, [program, connected, fetchAvailableRooms]); // `program` dependency is indirect via fetchAvailableRooms

  async function createRoom() {
    if (!program || !anchorWallet || !anchorWallet.publicKey) {
      showFeedback("Wallet or program not available to create room.", "error");
      return;
    }

    const feeSOL = Number.parseFloat(entryFeeSOL);
    if (isNaN(feeSOL) || feeSOL <= 0) {
      showFeedback(
        "Invalid entry fee. Please enter a positive number for SOL.",
        "error"
      );
      return;
    }
    const entryFeeLamports = new BN(feeSOL * LAMPORTS_PER_SOL);

    try {
      setIsLoading(true);
      const seed = "sala" + Math.floor(Math.random() * 100000);
      const creator = anchorWallet.publicKey;
      const [roomDataPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("room"), creator.toBuffer(), Buffer.from(seed)],
        program.programId
      );

      const [roomVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), creator.toBuffer(), Buffer.from(seed)],
        program.programId
      );

      await program.methods
        .createRoom(seed, new BN(10), entryFeeLamports)
        .accountsPartial({
          creator,
          roomData: roomDataPDA,
          roomVault: roomVaultPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      showFeedback(`Room created successfully with seed: ${seed}`, "success");
      fetchAvailableRooms();
    } catch (error) {
      console.error("Error creating room:", error);
      showFeedback(
        `Error creating room: ${
          error instanceof Error ? error.message : String(error)
        }`,
        "error"
      );

      if (error && typeof error === "object" && "logs" in error) {
        console.log("Program logs:", (error as { logs: string[] }).logs);
      }
      if (error && typeof error === "object" && "signature" in error) {
        console.log(
          "Transaction signature:",
          (error as { signature: string }).signature
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoinRoom(roomToJoin: RoomAccount) {
    if (!program || !anchorWallet || !anchorWallet.publicKey) {
      showFeedback("Wallet or program not available to join room.", "error");
      return;
    }

    const roomSeed = roomToJoin.account.roomSeed;
    const roomCreatorPublicKey = roomToJoin.account.creator;

    showFeedback(`Attempting to join room with seed: ${roomSeed}...`, "info");
    setIsLoading(true);

    try {
      const roomDataPDA = roomToJoin.publicKey;
      const [roomVaultPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vault"),
          roomCreatorPublicKey.toBuffer(),
          Buffer.from(roomSeed),
        ],
        program.programId
      );

      console.log(`Attempting to join room: ${roomSeed}`);
      console.log(`Player (self): ${anchorWallet.publicKey.toString()}`);
      console.log(`Room Data PDA: ${roomDataPDA.toString()}`);
      console.log(`Room Vault PDA: ${roomVaultPDA.toString()}`);
      console.log(`Room Creator: ${roomCreatorPublicKey.toString()}`);

      await program.methods
        .joinRoom(roomSeed)
        .accountsPartial({
          player: anchorWallet.publicKey,
          roomData: roomDataPDA,
          roomVault: roomVaultPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      showFeedback(`Successfully joined room: ${roomSeed}!`, "success");
      console.log(`Successfully joined room: ${roomSeed}`);
      fetchAvailableRooms();
    } catch (error) {
      console.error("Error joining room:", error);
      showFeedback(
        `Error joining room ${roomSeed}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        "error"
      );

      if (error && typeof error === "object" && "logs" in error) {
        console.log(
          "Program logs (join room):",
          (error as { logs: string[] }).logs
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCancelRoom(roomToCancel: RoomAccount) {
    if (!program || !anchorWallet || !anchorWallet.publicKey) {
      showFeedback("Wallet or program not available to cancel room.", "error");
      return;
    }

    if (!anchorWallet.publicKey.equals(roomToCancel.account.creator)) {
      showFeedback("Only the room creator can cancel the room.", "error");
      return;
    }

    if (roomToCancel.account.players.length > 0) {
      showFeedback("Cannot cancel a room that has players.", "error");
      return;
    }

    const isCancellableStatus =
      roomToCancel.account.status.openForJoining !== undefined ||
      roomToCancel.account.status.created !== undefined;

    if (!isCancellableStatus) {
      showFeedback(
        "Room is not in a state that allows cancellation (must be OpenForJoining or Created).",
        "error"
      );
      return;
    }

    const roomSeed = roomToCancel.account.roomSeed;
    showFeedback(`Attempting to cancel room with seed: ${roomSeed}...`, "info");
    setIsLoading(true);

    try {
      const roomDataPDA = roomToCancel.publicKey;
      const [roomVaultPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vault"),
          roomToCancel.account.creator.toBuffer(),
          Buffer.from(roomSeed),
        ],
        program.programId
      );

      await program.methods
        .cancelRoom(roomSeed)
        .accountsPartial({
          creator: anchorWallet.publicKey,
          roomData: roomDataPDA,
          roomVault: roomVaultPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      showFeedback(`Successfully cancelled room: ${roomSeed}!`, "success");
      console.log(`Successfully cancelled room: ${roomSeed}`);
      fetchAvailableRooms();
    } catch (error) {
      console.error("Error cancelling room:", error);
      showFeedback(
        `Error cancelling room ${roomSeed}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        "error"
      );

      if (error && typeof error === "object" && "logs" in error) {
        console.log(
          "Program logs (cancel room):",
          (error as { logs: string[] }).logs
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAnnounceWinner(roomToWin: RoomAccount) {
    if (!program || !anchorWallet || !anchorWallet.publicKey) {
      showFeedback(
        "Wallet or program not available to announce winner.",
        "error"
      );
      return;
    }

    if (!anchorWallet.publicKey.equals(roomToWin.account.creator)) {
      showFeedback("Only the room creator can announce the winner.", "error");
      return;
    }

    if (!roomToWin.account.status.inProgress) {
      showFeedback("Room is not in progress. Cannot announce winner.", "error");
      return;
    }

    const selectedWinnerPubKeyString =
      selectedWinners[roomToWin.publicKey.toString()];
    if (!selectedWinnerPubKeyString) {
      showFeedback("Please select a winner for the room.", "error");
      return;
    }

    const winnerPublicKey = new PublicKey(selectedWinnerPubKeyString);

    if (
      !roomToWin.account.players.some((player) =>
        player.equals(winnerPublicKey)
      )
    ) {
      showFeedback(
        "Selected winner is not a valid player in this room.",
        "error"
      );
      return;
    }

    const roomSeed = roomToWin.account.roomSeed;
    showFeedback(`Announcing winner for room: ${roomSeed}...`, "info");
    setIsLoading(true);

    try {
      const roomDataPDA = roomToWin.publicKey;
      const [roomVaultPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vault"),
          roomToWin.account.creator.toBuffer(),
          Buffer.from(roomSeed),
        ],
        program.programId
      );

      await program.methods
        .announceWinner(roomSeed, winnerPublicKey)
        .accountsPartial({
          creator: anchorWallet.publicKey,
          roomData: roomDataPDA,
          roomVault: roomVaultPDA,
          winnerAccount: winnerPublicKey,
          serviceFeeRecipient: SERVICE_WALLET_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      showFeedback(
        `Successfully announced winner for room: ${roomSeed}! Winner: ${winnerPublicKey
          .toString()
          .slice(0, 8)}...`,
        "success"
      );
      console.log(`Successfully announced winner for room: ${roomSeed}`);
      fetchAvailableRooms();
      setSelectedWinners((prev) => ({
        ...prev,
        [roomToWin.publicKey.toString()]: "",
      }));
    } catch (error) {
      console.error("Error announcing winner:", error);
      showFeedback(
        `Error announcing winner for room ${roomSeed}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        "error"
      );

      if (error && typeof error === "object" && "logs" in error) {
        console.log(
          "Program logs (announce winner):",
          (error as { logs: string[] }).logs
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStartRoom(roomToStart: RoomAccount) {
    if (!program || !anchorWallet || !anchorWallet.publicKey) {
      showFeedback("Wallet or program not available.", "error");
      return;
    }

    if (!anchorWallet.publicKey.equals(roomToStart.account.creator)) {
      showFeedback("Only the room creator can start the room.", "error");
      return;
    }

    if (
      !(
        roomToStart.account.status.openForJoining !== undefined ||
        roomToStart.account.status.created !== undefined
      )
    ) {
      showFeedback(
        "Room must be OpenForJoining or Created to be started.",
        "error"
      );
      return;
    }

    const roomSeed = roomToStart.account.roomSeed;
    showFeedback(`Starting room ${roomSeed}...`, "info");
    setIsLoading(true);

    try {
      await program.methods
        .startRoom(roomSeed)
        .accountsPartial({
          creator: anchorWallet.publicKey,
          roomData: roomToStart.publicKey,
        })
        .rpc();

      showFeedback(
        `Room ${roomSeed} successfully started and is now InProgress!`,
        "success"
      );
      console.log(`Room ${roomSeed} set to InProgress.`);
      fetchAvailableRooms();
    } catch (error) {
      console.error("Error starting room:", error);
      showFeedback(
        `Error starting room ${roomSeed}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        "error"
      );

      if (error && typeof error === "object" && "logs" in error) {
        console.log(
          "Program logs (start room):",
          (error as { logs: string[] }).logs
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleWinnerSelectionChange = (
    roomPubKey: string,
    winnerPubKey: string
  ) => {
    setSelectedWinners((prev) => ({ ...prev, [roomPubKey]: winnerPubKey }));
  };

  const truncateAddress = (address: string, length = 4) => {
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "openForJoining":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            <Users className="w-3 h-3 mr-1" />
            Open For Joining
          </span>
        );
      case "inProgress":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
            <Play className="w-3 h-3 mr-1" />
            In Progress
          </span>
        );
      case "created":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
            <Clock className="w-3 h-3 mr-1" />
            Created
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-600 via-orange-500 to-yellow-400 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-2">Palapa 🌴</h1>
          <p className="text-lg text-yellow-100">
            Create and join games with prize pools distributed to winners
          </p>
        </header>

        {/* Feedback Message */}
        {feedbackMessage && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center ${
              feedbackType === "success"
                ? "bg-green-600/70 text-green-100 border border-green-400"
                : feedbackType === "error"
                ? "bg-red-600/70 text-red-100 border border-red-400"
                : "bg-orange-600/70 text-orange-100 border border-orange-400"
            }`}
          >
            {feedbackType === "success" ? (
              <Trophy className="w-5 h-5 mr-2" />
            ) : feedbackType === "error" ? (
              <AlertCircle className="w-5 h-5 mr-2" />
            ) : (
              <RefreshCw
                className={`w-5 h-5 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
            )}
            <p>{feedbackMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Wallet and Create Room */}
          <div className="lg:col-span-1 space-y-6">
            {/* Wallet Information Section */}
            <div className="bg-rose-900/60 backdrop-blur-sm p-6 rounded-xl border border-pink-500/50 shadow-xl">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <Wallet className="w-5 h-5 mr-2 text-pink-300" />
                Wallet
              </h2>

              {connected && publicKey ? (
                <div className="space-y-3">
                  <div className="bg-rose-800/80 rounded-lg p-3 border border-rose-600/50">
                    <p className="text-xs text-rose-300 mb-1">
                      Connected Address
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-sm text-pink-200 truncate">
                        {truncateAddress(publicKey.toString(), 8)}
                      </p>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(publicKey.toString())
                        }
                        className="text-pink-300 hover:text-pink-200 transition-colors"
                        title="Copy address"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-rose-800/80 rounded-lg p-3 border border-rose-600/50">
                    <p className="text-xs text-rose-300 mb-1">SOL Balance</p>
                    {isBalanceLoading ? (
                      <div className="flex items-center">
                        <RefreshCw className="w-4 h-4 animate-spin mr-2 text-pink-300" />
                        <span className="text-sm text-rose-300">
                          Loading...
                        </span>
                      </div>
                    ) : solBalance !== null ? (
                      <p className="font-mono text-sm text-pink-200">
                        {solBalance.toFixed(4)} SOL
                      </p>
                    ) : (
                      <p className="text-sm text-rose-400">N/A</p>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-rose-200 flex items-center">
                      <CircleCheck className="w-4 h-4 text-green-400 mr-2" />
                      Connected
                    </span>
                    <button
                      onClick={walletDisconnect}
                      className="flex items-center text-sm text-red-300 hover:text-red-200 transition-colors py-1 px-2 rounded-md bg-red-700/50 hover:bg-red-600/50 border border-red-500/50"
                    >
                      <LogOut className="w-3 h-3 mr-1.5" />
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 bg-rose-800/50 rounded-lg border border-rose-600">
                  <Wallet className="w-12 h-12 mx-auto text-rose-400 mb-3" />
                  <p className="text-rose-300 mb-3">No wallet connected</p>
                  <p className="text-rose-400 text-sm mb-4">
                    Please connect your wallet to create or join games
                  </p>
                  <button
                    className="py-2 px-4 bg-pink-600 hover:bg-pink-700 rounded-lg text-sm font-medium transition-all"
                    onClick={() => setWalletModalVisible(true)}
                  >
                    Connect Wallet
                  </button>
                </div>
              )}
            </div>

            {/* Create Room Section */}
            <div className="bg-rose-900/60 backdrop-blur-sm p-6 rounded-xl border border-pink-500/50 shadow-xl">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-pink-300" />
                Create New Game Room
              </h2>

              <div className="mb-6">
                <label
                  htmlFor="entryFee"
                  className="block text-sm font-medium mb-2 text-pink-200"
                >
                  Entry Fee (SOL)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Coins className="h-5 w-5 text-pink-300" />
                  </div>
                  <input
                    type="number"
                    id="entryFee"
                    value={entryFeeSOL}
                    onChange={(e) => setEntryFeeSOL(e.target.value)}
                    min="0.000000001"
                    step="0.01"
                    className="bg-rose-800 border border-pink-500/50 text-white pl-10 py-3 px-4 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
              </div>

              <button
                onClick={createRoom}
                disabled={isLoading || !anchorWallet}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  isLoading || !anchorWallet
                    ? "bg-gray-700 cursor-not-allowed"
                    : "bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 shadow-lg hover:shadow-pink-500/20"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Creating...
                  </span>
                ) : (
                  "Create Game Room"
                )}
              </button>
            </div>
          </div>

          {/* Room Management Section */}
          <div className="lg:col-span-2">
            <div className="bg-rose-900/60 backdrop-blur-sm p-6 rounded-xl border border-pink-500/50 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center">
                  <Users className="w-5 h-5 mr-2 text-pink-300" />
                  Game Rooms
                </h2>
                <button
                  onClick={fetchAvailableRooms}
                  disabled={isLoading}
                  className={`flex items-center py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    isLoading
                      ? "bg-gray-700 cursor-not-allowed"
                      : "bg-orange-600 hover:bg-orange-700"
                  }`}
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  />
                  Refresh Rooms
                </button>
              </div>

              {availableRooms.length === 0 ? (
                <div className="text-center py-10 bg-rose-800/50 rounded-lg border border-rose-600">
                  <Users className="w-12 h-12 mx-auto text-rose-400 mb-3" />
                  <p className="text-rose-300">
                    No game rooms available currently.
                  </p>
                  <p className="text-rose-400 text-sm mt-2">
                    Create a new room or refresh the list.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {availableRooms.map((room) => (
                    <div
                      key={room.publicKey.toString()}
                      className="bg-rose-800/80 rounded-lg border border-rose-600/50 overflow-hidden transition-all hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-500/10"
                    >
                      <div className="p-4 border-b border-rose-600/50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium text-lg">
                              Room: {room.account.roomSeed}
                            </h3>
                            <p className="text-xs text-rose-300">
                              ID:{" "}
                              {truncateAddress(room.publicKey.toString(), 6)}
                            </p>
                          </div>
                          <div>
                            {getStatusBadge(
                              Object.keys(room.account.status)[0]
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="flex items-center text-sm text-rose-200">
                            <User className="w-4 h-4 mr-2 text-pink-300" />
                            <span>
                              Creator:{" "}
                              {truncateAddress(room.account.creator.toString())}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-rose-200">
                            <Coins className="w-4 h-4 mr-2 text-pink-300" />
                            <span>
                              Entry Fee:{" "}
                              {room.account.entryFee.toNumber() /
                                LAMPORTS_PER_SOL}{" "}
                              SOL
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-rose-200">
                            <Users className="w-4 h-4 mr-2 text-pink-300" />
                            <span>
                              Players: {room.account.players.length} /{" "}
                              {room.account.maxPlayers}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-rose-200">
                            <Calendar className="w-4 h-4 mr-2 text-pink-300" />
                            <span>
                              Created:{" "}
                              {new Date(
                                room.account.creationTimestamp.toNumber() * 1000
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-rose-800/30 flex flex-wrap gap-2">
                        {/* Join Room Button */}
                        {room.account.status.openForJoining !== undefined && (
                          <button
                            onClick={() => handleJoinRoom(room)}
                            disabled={
                              isLoading ||
                              !connected ||
                              !program ||
                              room.account.players.length >=
                                room.account.maxPlayers
                            }
                            className={`flex items-center py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                              isLoading ||
                              !connected ||
                              !program ||
                              room.account.players.length >=
                                room.account.maxPlayers
                                ? "bg-gray-700 cursor-not-allowed"
                                : "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                            }`}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Join Game ({room.account.players.length}/
                            {room.account.maxPlayers})
                          </button>
                        )}

                        {/* Cancel Room Button */}
                        {connected &&
                          anchorWallet &&
                          room.account.creator.equals(anchorWallet.publicKey) &&
                          (room.account.status.openForJoining !== undefined ||
                            room.account.status.created !== undefined) &&
                          room.account.players.length === 0 && (
                            <button
                              onClick={() => handleCancelRoom(room)}
                              disabled={isLoading || !program}
                              className={`flex items-center py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                                isLoading || !program
                                  ? "bg-gray-700 cursor-not-allowed"
                                  : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                              }`}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel Game
                            </button>
                          )}

                        {/* Start Room Button */}
                        {connected &&
                          anchorWallet &&
                          room.account.creator.equals(anchorWallet.publicKey) &&
                          (room.account.status.openForJoining !== undefined ||
                            room.account.status.created !== undefined) &&
                          room.account.status.inProgress === undefined && (
                            <button
                              onClick={() => handleStartRoom(room)}
                              disabled={isLoading || !program}
                              className={`flex items-center py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                                isLoading || !program
                                  ? "bg-gray-700 cursor-not-allowed"
                                  : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                              }`}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Start Game
                            </button>
                          )}
                      </div>

                      {/* Announce Winner Section */}
                      {connected &&
                        anchorWallet &&
                        room.account.creator.equals(anchorWallet.publicKey) &&
                        room.account.status.inProgress !== undefined &&
                        room.account.players.length > 0 && (
                          <div className="p-4 bg-gradient-to-r from-pink-800/40 to-orange-800/40 border-t border-pink-600/30">
                            <h4 className="text-sm font-medium mb-3 flex items-center">
                              <Award className="w-4 h-4 mr-2 text-yellow-300" />
                              Announce Winner
                            </h4>

                            {room.account.players.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                <select
                                  value={
                                    selectedWinners[
                                      room.publicKey.toString()
                                    ] || ""
                                  }
                                  onChange={(e) =>
                                    handleWinnerSelectionChange(
                                      room.publicKey.toString(),
                                      e.target.value
                                    )
                                  }
                                  className="bg-rose-800 border border-pink-500/50 text-white py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 flex-grow"
                                >
                                  <option value="" disabled>
                                    Select a winner...
                                  </option>
                                  {room.account.players.map((player) => (
                                    <option
                                      key={player.toString()}
                                      value={player.toString()}
                                    >
                                      {truncateAddress(player.toString(), 8)}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  onClick={() => handleAnnounceWinner(room)}
                                  disabled={
                                    isLoading ||
                                    !program ||
                                    !selectedWinners[room.publicKey.toString()]
                                  }
                                  className={`flex items-center py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                                    isLoading ||
                                    !program ||
                                    !selectedWinners[room.publicKey.toString()]
                                      ? "bg-gray-700 cursor-not-allowed"
                                      : "bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-rose-900 font-bold"
                                  }`}
                                >
                                  <Trophy className="w-4 h-4 mr-2" />
                                  Announce Winner
                                </button>
                              </div>
                            ) : (
                              <p className="text-sm text-rose-300">
                                No players in this room to select a winner from.
                              </p>
                            )}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
