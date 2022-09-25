// Import Solana web3 functinalities
const {
    Connection,
    PublicKey,
    clusterApiUrl,
    Keypair,
    LAMPORTS_PER_SOL,
    Transaction,
    SystemProgram,
    sendAndConfirmRawTransaction,
    sendAndConfirmTransaction
} = require("@solana/web3.js");

const DEMO_FROM_SECRET_KEY = new Uint8Array(
    [
        168, 82, 99, 8, 152, 95, 125, 4, 128, 125, 141,
        249, 251, 199, 155, 220, 40, 70, 93, 188, 171, 255,
        68, 61, 74, 225, 95, 173, 222, 200, 172, 101, 128,
        192, 51, 133, 95, 70, 89, 232, 197, 186, 178, 187,
        22, 30, 56, 171, 164, 191, 111, 230, 55, 100, 210,
        100, 218, 128, 117, 64, 209, 157, 236, 217
    ]
);

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const getWalletBalance = async (address) => {
    try {
        const walletBalance = await connection.getBalance(
            new PublicKey(address)
        );
        console.log(`Wallet ${address} balance: ${parseInt(walletBalance) / LAMPORTS_PER_SOL} SOL`);
        return walletBalance;
    } catch (err) {
        console.log(err);
    }
};

const airDropSol = async (address) => {
    try {
        // Aidrop 2 SOL to Sender wallet
        console.log("Airdopping some SOL to Sender wallet!");
        const fromAirDropSignature = await connection.requestAirdrop(
            new PublicKey(address),
            2 * LAMPORTS_PER_SOL
        );

        // Latest blockhash (unique identifer of the block) of the cluster
        let latestBlockHash = await connection.getLatestBlockhash();

        // Confirm transaction using the last valid block height (refers to its time)
        // to check for transaction expiration
        await connection.confirmTransaction({
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: fromAirDropSignature
        });

        console.log("Airdrop completed for the Sender account");
    } catch (err) {
        console.log(err);
    }
};

const transferSol = async (senderKp, receiver, walletBalance) => {
    try {
        // Send money from "from" wallet and into "to" wallet
        var transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: senderKp.publicKey,
                toPubkey: receiver,
                lamports: walletBalance / 2
            })
        );

        // Sign transaction
        var signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [senderKp]
        );
        console.log('Signature is ', signature);
    } catch (err) {
        console.log(err);
    }
}

const mainFunction = async () => {
    // Get Keypair from Secret Key
    var fromKp = Keypair.fromSecretKey(DEMO_FROM_SECRET_KEY);
    const from = fromKp.publicKey;

    // Generate another Keypair (account we'll be sending to)
    const to = Keypair.generate().publicKey;

    await getWalletBalance(from);
    await getWalletBalance(to);
    await airDropSol(from);
    const walletBalance = await getWalletBalance(from);
    await transferSol(fromKp, to, walletBalance);
    await getWalletBalance(from);
    await getWalletBalance(to);
}

mainFunction();