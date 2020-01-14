const {
  Pool,
  Client
} = require('pg');

const pool = new Pool();


async function saveTeam(teamData) {
  const client = new Client();
  await client.connect();
  const insertTeamQuery = 'INSERT INTO epl.clubs(id, name) VALUES($1, $2)';
  await client.query(insertTeamQuery, [teamData.id, teamData.name]);
  await client.end();
}

async function getClubs() {
  const client = new Client();
  await client.connect();
  const response = await client.query('SELECT * FROM epl.clubs');
  await client.end();
  return response.rows;
}

async function getClubNameToIdMap() {
  const clubs = await this.getClubs();
  return clubs.reduce((acc, row) => {
    acc[row.name] = row.id;
    return acc;
  }, {});
}

async function saveClubScheduleRecord(scheduleRecord) {
  const insertClubScheduleRecord = `
  INSERT INTO epl.club_schedule(home_club_id, away_club_id, match_date, round) VALUES($1, $2, $3, $4)
    ON CONFLICT ON CONSTRAINT teams_and_round DO UPDATE
    SET match_date = $3
  `;
  await pool.query(insertClubScheduleRecord, [
    scheduleRecord.homeId,
    scheduleRecord.awayId,
    scheduleRecord.date,
    scheduleRecord.round
  ]);
}

async function saveMatch(match) {
  const insertMatch = 'INSERT INTO epl.matches(home_team_id, away_team_id, round) VALUES($1, $2, $3)';
  await pool.query(insertMatch, [match.homeId, match.awayId, match.round]);
}

async function getMatchesForRound(round) {
  const selectMatchesForRound = `
        SELECT * FROM epl.matches_with_names
            WHERE round = $1
            ORDER BY id`;
  const res = await pool.query(selectMatchesForRound, [round]);
  return res.rows;
}

async function getMatchDetails(params) {
  const selectMatchById = `
        SELECT * FROM epl.matches_with_names
            WHERE h_id = $1 and a_id = $2 and round = $3`;
  const paramsList = [params.homeTeamId, params.awayTeamId, params.round];
  const matchData = (await pool.query(selectMatchById, paramsList)).rows[0];
  return matchData;
}

async function getLineup(teamId, round) {
  const selectLineup = `
        SELECT * FROM epl.live_lineup
            WHERE round = $1 and team_id = $2`;
  const lineup = (await pool.query(selectLineup, [round, teamId])).rows;
  return lineup;
}

async function getTeamResult(teamName, round) {
  const selectTeamResult = `
        SELECT * FROM epl.team_results
            WHERE name = $1 and round = $2`;
  const result = (await pool.query(selectTeamResult, [teamName, round])).rows[0];
  return result;
}

async function getStandingsData() {
  const selectStandingsData = 'SELECT * FROM epl.team_results_h2h_total';
  const standingsData = (await pool.query(selectStandingsData)).rows;
  return standingsData;
}

async function getRoundStats(round) {
  const selectTeamResult = 'SELECT * FROM epl.round_stats WHERE round = $1';
  const roundStats = (await pool.query(selectTeamResult, [round])).rows;
  return roundStats;
}

async function getSeasonStats() {
  const selectSeasonStats = 'SELECT * FROM epl.season_stats_with_hubrs';
  const seasonStats = (await pool.query(selectSeasonStats)).rows;
  return seasonStats;
}

async function savePlayerStats(record) {
  const savePlayerStatsRecord = `
    INSERT INTO epl.player_stats(player_id, name, round, points, goals, passes) VALUES($1, $2, $3, $4, $5, $6)
      ON CONFLICT ON CONSTRAINT player_round DO UPDATE SET
        points = $4,
        goals = $5,
        passes = $6
  `;
  await pool.query(savePlayerStatsRecord, [
    record.tagId,
    record.name,
    record.round,
    record.points,
    record.goals,
    record.passes
  ]);
}

async function getPlayedClubsOfCurrentRound() {
  const selectPlayedClubs = 'SELECT * FROM epl.played_clubs_of_current_round';
  const playedClubs = (await pool.query(selectPlayedClubs)).rows;
  return playedClubs;
}

module.exports = {
  saveTeam,
  getClubNameToIdMap,
  getClubs,
  saveClubScheduleRecord,
  saveMatch,
  getMatchesForRound,
  getMatchDetails,
  getLineup,
  getTeamResult,
  getStandingsData,
  getRoundStats,
  getSeasonStats,
  savePlayerStats,
  getPlayedClubsOfCurrentRound
};
