const axios = require('axios');
const database = require('./database');

async function loadRoundData(teamId, roundId) {
  const url = await getLineupUrl(teamId, roundId);
  const response = await axios(url);
  return response.data;
}

async function teamUrlSegmentById(teamId) {
  const link = await database.getTeamLink(teamId);
  return link;
}

async function getLineupUrl(teamId, roundId) {
  const zeroRoundUrlSegment = 11318;
  const teamUrlSegment = await teamUrlSegmentById(teamId);
  let roundUrlSegment = zeroRoundUrlSegment + parseInt(roundId, 10);
  const url = `https://www.sports.ru/fantasy/football/team/points/${teamUrlSegment}/${roundUrlSegment}.json`;
  return url;
}

module.exports = {
  loadRoundData
};
