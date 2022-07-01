import * as anchor from '@project-serum/anchor';
import { AnchorError, Program } from '@project-serum/anchor';
import { Be } from '../target/types/be';
import assert from 'assert';

describe('be', () => {
    /* create and set a Provider */
    const provider = anchor.AnchorProvider.env();
    // Configure the client to use the local cluster.
    anchor.setProvider(provider);

    const program = anchor.workspace.Be as Program<Be>;
    const owner1 = anchor.web3.Keypair.generate();
    const owner2 = anchor.web3.Keypair.generate();
    const owner3 = anchor.web3.Keypair.generate();
    const owners = [owner1.publicKey, owner2.publicKey, owner3.publicKey];
    // Create size of min
    const threshold = new anchor.BN(2);
  
    let multisigAcc;
    it('Should create multisig', async () => {
        /* Call the create function via RPC */
        const multisig = anchor.web3.Keypair.generate();
        const multisigSize = 255;
        multisigAcc = multisig;

        await program.methods
            .createMultisig(owners, threshold)
            .accounts({
                multisig: multisig.publicKey,
            })
            .preInstructions([
                await program.account.multisig.createInstruction(
                    multisig,
                    multisigSize,
                ),
            ])
            .signers( [multisig])
            .rpc();

        /* Fetch the account and check the value of count */
        const multisigAccount = await program.account.multisig.fetch(
            multisig.publicKey,
        );
        console.log('Count 3: ', multisigAccount.owners.length.toString());
        assert.ok(multisigAccount.owners.length === 3);
        assert.ok(multisigAccount.threshold.eq(new anchor.BN(2)));
    });

    it('Should create transaction and confirm it', async () => {
        const transaction = anchor.web3.Keypair.generate();
        const txSize = 255;
        const pid = program.programId;
        const accounts = [
            {
                pubkey: multisigAcc.publicKey,
                isWritable: true,
                isSigner: false,
            },
        ];

        await program.methods
            .createTransaction(pid, accounts)
            .accounts({
                multisig: multisigAcc.publicKey,
                transaction: transaction.publicKey,
                proposer: owner1.publicKey,
            })
            .preInstructions([
                await program.account.transaction.createInstruction(
                    transaction,
                    txSize,
                ),
            ])
            .signers([transaction, owner1])
            .rpc();

        let txAccount = await program.account.transaction.fetch(
            transaction.publicKey,
        );

        assert.ok(txAccount.multisig.equals(multisigAcc.publicKey));
        assert.notStrictEqual(txAccount.signers, [true, false, false]);

        await program.methods
            .confirm()
            .accounts({
                multisig: multisigAcc.publicKey,
                transaction: transaction.publicKey,
                owner: owner2.publicKey,
            })
            .signers([owner2])
            .rpc();

        txAccount = await program.account.transaction.fetch(
            transaction.publicKey,
        );
        assert.notStrictEqual(txAccount.signers, [true, true, false]);
    });

    it("Should throw error 'UniqueOwners' on create multisig", async () => {
        /* Call the create function via RPC */
        const multisig = anchor.web3.Keypair.generate();
        const multisigSize = 255;
        await program.methods
            .createMultisig([owner1.publicKey, owner1.publicKey], threshold)
            .accounts({
                multisig: multisig.publicKey,
            })
            .preInstructions([
                await program.account.multisig.createInstruction(
                    multisig,
                    multisigSize,
                ),
            ])
            .signers([multisig])
            .rpc()
            .then(() => {
                assert.fail('Should throw error');
            })
            .catch((e: AnchorError) => {
                assert.equal(
                    e.error.errorMessage,
                    'Owners must be unique.',
                );
            });
    });

    it("Should throw error 'InvalidThreshold' on create multisig", async () => {
        /* Call the create function via RPC */
        const multisig = anchor.web3.Keypair.generate();
        const multisigSize = 255;
        await program.methods
            .createMultisig(
                [owner1.publicKey, owner2.publicKey],
                new anchor.BN(3),
            )
            .accounts({
                multisig: multisig.publicKey,
            })
            .preInstructions([
                await program.account.multisig.createInstruction(
                    multisig,
                    multisigSize,
                ),
            ])
            .signers([multisig])
            .rpc()
            .then(() => {
                assert.fail('Should throw error');
            })
            .catch((e: AnchorError) => {
                assert.equal(
                    e.error.errorMessage,
                    'Threshold must be less than or equal to the number of owners.',
                );
            });
    });
});
