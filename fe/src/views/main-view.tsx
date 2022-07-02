import './main-view.css';
import React, { ChangeEvent, useState } from 'react';
import { AnchorProvider, BN, Idl, Program } from '@project-serum/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Commitment, Connection, Keypair, PublicKey } from '@solana/web3.js';
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
    const wallet = useWallet();
    const [threshold, setThreshold] = useState<number>(1);
    const [owners, setOwners] = useState<string>('');

    const onThresholdChange = (e: ChangeEvent<any>) => {
        setThreshold(e.target.value);
    };
    const onOwnersChange = (e: ChangeEvent<any>) => {
        setOwners(e.target.value);
    };
    const getProvider = () => {
        /* create the provider and return it to the caller */
        /* network set to local network for now */
        const connection = new Connection(network, opts.preflightCommitment);
        const provider = new AnchorProvider(connection, wallet as any, opts);
        return provider;
    };

    const createAccount = async () => {
        const provider = getProvider();
        /* create the program interface combining the idl, program ID, and provider */
        const program = new Program(idl as Idl, programId, provider);
        const multisigSize = 255;
        const ownersOfMutlisig = owners
            ?.replace(/\n/g, '')
            .split(',')
            .map((o) => new PublicKey(o.toString()));

        try {
            /* interact with the program via methods */
            await program.methods
                .createMultisig(ownersOfMutlisig, new BN(threshold))
                .accounts({
                    multisig: multisigAcc.publicKey,
                })
                .preInstructions([
                    await program.account.multisig.createInstruction(
                        multisigAcc,
                        multisigSize,
                    ),
                ])
                .signers([multisigAcc])
                .rpc();
            /* Fetch the account */
            let multisigAccount = await program.account.multisig.fetch(
                multisigAcc.publicKey,
            );
            console.log('account: ', multisigAccount);
        } catch (err) {
            console.log('Create account error: ', err);
        }
    };

    const createTransaction = async () => {
        const provider = getProvider();
        /* create the program interface combining the idl, program ID, and provider */
        const program = new Program(idl as Idl, programId, provider);
        try {
            /* interact with the program via rpc */
            const transactionAcc = Keypair.generate();
            const accounts = [
                {
                    pubkey: multisigAcc.publicKey,
                    isWritable: true,
                    isSigner: false,
                },
            ];
            const transactionSize = 255;
            await program.methods
                .createTransaction(programId, accounts)
                .accounts({
                    multisig: multisigAcc.publicKey,
                    transaction: transactionAcc.publicKey,
                    proposer: wallet.publicKey!,
                })
                .preInstructions([
                    await program.account.transaction.createInstruction(
                        transactionAcc,
                        transactionSize,
                    ),
                ])
                .signers([transactionAcc])
                .rpc();
            /* Fetch the account and check the value of count */
            let txAccount = await program.account.transaction.fetch(
                transactionAcc.publicKey,
            );
            console.log('txAccount: ', txAccount);
        } catch (err) {
            console.log('Create transaction error: ', err);
        }
    };

    const confirm = async (transactionKey: PublicKey) => {
        const provider = getProvider();
        /* create the program interface combining the idl, program ID, and provider */
        const program = new Program(idl as Idl, programId, provider);
        try {
            await program.methods
                .confirm()
                .accounts({
                    multisig: multisigAcc.publicKey,
                    transaction: transactionKey,
                    owner: wallet.publicKey!,
                })
                .rpc();
        } catch (err) {
            console.log('Confirm transaction error: ', err);
        }
    }

    const reject = async (transactionKey: PublicKey) => {
        const provider = getProvider();
        /* create the program interface combining the idl, program ID, and provider */
        const program = new Program(idl as Idl, programId, provider);
        try {
            await program.methods
                .reject()
                .accounts({
                    multisig: multisigAcc.publicKey,
                    transaction: transactionKey,
                    owner: wallet.publicKey!,
                })
                .rpc();
        } catch (err) {
            console.log('Reject transaction error: ', err);
        }
    }

    return !wallet.connected ? (
        <WalletMultiButton />
    ) : (
        <div className='main-view'>
            <div>
                <textarea rows={5} onChange={onOwnersChange} />
            </div>
            <div>
                <input
                    type='number'
                    min='2'
                    value={threshold}
                    onChange={onThresholdChange}
                />
            </div>
            <button onClick={createAccount}>Create Account</button>
            <button onClick={createTransaction}>Create Transaction</button>
        </div>
    );
};

export default MainView;
