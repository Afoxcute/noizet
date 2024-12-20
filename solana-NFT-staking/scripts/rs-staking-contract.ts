import * as anchor from '@project-serum/anchor';
import {
    PublicKey,
    Signer,
    Keypair,
    Connection,
    TransactionSignature,
    Transaction,
    SystemProgram,
    SYSVAR_CLOCK_PUBKEY,
    SYSVAR_RENT_PUBKEY,
    sendAndConfirmTransaction,
    clusterApiUrl,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import bs58 from 'bs58';
import { IDL } from "../target/types/rs_staking_program";
import * as Constants from "./constants";
import * as Keys from "./keys";
import NodeWallet from '@project-serum/anchor/dist/cjs/nodewallet';

let networkUrl = clusterApiUrl(Constants.NETWORK);
console.log(networkUrl);
let connection = new Connection(networkUrl, "singleGossip");
// let connection = new Connection("https://api.devnet.solana.com", "singleGossip");

// GTVhUEjJ2wpVAQuctQHqnL1FF5cciYreQ1qrw6mw8QXh
// const admin = anchor.web3.Keypair.fromSecretKey(bs58.decode("2FA5E9hrffdkZjYUfdhV5baUtL13bJjXcUosVyFYdbeqk62K2Efgc4Wj9AHMs4HmKAKwiYfm7gQrBXmBwgLcXL6T"));

// 7etbqNa25YWWQztHrwuyXtG39WnAqPszrGRZmEBPvFup
const admin = anchor.web3.Keypair.fromSecretKey(bs58.decode("4veSd6NyYiZUBcypTWUDojfHEjz5Da348zpcPDY4wuKZamMom24aSNtsNd5aQ9LzTXXpAKvQMnZhi9vXyMbFwxpe"));

let provider = new anchor.AnchorProvider(connection, new NodeWallet(admin), anchor.AnchorProvider.defaultOptions())
const program = new anchor.Program(IDL, Constants.PROGRAM_ID, provider);

const getTokenAccount = async (mintPk, userPk) => {
    let tokenAccount = await provider.connection.getProgramAccounts(
        TOKEN_PROGRAM_ID,
        {
            filters: [
                {
                    dataSize: 165
                },
                {
                    memcmp: {
                        offset: 0,
                        bytes: mintPk.toBase58()
                    }
                },
                {
                    memcmp: {
                        offset: 32,
                        bytes: userPk.toBase58()
                    }
                },
            ]
        }
    );
    return tokenAccount[0]?.pubkey;
}

const init = async () => {
    const txHash = await program.methods.initializeStakingPool(
        Constants.CLASS_TYPES,
        Constants.LOCK_DAY
    ).accounts(
        {
            admin: provider.wallet.publicKey,
            poolAccount: await Keys.getPoolKey(),
            rewardMint: Constants.SWRD_TOKEN_MINT,
            rewardVault: await Keys.getRewardVaultKey(Constants.SWRD_TOKEN_MINT),
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
        }
    ).rpc();

    let _pool_config = await program.account.poolConfig.fetch(await Keys.getPoolKey());
    console.log("Admin of contract = ", _pool_config.admin.toBase58());
    console.log("second class id: ", _pool_config.rewardPolicyByClass[1]);
    console.log('txHash =', txHash);
}

const updateSwardMint = async () => {
    let new_sward_mint = new PublicKey("");
    const txHash = await program.methods.changeRewardMint(
        new_sward_mint
    ).accounts(
        {
            admin: provider.wallet.publicKey,
            poolAccount: await Keys.getPoolKey(),
        }
    ).rpc();

    let _pool_config = await program.account.poolConfig.fetch(await Keys.getPoolKey());
    console.log("updated swrd mint pubkey: ", _pool_config.rewardMint.toBase58());
    console.log('txHash =', txHash);
}

const updateConfig = async () => {
    let class_type = Constants.CLASS_TYPES;
    let lock_day = 20;
    let paused = false;

    const txHash = await program.methods.changePoolSetting(
        class_type,
        lock_day,
        paused
    ).accounts(
        {
            admin: provider.wallet.publicKey,
            poolAccount: await Keys.getPoolKey(),
        }
    ).rpc();

    let _pool_config = await program.account.poolConfig.fetch(await Keys.getPoolKey());
    console.log("updated_lock_day = ", _pool_config.lockDay);
    console.log("paused = ", _pool_config.paused);
    console.log('txHash =', txHash);
}

const transferOwnership = async () => {
    let new_admin = new PublicKey("EkXepqW1WiDcJnGoWGtkeX2dduLavBw4q8YTskzBqPYZ"); //cgh
    const txHash = await program.methods.transferOwnership(
        new_admin
    ).accounts(
        {
            admin: provider.wallet.publicKey,
            poolAccount: await Keys.getPoolKey(),
        }
    ).rpc();

    let _pool_config = await program.account.poolConfig.fetch(await Keys.getPoolKey());
    console.log("updated_admin = ", _pool_config.admin.toBase58());
    console.log('txHash =', txHash);
}

const depositSWRD = async () => {
    const txHash = await program.methods.depositSwrd(
        new anchor.BN(5_000_000_000_000_000)
    ).accounts(
        {
            funder: admin.publicKey,
            rewardVault: await Keys.getRewardVaultKey(Constants.SWRD_TOKEN_MINT),
            funderAccount: await getSWRDAccount(),
            poolAccount: await Keys.getPoolKey(),
            rewardMint: Constants.SWRD_TOKEN_MINT,
            tokenProgram: TOKEN_PROGRAM_ID,
        }
    ).rpc();

    console.log('txHash =', txHash);
}

const withdrawSWRD = async () => {
    const txHash = await program.methods.withdrawSwrd()
        .accounts(
            {
                admin: admin.publicKey,
                poolAccount: await Keys.getPoolKey(),
                rewardVault: await Keys.getRewardVaultKey(Constants.SWRD_TOKEN_MINT),
                rewardToAccount: await getAssociatedTokenAccount(admin.publicKey, Constants.SWRD_TOKEN_MINT),
                rewardMint: Constants.SWRD_TOKEN_MINT,
                tokenProgram: TOKEN_PROGRAM_ID,
            }
        ).rpc();

    console.log('txHash =', txHash);
}

const getSWRDAccount = async () => {
    const funder_reward_account = await getTokenAccount(Constants.SWRD_TOKEN_MINT, admin.publicKey);
    // const _funder_reward_account = await provider.connection.getAccountInfo(funder_reward_account);
    console.log(`SWRD token account: ${funder_reward_account?.toBase58()}`);
    return funder_reward_account;
}

const stakeNFT = async () => {
    const mintPK = new PublicKey("5z695impWXPEtBuDvMnqy7yh45yvRtqEsE164NVFPqc7");
    const txHash = await program.methods.stakeNft(2)
        .accounts(
            {
                owner: admin.publicKey,
                poolAccount: await Keys.getPoolKey(),
                nftMint: mintPK,
                userNftTokenAccount: await getTokenAccount(mintPK, admin.publicKey),
                destNftTokenAccount: await Keys.getStakedNFTKey(mintPK),
                nftStakeInfoAccount: await Keys.getStakeInfoKey(mintPK),
                rent: SYSVAR_RENT_PUBKEY,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
            }
        ).rpc();
    console.log('txHash =', txHash);
}

const claimReward = async () => {
    const mintPK = new PublicKey("5z695impWXPEtBuDvMnqy7yh45yvRtqEsE164NVFPqc7");
    const reward_to_account = await getAssociatedTokenAccount(admin.publicKey, Constants.SWRD_TOKEN_MINT);
    console.log("reward_to_account: ", reward_to_account.toBase58());
    const txHash = await program.methods.claimReward()
        .accounts(
            {
                owner: admin.publicKey,
                poolAccount: await Keys.getPoolKey(),
                nftStakeInfoAccount: await Keys.getStakeInfoKey(mintPK),
                rewardMint: Constants.SWRD_TOKEN_MINT,
                rewardVault: await Keys.getRewardVaultKey(Constants.SWRD_TOKEN_MINT),
                rewardToAccount: reward_to_account,
                rent: SYSVAR_RENT_PUBKEY,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                nftMint: mintPK,
            }
        ).rpc();
    console.log('txHash =', txHash);
}

const withdrawNFT = async () => {
    const mintPK = new PublicKey("5z695impWXPEtBuDvMnqy7yh45yvRtqEsE164NVFPqc7");//("DdpEZxxfAj5tXUDCu8fdw6vs2vrmnx6KR7LdChTgr3Jz");
    const reward_to_account = await getAssociatedTokenAccount(admin.publicKey, Constants.SWRD_TOKEN_MINT);
    // const nft_to_account = await getNFTTokenAccount(mintPK);
    const nft_to_account = await getTokenAccount(mintPK, admin.publicKey);
    console.log("reward_to_account: ", reward_to_account.toBase58());
    console.log("nft_to_account: ", nft_to_account.toBase58());
    const txHash = await program.methods.withdrawNft()
        .accounts(
            {
                owner: admin.publicKey,
                poolAccount: await Keys.getPoolKey(),
                nftMint: mintPK,
                userNftTokenAccount: nft_to_account,
                stakedNftTokenAccount: await Keys.getStakedNFTKey(mintPK),
                nftStakeInfoAccount: await Keys.getStakeInfoKey(mintPK),
                rewardMint: Constants.SWRD_TOKEN_MINT,
                rewardVault: await Keys.getRewardVaultKey(Constants.SWRD_TOKEN_MINT),
                rewardToAccount: reward_to_account,
                rent: SYSVAR_RENT_PUBKEY,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
            }
        ).rpc();
    console.log('txHash =', txHash);
}

const getStakeInfos = async () => {
    const res = await program.account.stakeInfo.all(
        // [
        //     {
        //         memcmp: {
        //             offset: 12,
        //             bytes: admin.publicKey.toBase58()
        //         }
        //     }
        // ]
    );
    // const res = await program.account.stakeInfo.all();
    console.log("staked infos : ", res.length);
}

// utils
const getNFTTokenAccount = async (nftMintPk: PublicKey): Promise<PublicKey> => {
    console.log("getNFTTokenAccount nftMintPk=", nftMintPk.toBase58());
    let tokenAccount = await provider.connection.getProgramAccounts(
        TOKEN_PROGRAM_ID,
        {
            filters: [
                {
                    dataSize: 165
                },
                {
                    memcmp: {
                        offset: 64,
                        bytes: '2'
                    }
                },
                {
                    memcmp: {
                        offset: 0,
                        bytes: nftMintPk.toBase58()
                    }
                },
            ]
        }
    );
    return tokenAccount[0].pubkey;
}

const getAssociatedTokenAccount = async (ownerPubkey: PublicKey, mintPk: PublicKey): Promise<PublicKey> => {
    let associatedTokenAccountPubkey = (await PublicKey.findProgramAddress(
        [
            ownerPubkey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            mintPk.toBuffer(), // mint address
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    ))[0];
    return associatedTokenAccountPubkey;
}
// utils end

const main = () => {
    const command = process.argv[2];
    if (command == "Init") {
        init();
    } else if (command == "DepositReward") {
        depositSWRD();
    } else if (command == "WithdrawReward") {
        withdrawSWRD();
    } else if (command == "UpdateRewardMint") {
        updateSwardMint();
    } else if (command == "UpdateConfig") {
        updateConfig();
    } else if (command == "TransferOwnerShip") {
        transferOwnership();
    } else if (command == "Stake") {
        stakeNFT();
    } else if (command == "Withdraw") {
        withdrawNFT();
    } else if (command == "Claim") {
        claimReward();
    } else {
        console.log("Please enter command name...");
        // getSWRDAccount();
        getStakeInfos();
    }
}

main();


