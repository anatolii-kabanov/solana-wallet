import './main-view.css';
import React, { ChangeEvent, useState } from 'react';
import { AnchorProvider, BN, Idl, Program } from '@project-serum/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Commitment, Connection, Keypair, PublicKey } from '@solana/web3.js';
import idl from '../be.json';
import TransactionsTable from '../components/transactions-table';
import AccountsTable from '../components/accounts-table';
import { Button, FloatingLabel, Form } from 'react-bootstrap';

const opts = {
    preflightCommitment: 'processed' as Commitment,
};

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
    const getProgram = () => {
        /* create the provider and return it to the caller */
        /* network set to local network for now */
        const connection = new Connection(network, opts.preflightCommitment);
        const provider = new AnchorProvider(connection, wallet as any, opts);
        /* create the program interface combining the idl, program ID, and provider */
        const program = new Program(idl as Idl, programId, provider);
        return program;
    };

    const program = getProgram();

    const createAccount = async () => {
        const multisigAcc = Keypair.generate();
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
            // Fetch the account that can be added to the list of created accounts
            const multisigAccount = await program.account.multisig.fetch(
                multisigAcc.publicKey,
            );
            console.log('account: ', multisigAccount);
        } catch (err) {
            console.log('Create account error: ', err);
        }
    };

    return !wallet.connected ? (
        <WalletMultiButton />
    ) : (
        <div className='main-view'>
            <Form.Group className="mb-3">
                <FloatingLabel
                    controlId='threshold'
                    label='Threshold'
                    className='mb-3'
                >
                    <Form.Control
                        as='input'
                        type='number'
                        placeholder='Minimum signers'
                        value={threshold}
                        onChange={onThresholdChange}
                    />
                </FloatingLabel>
                <FloatingLabel controlId='owners' label='Wallet addresses'>
                    <Form.Control
                        as='textarea'
                        placeholder='Put wallets addresses'
                        style={{ height: '150px' }}
                        value={owners}
                        onChange={onOwnersChange}
                    />
                </FloatingLabel>
            </Form.Group>
            <Form.Group className="mb-3">
                <Button variant='primary' onClick={createAccount}>
                    Create Account
                </Button>
            </Form.Group>
            {wallet.publicKey && (
                <>
                    <AccountsTable
                        program={program}
                        walletKey={wallet.publicKey}
                        programId={programId}
                    />
                    <TransactionsTable
                        program={program}
                        walletKey={wallet.publicKey}
                    />
                </>
            )}
        </div>
    );
};

export default MainView;
