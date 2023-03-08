#!/usr/bin/env ts-node
import * as dotenv from "dotenv";
import { program } from 'commander';
import { 
    PublicKey,
    LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  initProject,
  getGlobalInfo,
  setClusterConfig,
  getNFTPoolInfo,
  listNftForSale,
  delistNft,
  getAllNFTs,
  purchase,
  getUserPoolInfo,
  depositEscrow,
  withdrawEscrow,
  getOfferDataInfo,
  makeOffer,
  cancelOffer,
  acceptOffer,
  getAllOffersForNFT,
  getAllAuctions,
  getAuctionDataInfo,
  claimAuction,
  cancelAuction,
  placeBid,
  createAuction,
  updateFee,
  addTreasury,
  removeTreasury,
  initUserPool,
} from "./scripts";
import { ABB_TOKEN_DECIMAL } from "../lib/types";
import { getAllListedNFTs } from "../lib/scripts";

dotenv.config({ path: __dirname+'/../.env' });

program.version('0.0.1');

programCommand('status')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
    } = cmd.opts();
    console.log('Solana config: ', env);
    await setClusterConfig(env);
    console.log(await getGlobalInfo());
});

programCommand('user_status')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .option('-a, --address <string>', 'nft user pubkey')
  .action(async (directory, cmd) => {
    const {
      env,
      address,
    } = cmd.opts();
    console.log('Solana config: ', env);
    await setClusterConfig(env);
    if (address === undefined) {
      console.log("Error User Address input");
      return;
    }
    console.log(await getUserPoolInfo(new PublicKey(address)));
});

programCommand('update_fee')
  .option('-s, --sol_fee <number>', 'marketplace trading by sol fee as permyraid')
  .option('-t, --token_fee <number>', 'marketplace trading by token fee as permyraid')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      sol_fee,
      token_fee,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (sol_fee === undefined || isNaN(parseInt(sol_fee))) {
      console.log("Error Sol Fee Input");
      return;
    }
    if (token_fee === undefined || isNaN(parseInt(token_fee))) {
      console.log("Error Token Fee Input");
      return;
    }
    
    await updateFee(parseInt(sol_fee), parseInt(token_fee));
});

programCommand('add_treasury')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .option('-a, --address <string>', 'team treasury account pubkey')
  .option('-r, --rate <number>', 'treasury distribution rate as permyraid')
  .action(async (directory, cmd) => {
    const {
      env,
      address,
      rate,
    } = cmd.opts();
    console.log('Solana config: ', env);
    await setClusterConfig(env);
    if (address === undefined) {
      console.log("Error Treasury input");
      return;
    }
    if (rate === undefined || isNaN(parseInt(rate))) {
      console.log("Error Treasury Rate Input");
      return;
    }
    await addTreasury(new PublicKey(address), parseInt(rate));
});

programCommand('remove_treasury')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .option('-a, --address <string>', 'team treasury account pubkey')
  .action(async (directory, cmd) => {
    const {
      env,
      address,
    } = cmd.opts();
    console.log('Solana config: ', env);
    await setClusterConfig(env);
    if (address === undefined) {
      console.log("Error Treasury input");
      return;
    }
    await removeTreasury(new PublicKey(address));
});

programCommand('deposit')
  .option('-s, --sol <number>', 'deposit sol amount')
  .option('-t, --token <number>', 'deposit token amount')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      sol,
      token,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (sol === undefined || isNaN(parseFloat(sol))) {
      console.log("Error Sol Amount input");
      return;
    }
    if (token === undefined || isNaN(parseFloat(token))) {
      console.log("Error Token Amount input");
      return;
    }
    
    await depositEscrow(parseFloat(sol) * LAMPORTS_PER_SOL, parseFloat(token) * ABB_TOKEN_DECIMAL);
});

programCommand('withdraw')
  .option('-s, --sol <number>', 'withdraw sol amount')
  .option('-t, --token <number>', 'withdraw token amount')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      sol,
      token,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (sol === undefined || isNaN(parseFloat(sol))) {
      console.log("Error Sol Amount input");
      return;
    }
    if (token === undefined || isNaN(parseFloat(token))) {
      console.log("Error Token Amount input");
      return;
    }
    
    await withdrawEscrow(parseFloat(sol) * LAMPORTS_PER_SOL, parseFloat(token) * ABB_TOKEN_DECIMAL);
});

programCommand('list')
  .option('-a, --address <string>', 'nft mint pubkey')
  .option('-p, --price_sol <number>', 'sell sol price')
  .option('-t, --price_token <number>', 'sell token price')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      address,
      price_sol,
      price_token,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (address === undefined) {
      console.log("Error Mint input");
      return;
    }
    if (price_sol === undefined || isNaN(parseFloat(price_sol))) {
      console.log("Error Sol Price input");
      return;
    }
    if (price_token === undefined || isNaN(parseFloat(price_token))) {
      console.log("Error Token Price input");
      return;
    }
    
    await listNftForSale(new PublicKey(address), parseFloat(price_sol) * LAMPORTS_PER_SOL, parseFloat(price_token) * ABB_TOKEN_DECIMAL);
});

programCommand('delist')
  .option('-a, --address <string>', 'nft mint pubkey')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      address,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (address === undefined) {
      console.log("Error Mint input");
      return;
    }
    
    await delistNft(new PublicKey(address));
});

programCommand('purchase')
  .option('-a, --address <string>', 'nft mint pubkey')
  .option('-t, --by_token <number>', 'purchase nft By ABB token')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      address,
      by_token,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (address === undefined) {
      console.log("Error Mint input");
      return;
    }
    if (by_token === undefined || isNaN(parseInt(by_token)) || parseInt(by_token) > 1) {
      console.log("Error By Token input");
      return;
    }
    
    await purchase(new PublicKey(address), parseInt(by_token) == 1);
});

programCommand('make_offer')
  .option('-a, --address <string>', 'nft mint pubkey')
  .option('-p, --price <number>', 'offer price')
  .option('-t, --by_token <number>', 'offer by token')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      address,
      price,
      by_token,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (address === undefined) {
      console.log("Error Mint input");
      return;
    }
    if (price === undefined || isNaN(parseFloat(price))) {
      console.log("Error Offer Price input");
      return;
    }
    if (by_token === undefined || isNaN(parseInt(by_token)) || parseInt(by_token) > 1) {
      console.log("Error By Token input");
      return;
    }
    
    let byToken: boolean = parseInt(by_token) == 1 ? true : false;
    await makeOffer(new PublicKey(address), parseFloat(price) * (byToken ? ABB_TOKEN_DECIMAL : LAMPORTS_PER_SOL), byToken);
});

programCommand('cancel_offer')
  .option('-a, --address <string>', 'nft mint pubkey')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      address,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (address === undefined) {
      console.log("Error Mint input");
      return;
    }
    
    await cancelOffer(new PublicKey(address));
});

programCommand('accept_offer')
  .option('-a, --address <string>', 'nft mint pubkey')
  .option('-b, --buyer <string>', 'buyer address')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      address,
      buyer,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (address === undefined) {
      console.log("Error Mint input");
      return;
    }
    
    if (buyer === undefined) {
      console.log("Error Buyer input");
      return;
    }
    
    await acceptOffer(new PublicKey(address), new PublicKey(buyer));
});

programCommand('create_auction')
  .option('-a, --address <string>', 'nft mint pubkey')
  .option('-p, --start_price <number>', 'start price')
  .option('-m, --min_increase <number>', 'min increase amount')
  .option('-d, --end_date <number>', 'end date timestamp')
  .option('-t, --by_token <number>', 'auction by token')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      address,
      start_price,
      min_increase,
      end_date,
      by_token,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (address === undefined) {
      console.log("Error Mint input");
      return;
    }
    if (start_price === undefined || isNaN(parseFloat(start_price))) {
      console.log("Error Auction Start Price input");
      return;
    }
    if (min_increase === undefined || isNaN(parseFloat(min_increase))) {
      console.log("Error Auction Min Increase Amount input");
      return;
    }
    if (end_date === undefined || isNaN(parseInt(end_date))) {
      console.log("Error Auction End Date input");
      return;
    }
    if (by_token === undefined || isNaN(parseInt(by_token)) || parseInt(by_token) > 1) {
      console.log("Error By Token input");
      return;
    }
    
    let byToken: boolean = parseInt(by_token) == 1 ? true : false;
    await createAuction(
      new PublicKey(address),
      parseFloat(start_price) * (byToken ? ABB_TOKEN_DECIMAL : LAMPORTS_PER_SOL),
      parseFloat(min_increase) * (byToken ? ABB_TOKEN_DECIMAL : LAMPORTS_PER_SOL),
      parseInt(end_date),
      byToken,
    );
});

programCommand('place_bid')
  .option('-a, --address <string>', 'nft mint pubkey')
  .option('-p, --price <number>', 'auction price')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      address,
      price,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (address === undefined) {
      console.log("Error Mint input");
      return;
    }
    if (price === undefined || isNaN(parseFloat(price))) {
      console.log("Error Auction Price input");
      return;
    }
    
    await placeBid(new PublicKey(address), parseFloat(price) * 1e9);
});


programCommand('claim_auction')
  .option('-a, --address <string>', 'nft mint pubkey')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      address,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (address === undefined) {
      console.log("Error Mint input");
      return;
    }
    
    await claimAuction(new PublicKey(address));
});

programCommand('cancel_auction')
  .option('-a, --address <string>', 'nft mint pubkey')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      address,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (address === undefined) {
      console.log("Error Mint input");
      return;
    }
    
    await cancelAuction(new PublicKey(address));
});

programCommand('listed_nft_data')
  .option('-a, --address <string>', 'nft mint pubkey')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      address,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (address === undefined) {
      console.log("Error input");
      return;
    }
    console.log(await getNFTPoolInfo(new PublicKey(address)));
});

programCommand('get_offer_data')
  .option('-a, --address <string>', 'nft mint pubkey')
  .option('-b, --buyer <string>', 'buyer address pubkey')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      address,
      buyer,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (address === undefined) {
      console.log("Error Mint input");
      return;
    }
    if (buyer === undefined) {
      console.log("Error Buyer input");
      return;
    }
    console.log(await getOfferDataInfo(new PublicKey(address), new PublicKey(buyer)));
});

programCommand('get_auction_data')
  .option('-a, --address <string>', 'nft mint pubkey')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      address,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (address === undefined) {
      console.log("Error Mint input");
      return;
    }
    console.log(await getAuctionDataInfo(new PublicKey(address)));
});

programCommand('get_all_listed_nfts')
  .option('-r, --rpc <string>', 'custom rpc url')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      rpc,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    console.log(await getAllNFTs(rpc));
});

programCommand('get_all_offers_for_nft')
  .option('-a, --address <string>', 'nft mint pubkey')
  .option('-r, --rpc <string>', 'custom rpc url')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      address,
      rpc,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (address === undefined) {
      console.log("Error input");
      return;
    }
    console.log(await getAllOffersForNFT(address, rpc));
});

programCommand('get_all_auctions')
  .option('-r, --rpc <string>', 'custom rpc url')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      rpc,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    console.log(await getAllAuctions(rpc));
});

programCommand('init')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
    } = cmd.opts();
    console.log('Solana config: ', env);
    await setClusterConfig(env);

    await initProject();
});

programCommand('init_user')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
    } = cmd.opts();
    console.log('Solana config: ', env);
    await setClusterConfig(env);
    await initUserPool();
});

function programCommand(name: string) {
  return program
    .command(name)
    .option(
      '-e, --env <string>',
      'Solana cluster env name',
      'devnet', //mainnet-beta, testnet, devnet
    )
}

program.parse(process.argv);
