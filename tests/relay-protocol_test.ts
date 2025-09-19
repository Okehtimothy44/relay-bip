import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.3/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Relay Protocol: Test initiating a relay transaction",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const sender = accounts.get('wallet_1')!;
        const recipient = accounts.get('wallet_2')!;

        // Configure a supported chain first
        let configChainBlock = chain.mineBlock([
            Tx.contractCall('relay-protocol', 'configure-relay-chain', [
                types.ascii('ethereum'),
                types.bool(true),
                types.uint(10),
                types.uint(1000000)
            ], deployer.address)
        ]);

        // Initiate a relay transaction
        let block = chain.mineBlock([
            Tx.contractCall('relay-protocol', 'initiate-relay', [
                types.ascii('stacks'),
                types.ascii('ethereum'),
                types.principal(recipient.address),
                types.uint(1000)
            ], sender.address)
        ]);

        // Assert the relay transaction was created successfully
        assertEquals(block.height, 3);
        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk().expectUint(1);
    }
});

Clarinet.test({
    name: "Relay Protocol: Test completing a relay transaction",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const sender = accounts.get('wallet_1')!;
        const recipient = accounts.get('wallet_2')!;

        // Configure supported chains
        let configChainBlock = chain.mineBlock([
            Tx.contractCall('relay-protocol', 'configure-relay-chain', [
                types.ascii('stacks'),
                types.bool(true),
                types.uint(10),
                types.uint(1000000)
            ], deployer.address),
            Tx.contractCall('relay-protocol', 'configure-relay-chain', [
                types.ascii('ethereum'),
                types.bool(true),
                types.uint(10),
                types.uint(1000000)
            ], deployer.address)
        ]);

        // Initiate a relay transaction
        let initiateBlock = chain.mineBlock([
            Tx.contractCall('relay-protocol', 'initiate-relay', [
                types.ascii('stacks'),
                types.ascii('ethereum'),
                types.principal(recipient.address),
                types.uint(1000)
            ], sender.address)
        ]);

        // Complete the relay transaction
        let completeBlock = chain.mineBlock([
            Tx.contractCall('relay-protocol', 'complete-relay', [
                types.uint(1),
                types.ascii('stacks'),
                types.ascii('ethereum'),
                types.buff(Buffer.from('fake-proof-data'))
            ], deployer.address)
        ]);

        // Assert the relay transaction was completed successfully
        assertEquals(completeBlock.height, 4);
        assertEquals(completeBlock.receipts.length, 1);
        completeBlock.receipts[0].result.expectOk().expectBool(true);
    }
});

Clarinet.test({
    name: "Relay Protocol: Test configuring a relay chain",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;

        let configBlock = chain.mineBlock([
            Tx.contractCall('relay-protocol', 'configure-relay-chain', [
                types.ascii('polygon'),
                types.bool(true),
                types.uint(50),
                types.uint(500000)
            ], deployer.address)
        ]);

        // Assert chain configuration was successful
        assertEquals(configBlock.height, 2);
        assertEquals(configBlock.receipts.length, 1);
        configBlock.receipts[0].result.expectOk().expectBool(true);
    }
});