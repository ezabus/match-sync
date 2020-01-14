const {
  Pool
} = require('pg');
const axios = require('axios');
const database = require('./database');
const lineupCollector = require('./lineupCollector');
const Match = require('./Match');

const pool = new Pool();

async function syncIfRequired() {
  const isRequired = await isSyncRequired();
  if (isRequired) {
    await sync();
    await updateLastSyncDate();
  }
}

async function isSyncRequired() {
  const selectLastUpdateTime = 'SELECT date FROM epl.last_update';
  const res = await pool.query(selectLastUpdateTime);
  const lastUpdateDate = res.rows[0].date;
  const updatePeriod = 60 * 3 * 1000;
  const now = new Date();
  const isRequired = (now - lastUpdateDate) > updatePeriod;
  return isRequired;
}

async function sync(roundParameter) {
  console.log('syncing data');
  let roundNumber = roundParameter;
  if (!roundParameter) {
    roundNumber = (await axios.get('http://localhost:4000/currentRound')).data;
  }
  const matches = await currentRoundMatchesWithLineups(roundNumber);
  matches.forEach(async (matchP) => {
    const match = await matchP;
    match.saveResults();
  });
}

async function updateLastSyncDate() {
  const updateLastSync = `
        UPDATE epl.last_update
        SET date = $1;`;
  return pool.query(updateLastSync, [new Date()]);
}

async function currentRoundMatchesWithLineups(roundNumber) {
  const matches = await currentRoundMatchesRecords(roundNumber);
  return matches.map(appendLineups);
}

async function currentRoundMatchesRecords(roundNumber) {
  const matchData = await database.getMatchesForRound(roundNumber);
  return matchData.map((match) => new Match({
    round: roundNumber,
    homeTeamId: match.h_id,
    awayTeamId: match.a_id,
    homeTeamName: match.h_name,
    awayTeamName: match.a_name
  }));
}

async function appendLineups(match) {
  const homeTeamLineup = await lineupCollector(match.homeTeamId, match.round);
  const awayTeamLineup = await lineupCollector(match.awayTeamId, match.round);
  match.homeLineup = homeTeamLineup;
  match.awayLineup = awayTeamLineup;
  return match;
}

module.exports = {
  syncIfRequired
};
