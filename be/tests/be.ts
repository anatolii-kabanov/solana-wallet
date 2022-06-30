import * as anchor from '@project-serum/anchor';
import { AnchorError, Program } from '@project-serum/anchor';
import { Be } from '../target/types/be';
import assert from 'assert';

describe('be', () => {
    /* create and set a Provider */
    const provider = anchor.AnchorProvider.env();
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.Be as Program<Be>;
    const owner1 = anchor.web3.Keypair.generate();
    const owner2 = anchor.web3.Keypair.generate();
    const owner3 = anchor.web3.Keypair.generate();
    const owners = [owner1.publicKey, owner2.publicKey, owner3.publicKey];
    // Create size of min
    const threshold = new anchor.BN(2);

    it('Should create multisig', async () => {
        /* Call the create function via RPC */
        const multisig = anchor.web3.Keypair.generate();
        const multisigSize = 255;
        const [multisigSigner, nonce] =
            await anchor.web3.PublicKey.findProgramAddress(
                [multisig.publicKey.toBuffer()],
                program.programId,
            );
        await program.rpc.createMultisig(owners, threshold, {
            accounts: {
                multisig: multisig.publicKey,
            },
            instructions: [
                await program.account.multisig.createInstruction(
                    multisig,
                    multisigSize,
                ),
            ],
            signers: [multisig],
        });

        /* Fetch the account and check the value of count */
        let multisigAccount = await program.account.multisig.fetch(
            multisig.publicKey,
        );
        console.log('Count 3: ', multisigAccount.owners.length.toString());
        assert.ok(multisigAccount.owners.length === 3);
        assert.ok(multisigAccount.threshold.eq(new anchor.BN(2)));
    });

    it("Should throw error 'UniqueOwners' on create multisig", async () => {
        /* Call the create function via RPC */
        const multisig = anchor.web3.Keypair.generate();
        const multisigSize = 255;
        const [multisigSigner, nonce] =
            await anchor.web3.PublicKey.findProgramAddress(
                [multisig.publicKey.toBuffer()],
                program.programId,
            );
        await program.rpc
            .createMultisig([owner1.publicKey, owner1.publicKey], threshold, {
                accounts: {
                    multisig: multisig.publicKey,
                },
                instructions: [
                    await program.account.multisig.createInstruction(
                        multisig,
                        multisigSize,
                    ),
                ],
                signers: [multisig],
            })
            .then(() => {
                assert.fail('Should throw error');
            })
            .catch((e: AnchorError) => {
                assert.equal(e.error.errorMessage, 'Owners must be unique.');
            });
    });

    it("Should throw error 'InvalidThreshold' on create multisig", async () => {
        /* Call the create function via RPC */
        const multisig = anchor.web3.Keypair.generate();
        const multisigSize = 255;
        const [multisigSigner, nonce] =
            await anchor.web3.PublicKey.findProgramAddress(
                [multisig.publicKey.toBuffer()],
                program.programId,
            );
        await program.rpc
            .createMultisig([owner1.publicKey, owner2.publicKey], new anchor.BN(3), {
                accounts: {
                    multisig: multisig.publicKey,
                },
                instructions: [
                    await program.account.multisig.createInstruction(
                        multisig,
                        multisigSize,
                    ),
                ],
                signers: [multisig],
            })
            .then(() => {
                assert.fail('Should throw error');
            })
            .catch((e: AnchorError) => {
                assert.equal(e.error.errorMessage, 'Threshold must be less than or equal to the number of owners.');
            });
    });
});
