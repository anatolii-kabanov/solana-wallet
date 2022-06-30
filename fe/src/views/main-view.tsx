import { AnchorProvider, Wallet } from '@project-serum/anchor';
import { Commitment, Connection } from '@solana/web3.js';
import React from 'react';

const opts = {
    preflightCommitment: 'processed' as Commitment,
};

export const MainView: React.FC = () => {

    const getProvider = async () => {
        /* create the provider and return it to the caller */
        /* network set to local network for now */
        const network = 'http://127.0.0.1:8899';
        const connection = new Connection(network, opts.preflightCommitment);

        const provider = new AnchorProvider(
            connection,
            {} as Wallet,
            opts,
        );
        return provider;
    };

    const createAccount = async () => {
        const provider = await getProvider();
        console.log('provider:', provider)
    }
    return <div className='main-view'>
        <button onClick={createAccount}>Create Account</button>
    </div>;
};

export default MainView;
