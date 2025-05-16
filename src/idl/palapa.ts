/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/palapa_fun_rooms.json`.
 */
export type PalapaFunRooms = {
  address: "Fu5sXvLemQ5meB4y3GWM4oacD2uDwbF8URFh2WpmCMeR";
  metadata: {
    name: "palapaFunRooms";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "announceWinner";
      docs: [
        "Called by the room creator to declare the winner and distribute the vault funds."
      ];
      discriminator: [52, 243, 52, 32, 196, 187, 186, 237];
      accounts: [
        {
          name: "creator";
          writable: true;
          signer: true;
          relations: ["roomData"];
        },
        {
          name: "roomData";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [114, 111, 111, 109];
              },
              {
                kind: "account";
                path: "creator";
              },
              {
                kind: "arg";
                path: "roomSeed";
              }
            ];
          };
        },
        {
          name: "roomVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "creator";
              },
              {
                kind: "arg";
                path: "roomSeed";
              }
            ];
          };
        },
        {
          name: "winnerAccount";
          writable: true;
        },
        {
          name: "serviceFeeRecipient";
          writable: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "roomSeed";
          type: "string";
        },
        {
          name: "winnerPubkey";
          type: "pubkey";
        }
      ];
    },
    {
      name: "cancelRoom";
      docs: [
        "Allows the creator to cancel a room IF it's OpenForJoining/Created AND has no players."
      ];
      discriminator: [91, 107, 215, 178, 200, 224, 241, 237];
      accounts: [
        {
          name: "creator";
          writable: true;
          signer: true;
          relations: ["roomData"];
        },
        {
          name: "roomData";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [114, 111, 111, 109];
              },
              {
                kind: "account";
                path: "creator";
              },
              {
                kind: "arg";
                path: "roomSeed";
              }
            ];
          };
        },
        {
          name: "roomVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "creator";
              },
              {
                kind: "arg";
                path: "roomSeed";
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "roomSeed";
          type: "string";
        }
      ];
    },
    {
      name: "createRoom";
      docs: ["Creates a new game room associated with the creator."];
      discriminator: [130, 166, 32, 2, 247, 120, 178, 53];
      accounts: [
        {
          name: "creator";
          writable: true;
          signer: true;
        },
        {
          name: "roomData";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [114, 111, 111, 109];
              },
              {
                kind: "account";
                path: "creator";
              },
              {
                kind: "arg";
                path: "roomSeed";
              }
            ];
          };
        },
        {
          name: "roomVault";
          docs: [
            "Space is 0, owner is SystemProgram. Anchor handles the init checks.",
            "It only holds lamports transferred via CPI, used solely as a vault."
          ];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "creator";
              },
              {
                kind: "arg";
                path: "roomSeed";
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "roomSeed";
          type: "string";
        },
        {
          name: "maxPlayers";
          type: "u16";
        },
        {
          name: "entryFee";
          type: "u64";
        }
      ];
    },
    {
      name: "joinRoom";
      docs: [
        "Allows a player to join an existing, open room by paying the entry fee."
      ];
      discriminator: [95, 232, 188, 81, 124, 130, 78, 139];
      accounts: [
        {
          name: "player";
          writable: true;
          signer: true;
        },
        {
          name: "roomData";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [114, 111, 111, 109];
              },
              {
                kind: "account";
                path: "room_data.creator";
                account: "roomData";
              },
              {
                kind: "arg";
                path: "roomSeed";
              }
            ];
          };
        },
        {
          name: "roomVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "room_data.creator";
                account: "roomData";
              },
              {
                kind: "arg";
                path: "roomSeed";
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "roomSeed";
          type: "string";
        }
      ];
    },
    {
      name: "startRoom";
      docs: [
        "Allows the room creator to start the game if it's open for joining.",
        "This is typically used if the room doesn't fill up to max_players but the creator wants to proceed."
      ];
      discriminator: [1, 255, 77, 194, 171, 170, 62, 248];
      accounts: [
        {
          name: "creator";
          writable: true;
          signer: true;
          relations: ["roomData"];
        },
        {
          name: "roomData";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [114, 111, 111, 109];
              },
              {
                kind: "account";
                path: "creator";
              },
              {
                kind: "arg";
                path: "roomSeed";
              }
            ];
          };
        }
      ];
      args: [
        {
          name: "roomSeed";
          type: "string";
        }
      ];
    }
  ];
  accounts: [
    {
      name: "roomData";
      discriminator: [176, 166, 69, 139, 32, 227, 244, 146];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "invalidMaxPlayers";
      msg: "Invalid number of maximum players specified (must be > 1).";
    },
    {
      code: 6001;
      name: "invalidEntryFee";
      msg: "Entry fee must be greater than zero.";
    },
    {
      code: 6002;
      name: "invalidRoomSeed";
      msg: "Room seed is invalid (empty or too long).";
    },
    {
      code: 6003;
      name: "bumpSeedNotFound";
      msg: "Could not find PDA bump seed.";
    },
    {
      code: 6004;
      name: "roomNotJoinable";
      msg: "Room is not in the correct state to be joined.";
    },
    {
      code: 6005;
      name: "roomFull";
      msg: "The room is already full.";
    },
    {
      code: 6006;
      name: "playerAlreadyJoined";
      msg: "This player has already joined the room.";
    },
    {
      code: 6007;
      name: "roomNotInProgress";
      msg: "The room is not in progress, cannot announce winner.";
    },
    {
      code: 6008;
      name: "winnerNotInRoom";
      msg: "The declared winner is not listed as a player in this room.";
    },
    {
      code: 6009;
      name: "winnerAccountMismatch";
      msg: "The provided winner account does not match the winner pubkey.";
    },
    {
      code: 6010;
      name: "vaultNotEmptyAfterPayout";
      msg: "Vault account was not empty after payout/recovery. Check transfer logic.";
    },
    {
      code: 6011;
      name: "unauthorized";
      msg: "Unauthorized: Only the room creator can perform this action.";
    },
    {
      code: 6012;
      name: "cannotCancelRoomState";
      msg: "Room cannot be cancelled in its current state (must be Open/Created).";
    },
    {
      code: 6013;
      name: "cannotCancelRoomPlayersJoined";
      msg: "Room cannot be cancelled because players have already joined.";
    },
    {
      code: 6014;
      name: "calculationOverflow";
      msg: "Arithmetic overflow during fee or payout calculation.";
    },
    {
      code: 6015;
      name: "invalidServiceWallet";
      msg: "The provided service fee recipient account does not match the expected address.";
    },
    {
      code: 6016;
      name: "insufficientFundsForPayout";
      msg: "Insufficient funds in vault to cover calculated fees and payout (negative prize share).";
    },
    {
      code: 6017;
      name: "maxPlayersExceedsLimit";
      msg: "Requested max players exceeds the program's limit used for space allocation.";
    },
    {
      code: 6018;
      name: "invalidCreator";
      msg: "Invalid Creator account provided for seed derivation.";
    },
    {
      code: 6019;
      name: "roomNotOpenForStarting";
      msg: "Room is not in the OpenForJoining state, cannot be started.";
    }
  ];
  types: [
    {
      name: "roomData";
      type: {
        kind: "struct";
        fields: [
          {
            name: "creator";
            type: "pubkey";
          },
          {
            name: "roomSeed";
            type: "string";
          },
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "vaultBump";
            type: "u8";
          },
          {
            name: "status";
            type: {
              defined: {
                name: "roomStatus";
              };
            };
          },
          {
            name: "winner";
            type: {
              option: "pubkey";
            };
          },
          {
            name: "maxPlayers";
            type: "u16";
          },
          {
            name: "entryFee";
            type: "u64";
          },
          {
            name: "players";
            type: {
              vec: "pubkey";
            };
          },
          {
            name: "creationTimestamp";
            type: "i64";
          },
          {
            name: "endTimestamp";
            type: {
              option: "i64";
            };
          }
        ];
      };
    },
    {
      name: "roomStatus";
      type: {
        kind: "enum";
        variants: [
          {
            name: "created";
          },
          {
            name: "openForJoining";
          },
          {
            name: "inProgress";
          },
          {
            name: "finished";
          },
          {
            name: "cancelled";
          }
        ];
      };
    }
  ];
};
