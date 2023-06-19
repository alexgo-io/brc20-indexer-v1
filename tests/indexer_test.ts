import { Clarinet, Tx, Chain, Account, types, assertEquals } from "./deps.ts";
import { hexToBytes, expectHeaderObject, expectTxObject } from "./utils.ts";

Clarinet.test({
  name: "Ensure that witness can be parsed",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;

    // https://mempool.space/api/tx/2e951004175cbc4a0a421efbb5a42aaa4e4708c1bc15a08ab03e41020336603b/hex
    const inscription_data = "0x01000000000101885a283122b9897aa8ccfbd1b6ee8e88a81f297039506f1310ac0999fd0ec1c20000000000fdffffff01220200000000000022512053687745b1a04c2d74da5f1aa12d285df92626384fc5697de94ba6b9b9afee650340703b0cf0c88bd1e890d5b52a425cd37d4fa35e911423bf6306faeff09a98ff5c5afaf79fe02b5423771c2396abec0851af8d59896f5960b1869aa2d6323ea8927f2006449df0d86cb0c82057dfaa9dad498131215190799a442772d3407e0c0b02a7ac0063036f7264010118746578742f706c61696e3b636861727365743d7574662d3800397b2270223a226272632d3230222c226f70223a227472616e73666572222c227469636b223a2269676c69222c22616d74223a2232303030227d6821c106449df0d86cb0c82057dfaa9dad498131215190799a442772d3407e0c0b02a700000000";

    // https://mempool.space/api/tx/5760346ab0ebb18084432eea1c8f921f36e2517e0e3fea9741a1523cd5e47feb/hex
    const transfer_data = "0x020000000001023b60360302413eb08aa015bcc108474eaa2aa4b5fb1e420a4abc5c170410952e0000000000ffffffffad4836f6077e2a02a2ac0198a70374759f8fece545d2c0e12b5ba9ca9efc3fc50400000017160014770dea24279344035fbb90eab3a156b43c183decffffffff022202000000000000225120c981bdfa5eaab9d6d0da158144e1c519411e76bf11e4c5deba73b358431b53b70a7300000000000017a914fe8b7a0c78c3af44ceea9e2b033d9220631ecf9e8701401442fa68d11c85791ffd3a7efa5ceedaa4bb51ee280c0b428f4ce2c6041261a1bee22084c073efff332d6264db9e84533d8aed41ddaee96cb166fdbb70a634f802483045022100eedf43522e4fb9c7c8aa1daddf31f2f48aaefb0741a14d5b1dc390420b8bca2c02207718fe6f3dfd1291bc4cafd6ef73c58237df20528737029dd15f35d18d611ef6012103f7cefdc7515124973cb02a6f17704e254e08f6025636e68f43ebee86fe3c724100000000"

    const inscription_parsed = (chain.callReadOnlyFn('clarity-bitcoin', 'parse-wtx', [inscription_data], deployer.address)).result.expectOk().expectTuple();
    const transfer_parsed = (chain.callReadOnlyFn('clarity-bitcoin', 'parse-wtx', [transfer_data], deployer.address)).result.expectOk().expectTuple();
    // const inscription_encoded = inscription_parsed.witnesses.expectList()[0].expectList()[1];
    // console.log(inscription_encoded.slice(140,254));
    // console.log(transfer_parsed);

    console.log((chain.callReadOnlyFn('clarity-bitcoin', 'get-segwit-txid', [inscription_data], deployer.address)).result);

    const inscription_created_input = [
      inscription_data,
      types.uint(69),
      types.uint(126),
      types.uint(2),
      types.ascii("igli"),
      types.uint(2000)
    ];

    const inscription_created = (chain.callReadOnlyFn('indexer', 'verify-inscription', inscription_created_input, deployer.address)).result.expectOk().expectTuple();
    console.log(inscription_created);

    const transfer_input = [
      transfer_data,
      inscription_created.txid,
      inscription_created.content.expectTuple().owner,
      "0x5120c981bdfa5eaab9d6d0da158144e1c519411e76bf11e4c5deba73b358431b53b7"
    ];

    let block = chain.mineBlock([
      Tx.contractCall('indexer', 'inscription-created', inscription_created_input, deployer.address),
      Tx.contractCall('indexer', 'transfer', transfer_input, deployer.address)
    ]);
    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectErr().expectUint(1008);
  },
});