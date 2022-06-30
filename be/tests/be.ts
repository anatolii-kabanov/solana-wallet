import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Be } from "../target/types/be";
import assert from "assert";
const { SystemProgram } = anchor.web3;

describe("be", () => {
    /* create and set a Provider */
    const provider = anchor.AnchorProvider.env();
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    let _baseAccount;

    const program = anchor.workspace.Be as Program<Be>;
    it('Creates a counter)', async () => {
        /* Call the create function via RPC */
        const baseAccount = anchor.web3.Keypair.generate();
        await program.rpc.create({
            accounts: {
                baseAccount: baseAccount.publicKey,
                user: provider.wallet.publicKey,
                systemProgram: SystemProgram.programId,
            },
            signers: [baseAccount],
        });

        /* Fetch the account and check the value of count */
        const account = await program.account.baseAccount.fetch(
            baseAccount.publicKey,
        );
        console.log('Count 0: ', account.count.toString());
        assert.ok(account.count.toString() == "0");
        _baseAccount = baseAccount;
    });

    it('Increments the counter', async () => {
        const baseAccount = _baseAccount;

        await program.rpc.increment({
            accounts: {
                baseAccount: baseAccount.publicKey,
            },
        });

        const account = await program.account.baseAccount.fetch(
            baseAccount.publicKey,
        );
        console.log('Count 1: ', account.count.toString());
        assert.ok(account.count.toString() == "1");
    });

});