import React, { useEffect, useState } from 'react';
import { Program, ProgramAccount } from '@project-serum/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import { Button, Table } from 'react-bootstrap';
interface AccountsTableProps {
    program: Program;
    walletKey: PublicKey;
    programId: PublicKey;
}

export const AccountsTable: React.FC<AccountsTableProps> = ({
    program,
    walletKey,
    programId,
}) => {
    const [multisigs, setMultisigs] = useState<ProgramAccount[]>([]);

    const getAllMultisigs = async () => {
            // To find only wallet created accoutns
            const filters = [
                {
                    memcmp: {
                        offset: 12, // number of bytes to skip
                        bytes: walletKey.toBase58(), // base58 encoded string
                    },
                },
            ];
            const multisigs = await program.account.multisig.all(filters); 
            setMultisigs(multisigs);
    };
    useEffect(() => {
        getAllMultisigs();
    }, [walletKey]);

    const createTransaction = async (multisigKey: PublicKey) => {
        try {
            /* interact with the program via rpc */
            const transactionAcc = Keypair.generate();
            const accounts = [
                {
                    pubkey: multisigKey,
                    isWritable: true,
                    isSigner: false,
                },
            ];
            const transactionSize = 255;
            await program.methods
                .createTransaction(programId, accounts)
                .accounts({
                    multisig: multisigKey,
                    transaction: transactionAcc.publicKey,
                    proposer: walletKey,
                })
                .preInstructions([
                    await program.account.transaction.createInstruction(
                        transactionAcc,
                        transactionSize,
                    ),
                ])
                .signers([transactionAcc])
                .rpc();
            // Fetch transaction that can be added to the list of transactions
            let txAccount = await program.account.transaction.fetch(
                transactionAcc.publicKey,
            );
            console.log('txAccount: ', txAccount);
        } catch (err) {
            console.log('Create transaction error: ', err);
        }
    };

    const allMultisigs = () => {
        return multisigs.map((t, i) => {
            const key = t.publicKey.toBase58();
            return (
                <tr key={key}>
                    <td>{i + 1}</td>
                    <td>{key}</td>
                    <td>{t.account.owners?.length}</td>
                    <td>{t.account.threshold.toString()}</td>
                    <td>
                        <Button
                            variant='primary'
                            onClick={() => createTransaction(t.publicKey)}
                        >
                            Create Transaction
                        </Button>
                    </td>
                </tr>
            );
        });
    };

    return (
        <>
            <div>Accounts</div>
            <Table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Account address</th>
                        <th>Owners #</th>
                        <th>Min signers #</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>{allMultisigs()}</tbody>
            </Table>
        </>
    );
};

export default AccountsTable;
