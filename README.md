# Frontrunning Bot by xCaptainFortune

This is a frontrunning bot I wrote as a better alternative to LIBEVM'S Sandwich bot. This bot contains:

- Fetching data from pending transactions (mempool)
- Decoding transaction data
- Unlike LIBEVM's bot we do not use any profit algos such as Binary search to find the most profitable amount_in for our trade. This is too slow and the optimal amount can be calculated much faster in one step from a simple equation.  

When a user makes a trade, he will accept a certain slippage tolerance. A Sandwich Bot operator takes advantage of this slippage tolerance to buy the most tokens possible until the user's slippage tolerance has been reached. Hence for a sandwich the optimal amount of tokens to buy is the one that moves the price enough so that the user gets as less tokens as possible (in a transaction data this corresponds to the minimum_amount_out calculated from the user's slippage tolerance)

I'll let you reason about this so you can go and attempt to find the equation by yourself which is a fun and challenging exercise for you to do. The equation you should obtain is

![Screen Shot 2022-08-12 at 1 59 30 PM](https://user-images.githubusercontent.com/110858141/184416723-a1b2fa15-9da5-4203-a7ae-eff06045b9be.png)

As an example, suppose the reserves of a TOKEN-WETH pool correspond to x: 30 000 y: 10 . The user is trading on pancakeswap hence the dexFee is 1.0025. The user'ss minimum amount of tokens that he will accept from buying 1 eth worth of tokens is 2700.
