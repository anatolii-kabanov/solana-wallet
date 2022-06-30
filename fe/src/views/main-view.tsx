import React from 'react';
import { AnchorProvider, Idl, Program } from '@project-serum/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Commitment, Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import idl from '../be.json';

const opts = {
    preflightCommitment: 'processed' as Commitment,
};
/* create an account  */
const baseAccount = Keypair.generate();
const programId = new PublicKey(idl.metadata.address);

interface MainViewProps {
    network: string;
}

export const MainView: React.FC<MainViewProps> = ({ network }) => {
    console.log('baseAccount', baseAccount)
    const wallet = useWallet();
    const getProvider = async () => {
        /* create the provider and return it to the caller */
        /* network set to local network for now */
        const connection = new Connection(network, opts.preflightCommitment);
        const provider = new AnchorProvider(
            connection,
            wallet as any,
            opts,
        );
        return provider;
    };

    const createAccount = async () => {
        const provider = await getProvider();
        console.log('provider:', provider);
        /* create the program interface combining the idl, program ID, and provider */
        const program = new Program(idl as Idl, programId, provider);
        try {
            /* interact with the program via rpc */
            await program.rpc.create({
                accounts: {
                    baseAccount: baseAccount.publicKey,
                    user: wallet.publicKey!,
                    systemProgram: SystemProgram.programId,
                },
                signers: [baseAccount]
            });

            const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
            console.log('account: ', account);
      
        } catch (err) {
            console.log("Transaction error: ", err);
        }
    }

    return !wallet.connected ? (
        <WalletMultiButton />
    ) : (
        <div className='main-view'>
            <button onClick={createAccount}>Create Account</button>
        </div>
    );
       
};

export default MainView;
