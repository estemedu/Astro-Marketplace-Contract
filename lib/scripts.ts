import * as anchor from '@project-serum/anchor';
import { idlAddress } from '@project-serum/anchor/dist/cjs/idl';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
    PublicKey,
    Connection,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Transaction,
} from '@solana/web3.js';
import {
    MARKETPLACE_PROGRAM_ID,
    GLOBAL_AUTHORITY_SEED,
    GlobalPool,
    SellData,
    SELL_DATA_SEED,
    SELL_DATA_SIZE,
    ABB_TOKEN_MINT,
    ESCROW_VAULT_SEED,
    USER_DATA_SEED,
    UserData,
    OFFER_DATA_SEED,
    OfferData,
    OFFER_DATA_SIZE,
    AUCTION_DATA_SEED,
    AuctionData,
    AUCTION_DATA_SIZE,
} from './types';
import {
    getAssociatedTokenAccount,
    getATokenAccountsNeedCreate,
    getNFTTokenAccount,
    getOwnerOfNFT,
    getMetadata,
    isExistAccount,
    getTokenAccount,
    METAPLEX,
} from './utils';

/** Get all registered NFTs info for max stake amount calculation */
export const getAllListedNFTs = async (connection: Connection, rpcUrl: string | undefined) => {
    let solConnection = connection;

    if (rpcUrl) {
        solConnection = new anchor.web3.Connection(rpcUrl, "confirmed");
    }

    let poolAccounts = await solConnection.getProgramAccounts(
      MARKETPLACE_PROGRAM_ID,
      {
        filters: [
          {
            dataSize: SELL_DATA_SIZE,
          },
        ]
      }
    );
    
    console.log(`Encounter ${poolAccounts.length} NFT Data Accounts`);
    
    let result: SellData[] = [];

    try {
        for (let idx = 0; idx < poolAccounts.length; idx++) {
            let data = poolAccounts[idx].account.data;
            const mint = new PublicKey(data.slice(8, 40));
            let seller = new PublicKey(data.slice(40, 72));
            let collection = new PublicKey(data.slice(72, 104));

            let buf = data.slice(104, 112).reverse();
            let priceSol = (new anchor.BN(buf));
            buf = data.slice(112, 120).reverse();
            let priceToken = (new anchor.BN(buf));

            buf = data.slice(120, 128).reverse();
            let listedDate = (new anchor.BN(buf));
            buf = data.slice(128, 136).reverse();
            let active = (new anchor.BN(buf));

            if (active.toNumber() == 1)
                result.push({
                    mint,
                    seller,
                    collection,
                    priceSol,
                    priceToken,
                    listedDate,
                    active,
                });
        }
    } catch (e) {
        console.log(e);
        return {};
    }

    return {
        count: result.length,
        data: result.map((info: SellData) => {
            return {
                mint: info.mint.toBase58(),
                seller: info.seller.toBase58(),
                collection: info.collection.toBase58(),
                priceSol: info.priceSol.toNumber(),
                priceToken: info.priceToken.toNumber(),
                listedDate: info.listedDate.toNumber(),
                active: info.active.toNumber(),
            }
        })
    }
};

/** Get all registered NFTs info for max stake amount calculation */
export const getAllOffersForListedNFT = async (mint: string, connection: Connection, rpcUrl: string | undefined) => {
    let solConnection = connection;

    if (rpcUrl) {
        solConnection = new anchor.web3.Connection(rpcUrl, "confirmed");
    }

    let poolAccounts = await solConnection.getProgramAccounts(
      MARKETPLACE_PROGRAM_ID,
      {
        filters: [
            {
                dataSize: OFFER_DATA_SIZE,
            },
            {
                memcmp: {
                    offset: 8,
                    bytes: mint,
                }
            }
        ]
      }
    );
    
    console.log(`Encounter ${poolAccounts.length} Offer Data Accounts for ${mint} NFT`);
    
    let result: OfferData[] = [];

    try {
        for (let idx = 0; idx < poolAccounts.length; idx++) {
            let data = poolAccounts[idx].account.data;
            const mint = new PublicKey(data.slice(8, 40));
            let buyer = new PublicKey(data.slice(40, 72));

            let buf = data.slice(72, 80).reverse();
            let offerPrice = (new anchor.BN(buf));
            buf = data.slice(80, 88).reverse();
            let offerListingDate = (new anchor.BN(buf));
            buf = data.slice(88, 96).reverse();
            let byToken = (new anchor.BN(buf));
            buf = data.slice(96, 104).reverse();
            let active = (new anchor.BN(buf));

            if (active.toNumber() == 1)
                result.push({
                    mint,
                    buyer,
                    offerPrice,
                    byToken,
                    offerListingDate,
                    active,
                });
        }
    } catch (e) {
        console.log(e);
        return {};
    }

    return {
        count: result.length,
        data: result.map((info: OfferData) => {
            return {
                mint: info.mint.toBase58(),
                buyer: info.buyer.toBase58(),
                offerPrice: info.offerPrice.toNumber(),
                offerListingDate: info.offerListingDate.toNumber(),
                byToken: info.byToken.toNumber(),
                active: info.active.toNumber(),
            }
        })
    }
};

export const getAllStartedAuctions = async (connection: Connection, rpcUrl: string | undefined) => {
    let solConnection = connection;

    if (rpcUrl) {
        solConnection = new anchor.web3.Connection(rpcUrl, "confirmed");
    }

    let poolAccounts = await solConnection.getProgramAccounts(
      MARKETPLACE_PROGRAM_ID,
      {
        filters: [
            {
                dataSize: AUCTION_DATA_SIZE,
            },
        ]
      }
    );
    
    console.log(`Encounter ${poolAccounts.length} Auction Data Accounts`);
    
    let result: AuctionData[] = [];

    try {
        for (let idx = 0; idx < poolAccounts.length; idx++) {
            let data = poolAccounts[idx].account.data;
            const mint = new PublicKey(data.slice(8, 40));
            let creator = new PublicKey(data.slice(40, 72));

            let buf = data.slice(72, 80).reverse();
            let startPrice = (new anchor.BN(buf));
            buf = data.slice(80, 88).reverse();
            let minIncreaseAmount = (new anchor.BN(buf));
            buf = data.slice(88, 96).reverse();
            let byToken = (new anchor.BN(buf));
            buf = data.slice(96, 104).reverse();
            let endDate = (new anchor.BN(buf));
            buf = data.slice(104, 112).reverse();
            let lastBidDate = (new anchor.BN(buf));
            let lastBidder = new PublicKey(data.slice(112, 144));
            buf = data.slice(144, 152).reverse();
            let highestBid = (new anchor.BN(buf));
            buf = data.slice(152, 160).reverse();
            let status = (new anchor.BN(buf));

            // if (status.toNumber() !== 0)
                result.push({
                    mint,
                    creator,
                    startPrice,
                    minIncreaseAmount,
                    byToken,
                    endDate,
                    lastBidDate,
                    lastBidder,
                    highestBid,
                    status,
                });
        }
    } catch (e) {
        console.log(e);
        return {};
    }

    return {
        count: result.length,
        data: result.map((info: AuctionData) => {
            return {
                mint: info.mint.toBase58(),
                creator: info.creator.toBase58(),
                startPrice: info.startPrice.toNumber(),
                minIncreaseAmount: info.minIncreaseAmount.toNumber(),
                endDate: info.endDate.toNumber(),
                byToken: info.byToken.toNumber(),
                lastBidDate: info.lastBidDate.toNumber(),
                lastBidder: info.lastBidder.toBase58(),
                highestBid: info.highestBid.toNumber(),
                status: info.status.toNumber(),
            }
        })
    }
};

export const getGlobalState = async (
    program: anchor.Program,
): Promise<GlobalPool | null> => {
    const [globalAuthority, _] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        MARKETPLACE_PROGRAM_ID
    );
    try {
        let globalState = await program.account.globalPool.fetch(globalAuthority);
        return globalState as unknown as GlobalPool;
    } catch {
        return null;
    }
}

export const getUserPoolState = async (
    userAddress: PublicKey,
    program: anchor.Program,
): Promise<UserData | null> => {
    if (!userAddress) return null;

    const [userPool, _] = await PublicKey.findProgramAddress(
        [Buffer.from(USER_DATA_SEED), userAddress.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );
    console.log('User Data PDA: ', userPool.toBase58());
    try {
        let poolState = await program.account.userData.fetch(userPool);
        return poolState as unknown as UserData;
    } catch {
        return null;
    }
}

export const getNFTPoolState = async (
    mint: PublicKey,
    program: anchor.Program,
): Promise<SellData | null> => {
    if (!mint) return null;

    const [sellData, _] = await PublicKey.findProgramAddress(
        [Buffer.from(SELL_DATA_SEED), mint.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );
    console.log('Sell Data PDA: ', sellData.toBase58());
    try {
        let poolState = await program.account.sellData.fetch(sellData);
        return poolState as unknown as SellData;
    } catch {
        return null;
    }
}

export const getAuctionDataState = async (
    mint: PublicKey,
    program: anchor.Program,
): Promise<AuctionData | null> => {
    if (!mint) return null;

    const [auctionData, _] = await PublicKey.findProgramAddress(
        [Buffer.from(AUCTION_DATA_SEED), mint.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );
    console.log('Auction Data PDA: ', auctionData.toBase58());
    try {
        let poolState = await program.account.auctionData.fetch(auctionData);
        return poolState as unknown as AuctionData;
    } catch {
        return null;
    }
}

export const getOfferDataState = async (
    mint: PublicKey,
    userAddress: PublicKey,
    program: anchor.Program,
): Promise<OfferData | null> => {
    if (!mint) return null;

    const [offerData, _] = await PublicKey.findProgramAddress(
        [Buffer.from(OFFER_DATA_SEED), mint.toBuffer(), userAddress.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );
    console.log('Offer Data PDA: ', offerData.toBase58());
    try {
        let offerDataState = await program.account.offerData.fetch(offerData);
        return offerDataState as unknown as OfferData;
    } catch {
        return null;
    }
}

export const createInitializeTx = async (
    userAddress: PublicKey,
    program: anchor.Program,
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );
    const [escrowVault, escrow_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(ESCROW_VAULT_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );
    
    let tx = new Transaction();
    console.log('==>initializing program', globalAuthority.toBase58());

    tx.add(program.instruction.initialize(
        bump, escrow_bump, {
        accounts: {
            admin: userAddress,
            globalAuthority,
            escrowVault,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createUpdateFeeTx = async (
    userAddress: PublicKey,
    program: anchor.Program,
    solFee: number,
    tokenFee: number,
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );
    
    let tx = new Transaction();
    console.log('==>updating fee', globalAuthority.toBase58(), solFee, tokenFee);

    tx.add(program.instruction.updateFee(
        bump, new anchor.BN(solFee), new anchor.BN(tokenFee), {
        accounts: {
            admin: userAddress,
            globalAuthority,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createAddTreasuryTx = async (
    userAddress: PublicKey,
    address: PublicKey,
    rate: number,
    program: anchor.Program,
    connection: Connection,
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );
    
    let tx = new Transaction();
    
    let ret1 = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        address,
        [ABB_TOKEN_MINT]
    );
    console.log("Treasury ABB Account = ", ret1.destinationAccounts[0].toBase58());


    if (ret1.instructions.length > 0) ret1.instructions.map((ix) => tx.add(ix));
    console.log('==>adding team treasury', globalAuthority.toBase58(), address.toBase58(), rate);
    tx.add(program.instruction.addTeamTreasury(
        bump, address, new anchor.BN(rate), {
        accounts: {
            admin: userAddress,
            globalAuthority,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createRemoveTreasuryTx = async (
    userAddress: PublicKey,
    program: anchor.Program,
    address: PublicKey,
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );
    
    let tx = new Transaction();
    console.log('==>removing team treasury', globalAuthority.toBase58(), address.toBase58());

    tx.add(program.instruction.removeTeamTreasury(
        bump, address, {
        accounts: {
            admin: userAddress,
            globalAuthority,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createInitUserTx = async (
    userAddress: PublicKey,
    program: anchor.Program,
) => {
    const [userPool, user_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(USER_DATA_SEED), userAddress.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );
    
    let tx = new Transaction();
    console.log('==>initializing user pool', userPool.toBase58());

    tx.add(program.instruction.initUserPool(
        user_bump, {
        accounts: {
            owner: userAddress,
            userPool,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createDepositTx = async (
    userAddress: PublicKey,
    sol: number,
    token: number,
    program: anchor.Program,
    connection: Connection,
) => {
    let ret = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        userAddress,
        [ABB_TOKEN_MINT]
    );

    let tx = new Transaction();
    let userTokenAccount = ret.destinationAccounts[0];
    if (!await isExistAccount(userTokenAccount, connection)) {
        try {
            let accountOfABB = await getTokenAccount(ABB_TOKEN_MINT, userAddress, connection);
            userTokenAccount = accountOfABB;
        } catch (e) {
            if (token == 0) {
                tx.add(ret.instructions[0]);
            } else
                throw 'No ABB Token Account for this user';
        }
    }
    console.log("User ABB Account = ", userTokenAccount.toBase58());

    const [escrowVault, escrow_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(ESCROW_VAULT_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );

    const [userPool, user_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(USER_DATA_SEED), userAddress.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );

    let ret1 = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        escrowVault,
        [ABB_TOKEN_MINT]
    );
    console.log('escrowVault = ', escrowVault.toBase58());
    console.log("EscrowVault ABB Account = ", ret1.destinationAccounts[0].toBase58());


    if (ret1.instructions.length > 0) ret1.instructions.map((ix) => tx.add(ix));
    console.log('==> Depositing', userAddress.toBase58(), 'Sol', sol, 'Token:', token);
    tx.add(program.instruction.depositToEscrow(
        user_bump, escrow_bump, new anchor.BN(sol), new anchor.BN(token), {
        accounts: {
            owner: userAddress,
            userPool,
            escrowVault,
            userTokenAccount,
            escrowTokenAccount: ret1.destinationAccounts[0],
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createWithdrawTx = async (
    userAddress: PublicKey,
    sol: number,
    token: number,
    program: anchor.Program,
    connection: Connection,
) => {
    const [escrowVault, escrow_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(ESCROW_VAULT_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );
    let escrowTokenAccount = await getAssociatedTokenAccount(escrowVault, ABB_TOKEN_MINT);
    console.log('escrowVault = ', escrowVault.toBase58());
    console.log("Escrow ABB Account = ", escrowTokenAccount.toBase58());

    const [userPool, user_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(USER_DATA_SEED), userAddress.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );

    let ret1 = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        userAddress,
        [ABB_TOKEN_MINT]
    );
    console.log("User ABB Account = ", ret1.destinationAccounts[0].toBase58());

    let tx = new Transaction();

    if (ret1.instructions.length > 0) ret1.instructions.map((ix) => tx.add(ix));
    console.log('==> Withdrawing', userAddress.toBase58(), 'Sol', sol, 'Token:', token);
    tx.add(program.instruction.withdrawFromEscrow(
        user_bump, escrow_bump, new anchor.BN(sol), new anchor.BN(token), {
        accounts: {
            owner: userAddress,
            userPool,
            escrowVault,
            userTokenAccount: ret1.destinationAccounts[0],
            escrowTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createInitSellDataTx = async (
    mint: PublicKey,
    userAddress: PublicKey,
    program: anchor.Program,
) => {
    const [nftData, nft_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(SELL_DATA_SEED), mint.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );
    
    let tx = new Transaction();
    console.log('==>initializing sell PDA', mint.toBase58(), nftData.toBase58());

    tx.add(program.instruction.initSellData(
        mint, nft_bump, {
        accounts: {
            payer: userAddress,
            sellDataInfo: nftData,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createListForSellNftTx = async (
    mint: PublicKey,
    userAddress: PublicKey,
    program: anchor.Program,
    connection: Connection,
    priceSol: number,
    priceToken: number,
) => {
    if (priceSol < 0 || priceToken < 0) {
        throw 'Invalid Price Value';
    }

    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );

    let userTokenAccount = await getAssociatedTokenAccount(userAddress, mint);
    if (!await isExistAccount(userTokenAccount, connection)) {
        let accountOfNFT = await getNFTTokenAccount(mint, connection);
        if (userTokenAccount.toBase58() != accountOfNFT.toBase58()) {
            let nftOwner = await getOwnerOfNFT(mint, connection);
            if (nftOwner.toBase58() == userAddress.toBase58()) userTokenAccount = accountOfNFT;
            else if (nftOwner.toBase58() !== globalAuthority.toBase58()) {
                throw 'Error: Nft is not owned by user';
            }
        }
    }
    console.log("NFT = ", mint.toBase58(), userTokenAccount.toBase58());

    const [nftData, nft_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(SELL_DATA_SEED), mint.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );

    let { instructions, destinationAccounts } = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        globalAuthority,
        [mint]
    );

    console.log("Dest NFT Account = ", destinationAccounts[0].toBase58())

    const metadata = await getMetadata(mint);
    console.log("Metadata=", metadata.toBase58());

    let tx = new Transaction();

    if (instructions.length > 0) instructions.map((ix) => tx.add(ix));
    console.log('==>listing', mint.toBase58(), priceSol, priceToken);

    tx.add(program.instruction.listNftForSale(
        bump, nft_bump, new anchor.BN(priceSol), new anchor.BN(priceToken), {
        accounts: {
            owner: userAddress,
            globalAuthority,
            sellDataInfo: nftData,
            userTokenAccount,
            destNftTokenAccount: destinationAccounts[0],
            nftMint: mint,
            mintMetadata: metadata,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: METAPLEX,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createDelistNftTx = async (
    mint: PublicKey,
    userAddress: PublicKey,
    program: anchor.Program,
    connection: Connection,
) => {
    let ret = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        userAddress,
        [mint]
    );
    let userTokenAccount = ret.destinationAccounts[0];
    console.log("User NFT = ", mint.toBase58(), userTokenAccount.toBase58());

    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        MARKETPLACE_PROGRAM_ID
    );

    const [nftData, nft_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(SELL_DATA_SEED), mint.toBuffer()],
        MARKETPLACE_PROGRAM_ID
    );

    let { instructions, destinationAccounts } = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        globalAuthority,
        [mint]
    );

    console.log("Dest NFT Account = ", destinationAccounts[0].toBase58());

    let tx = new Transaction();

    if (ret.instructions.length > 0) ret.instructions.map((ix) => tx.add(ix));
    console.log('==> withdrawing', mint.toBase58());
    tx.add(program.instruction.delistNft(
        bump, nft_bump, {
        accounts: {
            owner: userAddress,
            globalAuthority,
            sellDataInfo: nftData,
            userTokenAccount,
            destNftTokenAccount: destinationAccounts[0],
            nftMint: mint,
            tokenProgram: TOKEN_PROGRAM_ID,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createPurchaseTx = async (
    mint: PublicKey,
    userAddress: PublicKey,
    byToken: boolean,
    treasuryAddresses: PublicKey[],
    program: anchor.Program,
    connection: Connection,
) => {
    let ret = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        userAddress,
        [mint]
    );
    let userNftTokenAccount = ret.destinationAccounts[0];
    console.log("User NFT = ", mint.toBase58(), userNftTokenAccount.toBase58());

    let ret2 = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        userAddress,
        [ABB_TOKEN_MINT]
    );

    let tx = new Transaction();
    let userTokenAccount = ret2.destinationAccounts[0];
    if (!await isExistAccount(userTokenAccount, connection)) {
        try {
            let accountOfABB = await getTokenAccount(ABB_TOKEN_MINT, userAddress, connection);
            userTokenAccount = accountOfABB;
        } catch (e) {
            if (!byToken) tx.add(ret2.instructions[0]);
            else throw 'No ABB Token Account for this user';
        }
    }
    console.log("User ABB Account = ", userTokenAccount.toBase58());

    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        MARKETPLACE_PROGRAM_ID
    );

    const [nftData, nft_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(SELL_DATA_SEED), mint.toBuffer()],
        MARKETPLACE_PROGRAM_ID
    );

    const [buyerUserPool, buyer_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(USER_DATA_SEED), userAddress.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );


    let { destinationAccounts } = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        globalAuthority,
        [mint]
    );

    console.log("Dest NFT Account = ", destinationAccounts[0].toBase58());

    let sellInfo = await getNFTPoolState(mint, program);
    let seller = sellInfo.seller;

    const [sellerUserPool, seller_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(USER_DATA_SEED), seller.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );

    let ret1 = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        seller,
        [ABB_TOKEN_MINT]
    );
    console.log('Seller = ', seller.toBase58());
    console.log("seller ABB Account = ", ret1.destinationAccounts[0].toBase58());

    let treasuryAccounts: PublicKey[] = treasuryAddresses;
    if (byToken) {
        for (let idx in treasuryAccounts) {
            treasuryAccounts[idx] = await getAssociatedTokenAccount(treasuryAccounts[idx], ABB_TOKEN_MINT);
        }
    }
    console.log("=> Treasury Accounts:", treasuryAccounts.map((address) => address.toBase58()));

    if (ret.instructions.length > 0) ret.instructions.map((ix) => tx.add(ix));
    if (ret1.instructions.length > 0) ret1.instructions.map((ix) => tx.add(ix));
    console.log('==> Purchasing', mint.toBase58(), 'By Token:', byToken);
    tx.add(program.instruction.purchase(
        bump, nft_bump, buyer_bump, seller_bump, new anchor.BN(byToken ? 1 : 0), {
        accounts: {
            buyer: userAddress,
            globalAuthority,
            buyerUserPool,
            sellDataInfo: nftData,
            userNftTokenAccount,
            destNftTokenAccount: destinationAccounts[0],
            nftMint: mint,
            seller,
            sellerUserPool,
            userTokenAccount,
            sellerTokenAccount: ret1.destinationAccounts[0],
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
        },
        instructions: [],
        signers: [],
        remainingAccounts: treasuryAccounts.map((address) => {
            return {
                pubkey: address,
                isWritable: true,
                isSigner: false,
            }
        }),
    }));

    return tx;
}

export const createInitOfferDataTx = async (
    mint: PublicKey,
    userAddress: PublicKey,
    program: anchor.Program,
) => {
    const [offerData, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(OFFER_DATA_SEED), mint.toBuffer(), userAddress.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );
    
    let tx = new Transaction();
    console.log('==>initializing offer PDA', mint.toBase58(), offerData.toBase58());

    tx.add(program.instruction.initOfferData(
        mint, bump, {
        accounts: {
            payer: userAddress,
            offerDataInfo: offerData,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createMakeOfferTx = async (
    mint: PublicKey,
    userAddress: PublicKey,
    price: number,
    byToken: boolean,
    program: anchor.Program,
    connection: Connection,
) => {
    let ret = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        userAddress,
        [ABB_TOKEN_MINT]
    );

    let tx = new Transaction();
    let userTokenAccount = ret.destinationAccounts[0];
    if (!await isExistAccount(userTokenAccount, connection)) {
        try {
            let accountOfABB = await getTokenAccount(ABB_TOKEN_MINT, userAddress, connection);
            userTokenAccount = accountOfABB;
        } catch (e) {
            if (!byToken) tx.add(ret.instructions[0]);
            else throw 'No ABB Token Account for this user';
        }
    }
    console.log("User ABB Account = ", userTokenAccount.toBase58());

    const [nftData, nft_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(SELL_DATA_SEED), mint.toBuffer()],
        MARKETPLACE_PROGRAM_ID
    );

    const [offerData, offer_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(OFFER_DATA_SEED), mint.toBuffer(), userAddress.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );

    const [escrowVault, escrow_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(ESCROW_VAULT_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );

    const [userPool, user_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(USER_DATA_SEED), userAddress.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );

    let ret1 = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        escrowVault,
        [ABB_TOKEN_MINT]
    );
    console.log('escrowVault = ', escrowVault.toBase58());
    console.log("EscrowVault ABB Account = ", ret1.destinationAccounts[0].toBase58());

    if (ret1.instructions.length > 0) ret1.instructions.map((ix) => tx.add(ix));
    console.log('==> making Offer', mint.toBase58(), userAddress.toBase58(), 'Price:', price, 'ByToken:', byToken);
    tx.add(program.instruction.makeOffer(
        nft_bump, offer_bump, user_bump, escrow_bump, new anchor.BN(price), new anchor.BN(byToken ? 1 : 0), {
        accounts: {
            owner: userAddress,
            sellDataInfo: nftData,
            offerDataInfo: offerData,
            nftMint: mint,
            userPool,
            escrowVault,
            userTokenAccount,
            escrowTokenAccount: ret1.destinationAccounts[0],
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createCancelOfferTx = async (
    mint: PublicKey,
    userAddress: PublicKey,
    program: anchor.Program,
) => {
    let tx = new Transaction();

    const [offerData, offer_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(OFFER_DATA_SEED), mint.toBuffer(), userAddress.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );
    console.log('==> canceling Offer', mint.toBase58(), userAddress.toBase58());
    tx.add(program.instruction.cancelOffer(
        offer_bump, {
        accounts: {
            owner: userAddress,
            offerDataInfo: offerData,
            nftMint: mint,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createAcceptOfferTx = async (
    mint: PublicKey,
    buyer: PublicKey,
    treasuryAddresses: PublicKey[],
    program: anchor.Program,
    connection: Connection,
) => {
    let sellInfo = await getNFTPoolState(mint, program);
    let seller = sellInfo.seller;
    let offerInfo = await getOfferDataState(mint, buyer, program);

    let tx = new Transaction();

    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        MARKETPLACE_PROGRAM_ID
    );

    const [nftData, nft_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(SELL_DATA_SEED), mint.toBuffer()],
        MARKETPLACE_PROGRAM_ID
    );

    const [offerData, offer_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(OFFER_DATA_SEED), mint.toBuffer(), buyer.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );

    const [escrowVault, escrow_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(ESCROW_VAULT_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );

    const [buyerUserPool, buyer_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(USER_DATA_SEED), buyer.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );

    const [sellerUserPool, seller_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(USER_DATA_SEED), seller.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );
    
    let ret = await getATokenAccountsNeedCreate(
        connection,
        seller,
        buyer,
        [mint]
    );

    let destNftTokenAccount = await getAssociatedTokenAccount(
        globalAuthority,
        mint,
    );

    let ret1 = await getATokenAccountsNeedCreate(
        connection,
        seller,
        seller,
        [ABB_TOKEN_MINT]
    );
    console.log("Seller ABB Account = ", ret.destinationAccounts[0].toBase58());

    let escrowTokenAccount = await getAssociatedTokenAccount(
        escrowVault,
        ABB_TOKEN_MINT,
    );
    console.log('escrowVault = ', escrowVault.toBase58());
    console.log("EscrowVault ABB Account = ", escrowTokenAccount.toBase58());

    if (ret.instructions.length > 0) ret.instructions.map((ix) => tx.add(ix));
    if (ret1.instructions.length > 0) ret1.instructions.map((ix) => tx.add(ix));

    let treasuryAccounts: PublicKey[] = treasuryAddresses;
    if (offerInfo.byToken.toNumber()) {
        for (let idx in treasuryAccounts) {
            treasuryAccounts[idx] = await getAssociatedTokenAccount(treasuryAccounts[idx], ABB_TOKEN_MINT);
        }
    }
    console.log("=> Treasury Accounts:", treasuryAccounts.map((address) => address.toBase58()));

    console.log('==> Accept Offer  Mint:', mint.toBase58(),
        'Buyer:', buyer.toBase58(), 'Seller:', seller.toBase58(),
        'OfferPrice:', offerInfo.offerPrice.toNumber(), 'ByToken:', offerInfo.byToken.toNumber());

    tx.add(program.instruction.acceptOffer(
        bump, nft_bump, offer_bump, buyer_bump, seller_bump, escrow_bump, {
        accounts: {
            seller,
            sellDataInfo: nftData,
            buyer,
            offerDataInfo: offerData,
            sellerUserPool,
            nftMint: mint,
            globalAuthority,
            buyerUserPool,
            userNftTokenAccount: ret.destinationAccounts[0],
            destNftTokenAccount,
            escrowVault,
            userTokenAccount: ret1.destinationAccounts[0],
            escrowTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
        },
        instructions: [],
        signers: [],
        remainingAccounts: treasuryAccounts.map((address) => {
            return {
                pubkey: address,
                isWritable: true,
                isSigner: false,
            }
        }),
    }));

    return tx;
}

export const createInitAuctionDataTx = async (
    mint: PublicKey,
    userAddress: PublicKey,
    program: anchor.Program,
) => {
    const [nftData, nft_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(AUCTION_DATA_SEED), mint.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );
    
    let tx = new Transaction();
    console.log('==>initializing auction PDA', mint.toBase58(), nftData.toBase58());

    tx.add(program.instruction.initAuctionData(
        mint, nft_bump, {
        accounts: {
            payer: userAddress,
            auctionDataInfo: nftData,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createCreateAuctionTx = async (
    mint: PublicKey,
    userAddress: PublicKey,
    startPrice: number,
    minIncrease: number,
    byToken: boolean,
    endDate: number,
    program: anchor.Program,
    connection: Connection,
) => {
    if (startPrice < 0 || minIncrease < 0 || endDate < 0) {
        throw 'Invalid Price Value';
    }

    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );

    let userTokenAccount = await getAssociatedTokenAccount(userAddress, mint);
    if (!await isExistAccount(userTokenAccount, connection)) {
        let accountOfNFT = await getNFTTokenAccount(mint, connection);
        if (userTokenAccount.toBase58() != accountOfNFT.toBase58()) {
            let nftOwner = await getOwnerOfNFT(mint, connection);
            if (nftOwner.toBase58() == userAddress.toBase58()) userTokenAccount = accountOfNFT;
            else if (nftOwner.toBase58() !== globalAuthority.toBase58()) {
                throw 'Error: Nft is not owned by user';
            }
        }
    }
    console.log("NFT = ", mint.toBase58(), userTokenAccount.toBase58());

    const [nftData, nft_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(AUCTION_DATA_SEED), mint.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );

    let { instructions, destinationAccounts } = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        globalAuthority,
        [mint]
    );

    console.log("Dest NFT Account = ", destinationAccounts[0].toBase58())

    let tx = new Transaction();

    if (instructions.length > 0) instructions.map((ix) => tx.add(ix));
    console.log('==>creating Auction',
        mint.toBase58(), startPrice, minIncrease, byToken, endDate);

    tx.add(program.instruction.createAuction(
        bump, nft_bump, new anchor.BN(startPrice),
        new anchor.BN(minIncrease), new anchor.BN(byToken ? 1 : 0),
        new anchor.BN(endDate), {
        accounts: {
            owner: userAddress,
            globalAuthority,
            auctionDataInfo: nftData,
            userTokenAccount,
            destNftTokenAccount: destinationAccounts[0],
            nftMint: mint,
            tokenProgram: TOKEN_PROGRAM_ID,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createPlaceBidTx = async (
    mint: PublicKey,
    userAddress: PublicKey,
    price: number,
    program: anchor.Program,
    connection: Connection,
) => {
    let ret = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        userAddress,
        [ABB_TOKEN_MINT]
    );

    let auctionInfo = await getAuctionDataState(mint, program);

    let tx = new Transaction();
    let userTokenAccount = ret.destinationAccounts[0];
    if (!await isExistAccount(userTokenAccount, connection)) {
        try {
            let accountOfABB = await getTokenAccount(ABB_TOKEN_MINT, userAddress, connection);
            userTokenAccount = accountOfABB;
        } catch (e) {
            if (!auctionInfo.byToken.toNumber()) tx.add(ret.instructions[0]);
            else throw 'No ABB Token Account for this user';
        }
    }
    console.log("Bidder ABB Account = ", userTokenAccount.toBase58());

    const [nftData, nft_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(AUCTION_DATA_SEED), mint.toBuffer()],
        MARKETPLACE_PROGRAM_ID
    );

    const [escrowVault, escrow_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(ESCROW_VAULT_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );

    let ret1 = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        escrowVault,
        [ABB_TOKEN_MINT]
    );

    if (ret1.instructions.length > 0) ret1.instructions.map((ix) => tx.add(ix));
    console.log('escrowVault = ', escrowVault.toBase58());
    console.log("EscrowVault ABB Account = ", ret1.destinationAccounts[0].toBase58());

    let outBidder = userAddress;
    let outBidderTokenAccount = userTokenAccount;
    if (auctionInfo.lastBidder.toBase58() != PublicKey.default.toBase58()) {
        outBidder = auctionInfo.lastBidder;

        let ret2 = await getATokenAccountsNeedCreate(
            connection,
            userAddress,
            outBidder,
            [ABB_TOKEN_MINT]
        );
        outBidderTokenAccount = ret2.destinationAccounts[0];
        if (ret2.instructions.length > 0) ret2.instructions.map((ix) => tx.add(ix));
    }

    console.log('==> placing Bid', mint.toBase58(),
        userAddress.toBase58(), 'Price:', price, 'ByToken:', auctionInfo.byToken.toNumber(),
        'LastBidder:', outBidder.toBase58(), 'LastBidderATA:', outBidderTokenAccount.toBase58());
    tx.add(program.instruction.placeBid(
        nft_bump, escrow_bump, new anchor.BN(price), {
        accounts: {
            bidder: userAddress,
            auctionDataInfo: nftData,
            nftMint: mint,
            escrowVault,
            bidderTokenAccount: userTokenAccount,
            escrowTokenAccount: ret1.destinationAccounts[0],
            outBidder,
            outBidderTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createClaimAuctionTx = async (
    mint: PublicKey,
    userAddress: PublicKey,
    treasuryAddresses: PublicKey[],
    program: anchor.Program,
    connection: Connection,
) => {
    let ret = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        userAddress,
        [mint]
    );

    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );

    const [nftData, nft_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(AUCTION_DATA_SEED), mint.toBuffer()],
        MARKETPLACE_PROGRAM_ID
    );

    const [escrowVault, escrow_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(ESCROW_VAULT_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );

    
    let tx = new Transaction();
    let userTokenAccount = ret.destinationAccounts[0];
    let destNftTokenAccount = await getAssociatedTokenAccount(globalAuthority, mint);
    console.log("Bidder NFT Account = ", userTokenAccount.toBase58());

    let escrowTokenAccount = await getAssociatedTokenAccount(escrowVault, ABB_TOKEN_MINT);
    
    let auctionInfo = await getAuctionDataState(mint, program);
    let creator = auctionInfo.creator;
    let ret1 = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        creator,
        [ABB_TOKEN_MINT]
    );
        
    if (ret.instructions.length > 0) ret.instructions.map((ix) => tx.add(ix));
    if (ret1.instructions.length > 0) ret1.instructions.map((ix) => tx.add(ix));
    
    const [userPool, user_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(USER_DATA_SEED), userAddress.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );

    const [creatorUserPool, creator_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(USER_DATA_SEED), creator.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );

    let treasuryAccounts: PublicKey[] = treasuryAddresses;
    if (auctionInfo.byToken.toNumber()) {
        for (let idx in treasuryAccounts) {
            treasuryAccounts[idx] = await getAssociatedTokenAccount(treasuryAccounts[idx], ABB_TOKEN_MINT);
        }
    }
    console.log("=> Treasury Accounts:", treasuryAccounts.map((address) => address.toBase58()));

    console.log('==> claiming Auction', mint.toBase58(), userAddress.toBase58(),
        'Creator:', creator.toBase58(), 'creatorATA:', ret1.destinationAccounts[0].toBase58());
    tx.add(program.instruction.claimAuction(
        bump, nft_bump, escrow_bump, {
        accounts: {
            bidder: userAddress,
            globalAuthority,
            auctionDataInfo: nftData,
            userTokenAccount: ret.destinationAccounts[0],
            destNftTokenAccount,
            nftMint: mint,
            escrowVault,
            escrowTokenAccount,
            creator,
            creatorTokenAccount: ret1.destinationAccounts[0],
            bidderUserPool: userPool,
            creatorUserPool,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
        },
        instructions: [],
        signers: [],
        remainingAccounts: treasuryAddresses.map((address) => {
            return {
                pubkey: address,
                isWritable: true,
                isSigner: false,
            }
        }),
    }));

    return tx;
}

export const createCancelAuctionTx = async (
    mint: PublicKey,
    userAddress: PublicKey,
    program: anchor.Program,
    connection: Connection,
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );

    const [nftData, nft_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(AUCTION_DATA_SEED), mint.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );

    let { instructions, destinationAccounts } = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        userAddress,
        [mint]
    );
    let destNftTokenAccount = await getAssociatedTokenAccount(globalAuthority, mint);

    console.log("User NFT Account = ", destinationAccounts[0].toBase58())

    let tx = new Transaction();

    if (instructions.length > 0) instructions.map((ix) => tx.add(ix));

    console.log('==> canceling Auction', mint.toBase58());
    tx.add(program.instruction.cancelAuction(
        bump, nft_bump, {
        accounts: {
            creator: userAddress,
            globalAuthority,
            auctionDataInfo: nftData,
            userTokenAccount: destinationAccounts[0],
            destNftTokenAccount,
            nftMint: mint,
            tokenProgram: TOKEN_PROGRAM_ID,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}