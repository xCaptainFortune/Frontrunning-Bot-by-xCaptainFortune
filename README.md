# Frontrunning Bot by xCaptainFortune

This is a frontrunning bot I wrote as a better alternative to LIBEVM'S Sandwich bot. This bot contains:

- Fetching data from pending transactions (mempool)
- Decoding transaction data
- Unlike LIBEVM's bot we do not use any profit algos such as Binary search to find the most profitable amount_in for our trade. This is too slow and the optimal amount can be calculated much faster in one step from a simple equation.  

(1) When a user makes a trade, he will accept a certain slippage tolerance. A Sandwich Bot operator takes advantage of this slippage tolerance to buy the most tokens possible until the user's slippage tolerance has been reached. Hence for a sandwich the optimal amount of tokens to buy is the one that moves the price enough so that the user gets as less tokens as possible (in a transaction data this corresponds to the minimum_amount_out calculated from the user's slippage tolerance)

I'll let you reason about this so you can go and attempt to find the equation by yourself which is a fun and challenging exercise for you to do. The equation you should obtain is


As an example, suppose the reserves of a TOKEN-WETH pool correspond to x: 30 000 y: 10 . The user is trading on pancakeswap hence the dexFee is 1.0025. The user's minimum amount of tokens that he will accept from adding 1 eth into the pool is 2700 tokens.

![Screen Shot 2022-08-12 at 2 20 31 PM](https://user-images.githubusercontent.com/110858141/184420304-a680c548-0ff5-433e-b3cb-f98b8593714e.png)

According to our magic equation, for the user to obtain 2700 tokens at the end of the sandwich the operator must add 0.05277741218 eth to the pool.

![Screen Shot 2022-08-12 at 2 22 27 PM](https://user-images.githubusercontent.com/110858141/184420532-2e1aced6-fe2a-4f2f-9bb6-368caa6473cc.png)

let's verify this step by step. After we add 0.05277741218 eth to the pool the new token reserves will be 29 842.49
(we are using AMM Constant formula X*Y = K)

![Screen Shot 2022-08-12 at 2 24 59 PM](https://user-images.githubusercontent.com/110858141/184420901-f0ac2f00-a9a3-43c9-805b-ceac123a7f84.png)

Now that the frontrun transaction is done, the user will proceed to add 1 eth to the pool with current reserves  x: 29 842.49, y: 10.05277741218. After he adds 1 eth, the tokens reserves will be 27142.49901.

![Screen Shot 2022-08-12 at 2 29 12 PM](https://user-images.githubusercontent.com/110858141/184421493-f85a76e0-9592-4f79-a1a6-30735434d262.png)

The inital token reserves were 29 842.49 and the final token reserves were 27142.49901. Meaning that he obtained 2700 tokens ! (29 842.49 - 27142.49901).
By adding 0.0527 eth to the pool before the user did we managed to give him the worse possible price he could get ! 

After the user purchases his 2700 tokens, we sell our 157.51 tokens we got from our 0.0527 eth. 

![Screen Shot 2022-08-12 at 2 36 54 PM](https://user-images.githubusercontent.com/110858141/184422553-39beadf7-cb9f-4ef1-b903-bd4b8ef96f76.png)

The final eth reserves are 10.98 and before that it was, 11.05277 (10.05277 + 1) meaning that we got 0.07277 eth from our trade.

A net profit of 0.02 eth !! (0.07277 - 0.05277). It turns out this is actually the maximum amount of eth you could of have extracted from this trade. This was possible by buying as most tokens as possible before the user reached his slippage tolerance corresponding to 2700 tokens.

The bot considers the dexFee and so the fixed equation corresponds to

![Screen Shot 2022-08-12 at 1 59 30 PM](https://user-images.githubusercontent.com/110858141/184423426-a1b2aceb-35b6-4c66-ac3c-3b6f6d5bb244.png)

for pancakeswap the dexFee is 1.0025, for uniswap 1.003 and so on...


