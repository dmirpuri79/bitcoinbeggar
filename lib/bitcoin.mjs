import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';

const bip32 = BIP32Factory(ecc);

const NETWORKS = {
  mainnet: bitcoin.networks.bitcoin,
  testnet: bitcoin.networks.testnet
};

const SLIP132_PREFIXES = {
  xpub: { public: 0x0488b21e, private: 0x0488ade4 },
  ypub: { public: 0x049d7cb2, private: 0x049d7878 },
  zpub: { public: 0x04b24746, private: 0x04b2430c },
  tpub: { public: 0x043587cf, private: 0x04358394 },
  upub: { public: 0x044a5262, private: 0x044a4e28 },
  vpub: { public: 0x045f1cf6, private: 0x045f18bc }
};

export function getBitcoinNetwork(networkName = 'mainnet') {
  const network = NETWORKS[networkName];
  if (!network) {
    throw new Error(`Unsupported bitcoin network: ${networkName}`);
  }
  return network;
}

function getAccountNetwork(accountKey, networkName) {
  const baseNetwork = getBitcoinNetwork(networkName);
  const prefix = accountKey.slice(0, 4).toLowerCase();
  const slip132 = SLIP132_PREFIXES[prefix];

  if (!slip132) {
    return baseNetwork;
  }

  return {
    ...baseNetwork,
    bip32: {
      public: slip132.public,
      private: slip132.private
    }
  };
}

export function deriveClaimAddress({ xpub, index, networkName = 'mainnet' }) {
  if (!Number.isInteger(index) || index < 0) {
    throw new Error('Derivation index must be a non-negative integer');
  }

  const outputNetwork = getBitcoinNetwork(networkName);
  const accountNetwork = getAccountNetwork(xpub, networkName);
  const account = bip32.fromBase58(xpub, accountNetwork);
  const child = account.derive(0).derive(index);
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(child.publicKey),
    network: outputNetwork
  });

  if (!address) {
    throw new Error('Unable to derive bitcoin address');
  }

  return address;
}
