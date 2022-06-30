import './main-view.css';
import React, { ChangeEvent, useState } from 'react';
import { AnchorProvider, Idl, Program } from '@project-serum/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Commitment, Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import idl from '../be.json';

const opts = {
    preflightCommitment: 'processed' as Commitment,
};
/* create an account  */
const multisigAcc = Keypair.generate();
const programId = new PublicKey(idl.metadata.address);

interface MainViewProps {
    network: string;
}

export const MainView: React.FC<MainViewProps> = ({ network }) => {
    console.log('multisigAcc', multisigAcc)
    const wallet = useWallet();
    const [threshold, setThreshold] = useState<number>(1);
    const [owners, setOwners] = useState<string>('');
    const onThresholdChange = (e: ChangeEvent<any>) => {
        setThreshold(e.target.value);
        console.log('threshold:', threshold);
    }
    const onOwnersChange = (e: ChangeEvent<any>) => {
        setOwners(e.target.value);
        console.log('owners:', owners);
    }
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
        const ownersOfMutlisig = owners?.split(',');
        try {
            /* interact with the program via rpc */
            
            await program.rpc.createMultisig(ownersOfMutlisig, threshold, {
                accounts: {
                    multisig: multisigAcc.publicKey,
                },
                signers: [multisigAcc],
            });

             /* Fetch the account and check the value of count */
            let multisigAccount = await program.account.multisig.fetch(
                multisigAcc.publicKey,
            );
            console.log('account: ', multisigAccount);
      
        } catch (err) {
            console.log("Transaction error: ", err);
        }
    }

    return !wallet.connected ? (
        <WalletMultiButton />
    ) : (
        <div className='main-view'>
            <div>
                <textarea rows={5} onChange={onOwnersChange}/>
            </div>
            <div>
                <input type="number" min='2' value={threshold} onChange={onThresholdChange}/>
            </div>
            <button onClick={createAccount}>Create Account</button>
        </div>
    );
       
};

export default MainView;
