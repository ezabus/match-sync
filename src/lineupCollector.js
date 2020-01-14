const PlayerResult = require('./PlayerResult');
const Lineup = require('./Lineup');
const sportsRuLineupLoader = require('./sportsRuLineupLoader');

async function getLineup(teamId, roundId) {
  const playerResults = await getPlayersResults(teamId, roundId);
  const lineup = new Lineup(playerResults);
  return lineup;
}

async function getPlayersResults(teamId, roundId) {
  const roundData = await sportsRuLineupLoader.loadRoundData(teamId, roundId);
  const playersResultsData = roundData.players;
  const playerResults = playersResultsData.map((data) => {
    const playerResult = new PlayerResult({
      teamId,
      round: roundId
    });
    playerResult.fromSportsRu(data);
    return playerResult;
  });
  return playerResults;
}

module.exports = getLineup;
