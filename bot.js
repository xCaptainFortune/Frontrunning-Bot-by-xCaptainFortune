var Web3 = require('web3');
var abiDecoder = require('abi-decoder');
var _ = require('lodash');
var BigNumber = require('big-number');

const {PANCAKE_ROUTER_ADDRESS, PANCAKE_FACTORY_ADDRESS, PANCAKE_ROUTER_ABI, PANCAKE_FACTORY_ABI, PANCAKE_POOL_ABI, HTTP_PROVIDER_LINK, WEBSOCKET_PROVIDER_LINK, TOKEN_ADDRESSES, PRIVATE_KEY, MAX_AMOUNT, SLIPPAGE,GASPRICE, MINPROFIT} = require('./constants.js');
const INPUT_TOKEN_ADDRESS = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'; //TOKEN IN
const WBNB_TOKEN_ADDRESS = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';

var pool_info = [];
let i;

var amount;
const maxAmount =  MAX_AMOUNT;

var web3;
var web3Ws;
var pancakeRouter;
var pancakeFactory;

const ONE_GWEI = 1e9;

var attack_started = false;
var buyNonce;
var sellNonce


var subscription;

web3 = new Web3(new Web3.providers.HttpProvider(HTTP_PROVIDER_LINK));
web3Ws = new Web3(new Web3.providers.WebsocketProvider(WEBSOCKET_PROVIDER_LINK));
pancakeRouter = new web3.eth.Contract(PANCAKE_ROUTER_ABI, PANCAKE_ROUTER_ADDRESS);
pancakeFactory = new web3.eth.Contract(PANCAKE_FACTORY_ABI, PANCAKE_FACTORY_ADDRESS);
abiDecoder.addABI(PANCAKE_ROUTER_ABI);
const user_wallet = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
const out_token_addresses = TOKEN_ADDRESSES; 
        
const start = async() => {
    buyNonce =  await web3.eth.getTransactionCount(user_wallet.address);
    sellNonce = buyNonce + 1
    console.log(`buy nonce is ${buyNonce} and sell nonce is ${sellNonce}`)
    const  out_token_addresses  = TOKEN_ADDRESSES;
    for(var index = 0; index < out_token_addresses.length; index++) {
        await getPoolInfo(WBNB_TOKEN_ADDRESS, out_token_addresses,index);
     }
}
      
async function main() { 
try {   
        web3Ws.onopen = function(evt) {
            web3Ws.send(JSON.stringify({ method: "subscribe", topic: "transfers", address: user_wallet.address}));
            console.log('connected')
        }
        subscription = web3Ws.eth.subscribe('pendingTransactions', function (error, result) {
        }).on("data", async function (transactionHash) {
             let transaction = await web3.eth.getTransaction(transactionHash);
             if (transaction != null && transaction['to'] == PANCAKE_ROUTER_ADDRESS)
             {
                 await handleTransaction(transaction, out_token_addresses, user_wallet);
             }
        })
    } catch (error) {
      console.log('failed to fetch mempool data:')
      process.exit();
    }
}

async function handleTransaction(transaction, out_token_addresses, user_wallet) {
    
    if (await triggersFrontRun(transaction, out_token_addresses)) {
        subscription.unsubscribe();
        let gasPrice = parseInt(transaction['gasPrice']);
        let newGasPrice = gasPrice + GASPRICE*ONE_GWEI;
        if(amount > maxAmount){
            amount = maxAmount
        }
        console.log('amount is' + amount)
        var estimatedInput = ((amount*0.999)*(10**18));
        var realInput = SLIPPAGE*(amount*(10**18));
        var gasLimit = (300000);
        var outputtoken = await getAmountOut(estimatedInput, pool_info[i].input_volumn, pool_info[i].output_volumn);
        swap(newGasPrice, gasLimit, outputtoken, realInput, 0, out_token_addresses[i], user_wallet, transaction);
        swap(gasPrice, gasLimit, outputtoken, 0, 1, out_token_addresses[i], user_wallet, transaction);
        console.log('transaction attempted to frontrun is '+ transaction['hash']);
        attack_started = false;
        return execute();
    }
}

async function triggersFrontRun(transaction, out_token_addresses) {  
    if(attack_started)
        return false;
 if(parseInt(transaction['gasPrice']) / 10**9 > 10 || parseInt(transaction['gasPrice'])/10**9 < 3 ){
        return false;
    }
    console.log('gasPrice'+ transaction['gasPrice']/10**9);
    let data = parseTx(transaction['input']);
    let method = data[0];
    let params = data[1];
    console.log(method)
    if(method == 'swapExactETHForTokens')
    {
        let path = params[1].value;
        let in_token_addr = path[0];
        let out_token_addr = path[path.length-1];
        let recept_addr = params[2].value;
        let deadline = params[3].value;
        if(_.includes(out_token_addresses, out_token_addr))
        {
            i = _.indexOf(out_token_addresses, out_token_addr)
        }else{
            return false;
        }
//reserves have to be divided by decimals
        let in_amount = transaction.value; 
        let b = transaction.value/10**18;
        let out = params[0].value/10**18;
        await updatePoolInfo(i);
        const x = pool_info[i].output_volumn/10**18;
        const K = (pool_info[i].input_volumn/10**18)*(pool_info[i].output_volumn/10**18)
        const y = (pool_info[i].input_volumn/10**18)
        const a = (1/2)*(Math.sqrt((b/1.0025)*((b/1.0025)+4*(K/out)))-(b/1.0025)-2*y) //optimal amount for you to purchase
        const firstnewX = K/(y+a);
        const tokensReceived = x - firstnewX;
        const secondnewX = K/(y+a+(b/1.0025))
        const secondtokensReceived = firstnewX -  secondnewX 
        const afterSellY = K/(secondnewX+tokensReceived);
        const ethReceived = (y+a+(b/1.0025) - afterSellY);
        const profit = (ethReceived-a)-(0.0025)*(ethReceived+a)
        console.log('profit is...'+ profit)
        if(profit>MINPROFIT && a>0) 
        {
            amount = a;
            attack_started = true;
            return true;
        }
        else
        {
            return false;
        }
    }
    else if(method == 'swapExactTokensForTokens')
    {
        let path = params[2].value;
        let in_token_addr = path[path.length-2];
        let out_token_addr = path[path.length-1];
        let recept_addr = params[3].value;
        let dead_line = params[4].value;
        if(_.includes(out_token_addresses, out_token_addr))
        {
            i = _.indexOf(out_token_addresses, out_token_addr)
        }else{
            return false;
        }
        if(in_token_addr != INPUT_TOKEN_ADDRESS)
        {
            return false;
        } 
        let b = params[0].value/10**18;
        let out_min = params[1].value; 
        let out = params[1].value/10**18;
        await updatePoolInfo(i);
        const x = pool_info[i].output_volumn/10**18;
        const K = (pool_info[i].input_volumn/10**18)*(pool_info[i].output_volumn/10**18)
        const y = (pool_info[i].input_volumn/10**18)
        const a = (1/2)*(Math.sqrt((b/1.0025)*((b/1.0025)+4*(K/out)))-(b/1.0025)-2*y)
        const firstnewX = K/(y+a);
        const tokensReceived = x - firstnewX;
        const secondnewX = K/(y+a+(b/1.0025))
        const secondtokensReceived = firstnewX -  secondnewX 
        const afterSellY = K/(secondnewX+tokensReceived);
        const ethReceived = (y+a+(b/1.0025) - afterSellY);
        const profit = (ethReceived-a)-(0.0025)*(ethReceived+a)
        console.log('profit is...'+ profit)
        if(profit>MINPROFIT && a>0) 
        {
          amount = a;
          attack_started = true;
          return true;
        }
        else
        {
            return false;
        }
    }
    return false;
}

async function swap(gasPrice, gasLimit, outputtoken, outputeth, trade, out_token_address, user_wallet, transaction) {
    var from = user_wallet;
    var deadline;
    var swap;
    await web3.eth.getBlock('latest', (error, block) => {
        deadline = block.timestamp + 300; // transaction expires in 300 seconds (5 minutes)
    });
    deadline = web3.utils.toHex(deadline);
    if(trade == 0) { 
        swap = pancakeRouter.methods.swapETHForExactTokens(outputtoken.toString() , [INPUT_TOKEN_ADDRESS, out_token_address], from.address, deadline);
        var encodedABI = swap.encodeABI();
        var tx = {
            from: from.address,
            to: PANCAKE_ROUTER_ADDRESS,
            gas: gasLimit,
            gasPrice: gasPrice,
            nonce: buyNonce.toString(),
            data: encodedABI,
            value: outputeth
          };
    } else { 
        swap = pancakeRouter.methods.swapExactTokensForETH(outputtoken.toString(), '0', [out_token_address, INPUT_TOKEN_ADDRESS], from.address, deadline);
        var encodedABI = swap.encodeABI();
        var tx = {
            from: from.address,
            to: PANCAKE_ROUTER_ADDRESS,
            gas: gasLimit,
            gasPrice: gasPrice,
            nonce: sellNonce.toString(),
            data: encodedABI,
            value: 0*10**18
          };
    }
    var signedTx = await from.signTransaction(tx);
    if(trade == 0) {
        let is_pending = await isPending(transaction['hash']);
        if(!is_pending) {
            console.log("The transaction you want to attack has already been completed!!!");
            process.exit();
        }else{
        web3.eth.sendSignedTransaction(signedTx.rawTransaction)
        }
    }else{
        web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    }
}

function parseTx(input) {
    if (input == '0x')
        return ['0x', []]
    let decodedData = abiDecoder.decodeMethod(input);
    let method = decodedData['name'];
    let params = decodedData['params'];

    return [method, params]
}

async function isPending(transactionHash) {
    return await web3.eth.getTransactionReceipt(transactionHash) == null;
}

//useful structure
async function updatePoolInfo(i) {
    try{
        console.log('updating...')
        console.log(i)
        var reserves = await pool_info[i].contract.methods.getReserves().call();

        if(pool_info[i].forward) {
            var eth_balance = reserves[0];
            var token_balance = reserves[1];
        } else {
            var eth_balance = reserves[1];
            var token_balance = reserves[0];
        }

        pool_info[i].input_volumn = eth_balance;
        pool_info[i].output_volumn = token_balance;

    }catch (error) {
      
        console.log('Failed To Get Pair Info');

        return false;
    }
}

async function getPoolInfo(input_token_address, out_token_addresses, index){
    console.log(index)

        var pool_address = await pancakeFactory.methods.getPair(input_token_address, out_token_addresses[index]).call();
        var pool_contract = new web3.eth.Contract(PANCAKE_POOL_ABI, pool_address);
        var reserves = await pool_contract.methods.getReserves().call();

        var token0_address = await pool_contract.methods.token0().call();

        if(token0_address == INPUT_TOKEN_ADDRESS) {
            var forward = true;
            var bnb_balance = reserves[0];
            var token_balance = reserves[1];
        } else {
            var forward = false;
            var bnb_balance = reserves[1];
            var token_balance = reserves[0];
        }

        pool_info[index] = {'contract': pool_contract, 'forward': forward, 'input_volumn': bnb_balance, 'output_volumn': token_balance}
       
    
}

async function getAmountOut(aIn, reserveA, reserveB) {
    const aInWithFee = BigNumber(aIn).multiply(997); //0.3% fee that's right
    const numerator = BigNumber(aInWithFee).multiply(reserveB)
    const denominator = BigNumber(aInWithFee).add(BigNumber(reserveA).multiply(1000));
    const bOut = BigNumber(numerator).divide(denominator);
    return bOut
}

//-----------------EXTRA FUNCTIONS getPairAddress of tokenA-tokenB pool offline.
const getUniv2PairAddress = (tokenA, tokenB) => {
    const [token0, token1] = sortTokens(tokenA, tokenB);
  
    const salt = ethers.utils.keccak256(token0 + token1.replace("0x", ""));
    const address = ethers.utils.getCreate2Address(
      "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", // Factory address (contract creator)
      salt,
      "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f" // init code hash
    );
  
    return address;
};
  
const execute = async() =>{
start().then(() => {
    console.log('main...')
    main()
});
}
execute();



//do not use the router, use swap


//line 100 the bot finished the attack but returns main