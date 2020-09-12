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
  const curRoundData = (await axios.get('http://localhost:4000/currentRound/detailed')).data;
  const season = curRoundData.season;
  if (!roundParameter) {
    roundNumber = curRoundData.round;
  }
  const matches = await currentRoundMatchesWithLineups(roundNumber, season);
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

async function currentRoundMatchesWithLineups(roundNumber, season) {
  const matches = await currentRoundMatchesRecords(roundNumber, season);
  return matches.map(appendLineups);
}

async function currentRoundMatchesRecords(roundNumber, season) {
  const matchData = await database.getMatchesForRound(roundNumber, season);
  return matchData.map((match) => new Match({
    round: roundNumber,
    homeTeamId: match.h_id,
    awayTeamId: match.a_id,
    homeTeamName: match.h_name,
    awayTeamName: match.a_name,
    season: season
  }));
}

async function appendLineups(match) {
  const homeTeamLineup = await lineupCollector(match.homeTeamId, match.round, match.season);
  const awayTeamLineup = await lineupCollector(match.awayTeamId, match.round, match.season);
  match.homeLineup = homeTeamLineup;
  match.awayLineup = awayTeamLineup;
  return match;
}

module.exports = {
  syncIfRequired,
  sync
};
