# Palapa 🌴 - Solana Game Room Frontend

Palapa allows users to connect their Solana wallets, create game rooms with entry fees, join existing rooms, and (for room creators) manage the game lifecycle, including starting the game and announcing a winner to distribute the prize pool.

---

**🚀 Live Demo:** [**palapa-front.vercel.app**](https://palapa-front.vercel.app/)
**📺 Technical demo:** [**youtube.com/V7Nw-Z2dEVY**](https://youtu.be/V7Nw-Z2dEVY)

---

## ✨ Features

- **Wallet Integration:** Seamless connection with Solana wallets (Phantom pre-configured) using `@solana/wallet-adapter`.
- **Account Information:** Displays connected wallet address and SOL balance.
- **Create Game Rooms:** Users can create new game rooms, specifying an entry fee in SOL.
- **List Available Rooms:** Fetches and displays game rooms that are `OpenForJoining` or `InProgress`.
- **Join Game Rooms:** Users can join `OpenForJoining` rooms by paying the specified entry fee.
- **Room Management (Creator-only):**
  - **Start Game:** Creators can transition a room from `OpenForJoining` or `Created` to `InProgress`.
  - **Cancel Game:** Creators can cancel their rooms if they are `OpenForJoining` or `Created` and have no players. Funds are handled by the smart contract.
  - **Announce Winner:** Creators can select a player from an `InProgress` room to be the winner. The smart contract then handles prize distribution (minus a service fee).
- **Real-time Feedback:** Informative messages for actions (success, error, loading).
- **Responsive UI:** Styled with Tailwind CSS for a modern and responsive experience across devices.
- **Typed & Robust:** Built with TypeScript and React 19 for type safety and modern React features.

## 🛠️ Tech Stack

- **Frontend:**
  - [React 19](https://react.dev/)
  - [Vite](https://vitejs.dev/) (Build Tool & Dev Server)
  - [TypeScript](https://www.typescriptlang.org/)
  - [Tailwind CSS](https://tailwindcss.com/) (Utility-first CSS framework)
  - [Lucide React](https://lucide.dev/) (Icons)
- **Solana Integration:**
  - [@solana/web3.js](https://solana-labs.github.io/solana-web3.js/): Solana JavaScript API.
  - [@solana/wallet-adapter](https://github.com/solana-labs/wallet-adapter): Wallet connectivity.
  - [@coral-xyz/anchor](https://www.anchor-lang.com/): Client library for interacting with Anchor-based Solana programs.
- **Development:**
  - [ESLint](https://eslint.org/): Code linting.
  - [Prettier](https://prettier.io/) (Implicitly via ESLint integration): Code formatting.

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A Solana Wallet Browser Extension (e.g., [Phantom](https://phantom.app/))
- Some Devnet SOL in your wallet for testing transactions. You can get Devnet SOL from faucets like [solfaucet.com](https://solfaucet.com/).

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Gabsplat/Palapa-front
    cd palapa-frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

### Running the Project

1.  **Start the development server:**

    ```bash
    npm run dev
    # or
    yarn dev
    ```

    This will start the Vite development server, typically on `http://localhost:5173`.

2.  **Open your browser** and navigate to the provided local URL.

3.  **Connect your Solana wallet** (ensure it's set to Devnet).

## 🎮 Usage & Key Functionality

<!-- You can add screenshots for each step here -->

### 1. Wallet Connection

- Click the "Connect Wallet" button.
- Select your preferred wallet (Phantom is pre-configured) from the modal.
- Approve the connection in your wallet extension.
- Once connected, your wallet address and SOL balance will be displayed.

### 2. Creating a Game Room

- In the "Create New Game Room" section:
  - Enter the desired "Entry Fee (SOL)" for your game.
  - Click "Create Game Room".
- Your wallet will prompt you to approve the transaction.
- Upon success, a feedback message will appear, and the new room will be listed under "Game Rooms".

### 3. Viewing and Joining Game Rooms

- The "Game Rooms" section lists all rooms that are `OpenForJoining` or `InProgress`.
- Each room card displays:
  - Room Seed (name) & ID
  - Status (OpenForJoining, InProgress, Created)
  - Creator's address
  - Entry Fee
  - Current Players / Max Players
  - Creation Timestamp
- To join an `OpenForJoining` room:
  - Click the "Join Game" button on the room card.
  - Approve the transaction in your wallet (this will transfer the entry fee to the room's vault).
- The player count will update, and you'll be listed as a player (though individual player lists aren't explicitly shown in this UI version, the count updates).

### 4. Managing Your Rooms (Creator Only)

If you are the creator of a room, additional management buttons will be available:

- **Start Game:**
  - Available if the room is `OpenForJoining` or `Created`.
  - Clicking "Start Game" changes the room's status to `InProgress`. No further players can join.
- **Cancel Game:**
  - Available if the room is `OpenForJoining` or `Created` AND has **zero** players.
  - Clicking "Cancel Game" will remove the room. The smart contract should handle the return of any funds if applicable (though in this flow, it's for rooms with no players/fees collected beyond creator's initial setup).
- **Announce Winner:**
  - Available if the room is `InProgress` and has at least one player.
  - A dropdown will appear listing all players in the room.
  - Select a winner from the dropdown.
  - Click "Announce Winner".
  - Approve the transaction. The smart contract will:
    - Mark the selected player as the winner.
    - Transfer the total prize pool (sum of all entry fees) from the room's vault to the winner's account, minus a service fee which is sent to the `SERVICE_WALLET_PUBKEY`.
  - The room will likely transition to a `Finished` or `Completed` state (or be removed from the "available" list based on the `fetchAvailableRooms` filter).

### 5. Refreshing Data

- Click the "Refresh Rooms" button to fetch the latest list of game rooms.
- SOL balance typically updates on connection or major state changes, but a manual refresh might be implemented if needed.

## 🏗️ Smart Contract Interaction

This frontend is designed to interact with a Solana smart contract built with the Anchor framework. The key aspects of this interaction are:

- **Program Initialization:** The `useProgram()` hook initializes the Anchor program client using the contract's IDL (Interface Definition Language) and Program ID.
- **Account Structures:** The frontend `RoomAccount` interface (in `App.tsx`) mirrors the `RoomData` account structure defined in the smart contract's IDL. This includes fields like `creator`, `roomSeed`, `status`, `entryFee`, `players`, etc.
- **PDA Derivation:** Public Key Derivation Addresses (PDAs) for `RoomData` and `RoomVault` accounts are calculated on the frontend using seeds, mirroring the logic in the smart contract.
- **Instruction Calls:** Functions like `createRoom`, `joinRoom`, `cancelRoom`, `startRoom`, and `announceWinner` in `App.tsx` map directly to instructions in the smart contract. They construct the necessary accounts and arguments and then call `program.methods.<instructionName>(...).rpc()`.
- **Service Fee:** The `announceWinner` function includes a `serviceFeeRecipient` account (`SERVICE_WALLET_PUBKEY`), indicating that the smart contract likely deducts a percentage or fixed fee from the prize pool before distributing it to the winner.

**Note:** This repository contains the frontend code only. The corresponding Solana smart contract is deployed separately.

## 📁 Project Structure

```
palapa-frontend/
├── public/                     # Static assets
├── src/
│   ├── components/             # (Optional) Reusable UI components
│   ├── context/
│   │   └── SolanaContext.tsx   # Solana wallet and connection providers
│   ├── hooks/
│   │   └── useProgram.ts       # Hook to initialize Anchor program client
│   ├── App.tsx                 # Main application component and logic
│   ├── main.tsx                # Application entry point
│   ├── index.css               # Tailwind CSS base, components, utilities
│   └── ...                     # Other TypeScript/React files
├── .eslintrc.cjs               # ESLint configuration
├── index.html                  # Main HTML file
├── package.json                # Project metadata and dependencies
├── postcss.config.mjs          # PostCSS configuration
├── tailwind.config.mjs         # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── tsconfig.node.json          # TypeScript Node configuration
└── vite.config.ts              # Vite configuration
```

## 🎨 Styling

The application uses [Tailwind CSS](https://tailwindcss.com/) for styling. Customizations and base styles are configured in `tailwind.config.mjs` and `index.css`. The UI features a vibrant gradient background and themed components.

## 🔗 Solana Configuration (`SolanaContext.tsx`)

- **Network:** Configured to use `WalletAdapterNetwork.Devnet`.
- **Endpoint:** Dynamically determined using `clusterApiUrl(network)`.
- **Wallets:** Pre-configured with `PhantomWalletAdapter`. More wallets can be added to the `wallets` array.
- **Providers:** Wraps the application with `ConnectionProvider`, `WalletProvider`, and `WalletModalProvider` for Solana connectivity and UI.

---

_Happy Gaming on Solana!_ 🌴☀️
