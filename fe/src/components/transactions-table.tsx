import React, { useEffect, useState } from 'react';
import { Program, ProgramAccount } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { Button, Table } from 'react-bootstrap';

interface TransactionsTableProps {
    program: Program;
    walletKey: PublicKey;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
    program,
    walletKey,
}) => {
    const [transactions, setTransactions] = useState<ProgramAccount[]>([]);

    const getAllTransactions = async () => {
        const transactions = await program.account.transaction.all();
        console.log('transactions', transactions);
        setTransactions(transactions);
    };

    useEffect(() => {
        getAllTransactions();
    }, []);

    const confirm = async (transactionKey: PublicKey, multisig: PublicKey) => {
        try {
            await program.methods
                .confirm()
                .accounts({
                    multisig: multisig,
                    transaction: transactionKey,
                    owner: walletKey,
                })
                .rpc();
        } catch (err) {
            console.log('Confirm transaction error: ', err);
        }
    };

    const reject = async (transactionKey: PublicKey, multisig: PublicKey) => {
        try {
            await program.methods
                .reject()
                .accounts({
                    multisig: multisig,
                    transaction: transactionKey,
                    owner: walletKey,
                })
                .rpc();
        } catch (err) {
            console.log('Reject transaction error: ', err);
        }
    };

    const allTransactions = () => {
        return transactions.map((t, i) => {
            const key = t.publicKey.toBase58();
            return (
                <tr key={key}>
                    <td>{i + 1}</td>
                    <td>{key}</td>
                    <td>{t.account.multisig.toBase58()}</td>
                    <td>
                        <Button
                            className='m-1'
                            variant='primary'
                            onClick={() =>
                                confirm(t.publicKey, t.account.multisig)
                            }
                        >
                            Confirm
                        </Button>
                        <Button
                            className='m-1'
                            variant='danger'
                            onClick={() =>
                                reject(t.publicKey, t.account.multisig)
                            }
                        >
                            Reject
                        </Button>
                    </td>
                </tr>
            );
        });
    };

    return (
        <>
            <div>Transactions</div>
            <Table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Transaction address</th>
                        <th>Account address #</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>{allTransactions()}</tbody>
            </Table>
        </>
    );
};

export default TransactionsTable;
