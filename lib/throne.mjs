export function formatSatsAsBtc(sats = 0) {
  return (Number(sats || 0) / 100000000).toFixed(8);
}

export function selectWinningClaim(claims = []) {
  const confirmedClaims = claims.filter((claim) => Number(claim.confirmations || 0) >= 1 && Number(claim.sats_received || 0) > 0);
  if (confirmedClaims.length === 0) {
    return null;
  }

  return confirmedClaims.sort((left, right) => {
    const amountDelta = Number(right.sats_received || 0) - Number(left.sats_received || 0);
    if (amountDelta !== 0) return amountDelta;

    return new Date(right.confirmed_at).getTime() - new Date(left.confirmed_at).getTime();
  })[0];
}

export function buildThroneState({
  claims = [],
  now = new Date().toISOString(),
  durationHours = 24,
  defaultMessage = 'The sign belongs to whoever makes this impossible to ignore.'
} = {}) {
  const winner = selectWinningClaim(claims);
  const treasurySats = claims
    .filter((claim) => Number(claim.confirmations || 0) >= 1)
    .reduce((sum, claim) => sum + Number(claim.sats_received || 0), 0);

  if (!winner) {
    return {
      current_alias: null,
      current_message: defaultMessage,
      current_sats: 0,
      current_address: null,
      throne_started_at: null,
      throne_expires_at: null,
      treasury_sats: treasurySats,
      time_remaining_ms: 0
    };
  }

  const throneStartedAt = new Date(winner.confirmed_at);
  const throneExpiresAt = new Date(throneStartedAt.getTime() + durationHours * 60 * 60 * 1000);
  const remaining = Math.max(0, throneExpiresAt.getTime() - new Date(now).getTime());

  return {
    current_alias: winner.alias,
    current_message: winner.message || defaultMessage,
    current_sats: Number(winner.sats_received || 0),
    current_address: winner.address || null,
    current_intent_id: winner.id,
    throne_started_at: throneStartedAt.toISOString(),
    throne_expires_at: throneExpiresAt.toISOString(),
    treasury_sats: treasurySats,
    time_remaining_ms: remaining
  };
}
