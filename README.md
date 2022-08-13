# Frontrunning Bot by xCaptainFortune

This is a frontrunning bot I wrote as a better alternative to LIBEVM'S Sandwich bot. This bot contains:

- Fetching data from pending transactions (mempool)
- Decoding transaction data
- Unlike LIBEVM's bot we do not use any profit algos such as Binary search to find the most profitable amount_in for our trade. This is too slow and the optimal amount can be calculated much faster in one step from a simple equation.  

(1) When a user makes a trade, he will accept a certain slippage tolerance. A Sandwich Bot operator takes advantage of this slippage tolerance to buy as most tokens as possible until the user's slippage tolerance has been reached. Hence for a sandwich the optimal amount of tokens to buy is the one that moves the price enough so that the user gets as less tokens as possible (in a transaction data this corresponds to the minimum_amount_out calculated from the user's slippage tolerance)

I'll let you reason about this so you can go and attempt to find the equation by yourself which is a fun and challenging exercise for you to do. The equation you should obtain is

![Screen Shot 2022-08-12 at 2 20 31 PM](https://user-images.githubusercontent.com/110858141/184420304-a680c548-0ff5-433e-b3cb-f98b8593714e.png)

As an example, suppose the reserves of a TOKEN-WETH pool correspond to x: 30 000 y: 10 . The user's minimum amount of tokens that he will accept from adding 1 eth into the pool is 2700 tokens.

According to our magic equation, for the user to obtain 2700 tokens at the end of the sandwich the operator must add 0.05277741218 eth to the pool.

![Screen Shot 2022-08-12 at 2 22 27 PM](https://user-images.githubusercontent.com/110858141/184420532-2e1aced6-fe2a-4f2f-9bb6-368caa6473cc.png)

let's verify this step by step. After we add 0.05277741218 eth to the pool the new token reserves will be 29 842.49
(we are using AMM Constant formula X*Y = K)

![Screen Shot 2022-08-12 at 2 24 59 PM](https://user-images.githubusercontent.com/110858141/184420901-f0ac2f00-a9a3-43c9-805b-ceac123a7f84.png)

Now that the frontrun transaction is done, the user will proceed to add 1 eth to the pool with current reserves  x: 29 842.49, y: 10.05277741218. After he adds 1 eth, the tokens reserves will be 27142.49901.

![Screen Shot 2022-08-12 at 2 29 12 PM](https://user-images.githubusercontent.com/110858141/184421493-f85a76e0-9592-4f79-a1a6-30735434d262.png)

The inital token reserves were 29 842.49 and the final token reserves were 27142.49901. Meaning that he obtained 2700 tokens ! (29 842.49 - 27142.49901).
By adding 0.0527 eth to the pool before the user we managed to give him the worse possible price he could get ! 

After the user purchases his 2700 tokens, we sell our 157.51 tokens we got from our 0.0527 eth. 

![Screen Shot 2022-08-12 at 2 36 54 PM](https://user-images.githubusercontent.com/110858141/184422553-39beadf7-cb9f-4ef1-b903-bd4b8ef96f76.png)

The final eth reserves are 10.98 and before that it was, 11.05277 (10.05277 + 1) meaning that we got 0.07277 eth from our trade.

A net profit of 0.02 eth !! (0.07277 - 0.05277). It turns out this is actually the maximum amount of eth you could of have extracted from this trade. This was possible by buying as most tokens as possible before the user reached his slippage tolerance corresponding to 2700 tokens.

The bot considers the dexFee and so the fixed equation corresponds to

![Screen Shot 2022-08-12 at 1 59 30 PM](https://user-images.githubusercontent.com/110858141/184423426-a1b2aceb-35b6-4c66-ac3c-3b6f6d5bb244.png)

for pancakeswap the dexFee is 1.0025, for uniswap 1.003 and so on...

- The bot currently frontruns trades that use swapExactETHForTokens and swapExactTokensForTokens. You can modify this bot to accept more methods. For each method you must adjust the parameters accordingly. For example, for swapExactETHForTokens the amountIn corresponds to the tx.value field while for swapExactTokensForTokens it corresponds to params[2].value. 

- This bot does not uses Flashbot's bundling because it is generalized to work on chains other than Ethereum. It is riskier to frontrun on chains like BSC, FTM, AVAX because you cannot bundle the [frontrun tx - victim tx - backrun tx] into a single atomic tx as in a FlashBot's bundle. The transactions are executed non-atomically meaning you could waste money on fees. Indeed this bot still achieves to make 1$-10$ profitable sandwiches on bsc with a good node but also needs to be improved to save gas! I will leave this to you and you shall learn a lot.

- With the current configuration of the bot you can also modify it to do PGAs (priced-gas-auctions). A strategy would be to save in memory the highest gasPrice tx from the mempool. If the gasPrice is higher than yours, re-send the frontrun tx with the same nonce and higher gasPrice to update the new transaction. The sell tx is a backrun, meaning that it must have the same gasPrice as the victim buy transaction so that it is directly after it !
Currently this bot sends two transactions at the same time. The frontrun tx has a gasPrice of [user_gasPrice + 1 wei] and the backrun tx has a gasPrice of user_gasPrice. Hence the frontruntx should lend before the victim and the backrun tx after the victim. A perfect sandwich ! 

- A few problems you will encounter
  1. People betting higher than you (will beat you frontrun tx)
  2. People faster than you (will beat your backrun tx)
  3.  Toxic tokens and fee tokens
 
 To solve 1 you must do PGAs as mentionned before, to solve 2 you must make this bot faster, to solve 3 you must see part 2 of NO BULLSHIT GUIDE TO MEV by xCaptainFortune which has an excellent code implementation to filter tokens.


ENJOY !

