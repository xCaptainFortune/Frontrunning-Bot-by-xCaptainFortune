const {ethers} =  require('ethers');
const {PANCAKE_ROUTER_ADDRESS,WEBSOCKET_PROVIDER_LINK, TOKEN_ADDRESSES, PRIVATE_KEY} = require('./constants.js');
const mnemonic = PRIVATE_KEY; //your memonic;
const provider = new ethers.providers.WebSocketProvider(WEBSOCKET_PROVIDER_LINK);
const wallet = new ethers.Wallet(mnemonic);
const account = wallet.connect(provider);
const recipient = account.getAddress();


const start = async() => {
    const  out_token_addresses  = TOKEN_ADDRESSES;
    for(var index = 0; index < out_token_addresses.length; index++) {
        await approveIn(out_token_addresses[index]);
     }
    }




const approveIn = async (tokenIn) => {
    const tokenApprove = new ethers.Contract(
        tokenIn,
        [
            'function approve(address spender, uint256 amount) external returns (bool)',
            'function allowance(address owner, address spender) external view returns (uint)'
        ],
        account
    );

        const allowance = await tokenApprove.allowance(recipient,PANCAKE_ROUTER_ADDRESS);

        if (allowance > 9999999){
            console.log(('Current Allowance: '+ allowance));
        }else{
            console.log('Approving token...');
            const approve = await tokenApprove.approve(
                PANCAKE_ROUTER_ADDRESS, //pancake router
                ethers.constants.MaxUint256, //max approve
                {
                    'gasLimit': '300000',
                    'gasPrice': ethers.utils.parseUnits('10', 'gwei'), //INCREASE IN FUTURE ? FOR ETHEREUM
                }
            );
         
            const approveReceipt = await approve.wait();
            console.log(approveReceipt);
            console.log(`txHash: ${approveReceipt.logs[0].transactionHash}`);
        }
   
}

start();