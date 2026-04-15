import { formatSatsAsBtc } from './throne.mjs';

export function shortenAddress(address) {
  if (!address) return '—';
  if (address.length <= 8) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function mapPublicState({ throne = {}, transactions = [] } = {}) {
  return {
    throne: {
      alias: throne.current_alias || 'None yet',
      message: throne.current_message || 'The sign belongs to whoever makes this impossible to ignore.',
      amount_btc: formatSatsAsBtc(throne.current_sats || 0),
      wallet_short: shortenAddress(throne.current_address),
      expires_at: throne.throne_expires_at || null
    },
    treasury_btc: formatSatsAsBtc(throne.treasury_sats || 0),
    transactions: transactions.map((transaction) => ({
      alias: transaction.alias,
      amount_btc: formatSatsAsBtc(transaction.sats || 0),
      txid: transaction.txid,
      confirmed_at: transaction.confirmed_at,
      won_throne: Boolean(transaction.won_throne)
    }))
  };
}
