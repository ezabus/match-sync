const PlayersPositionsEnum = require('./PlayersPositionsEnum');

const STANDARD_FIELD_PLAYERS_COUNT = 10;

class Lineup {
  constructor(playerResults) {
    this.playerResults = [];
    this.lineup = [];
    if (Array.isArray(playerResults)) {
      this.playerResults = playerResults;
      this._fillLineupByResults();
      this._setGoalKeeper();
      this._substituteNotPlayedPlayers();
      this._countedPlayersResults = this.playerResults.filter((playerResult) => playerResult.isCounted());
      this._pointsCount = this._countedPlayersResults.reduce((sum, playerResult) => {
        sum += playerResult.getPoints();
        return sum;
      }, 0);
    }
  }

  async save() {
    this.playerResults.forEach(async (playerResult) => {
      await playerResult.save();
    });
  }

  getPlayersResults() {
    return this.playerResults;
  }

  getCountedPlayersResults() {
    return this._countedPlayersResults;
  }

  getPointsCount() {
    return this._pointsCount;
  }

  _fillLineupByResults() {
    const countedStarters = this.playerResults
      .filter((playerResult) => playerResult.getPosition() !== PlayersPositionsEnum.GK)
      .filter((playerResult) => playerResult.isCounted());
    this.lineup = countedStarters;
  }

  _setGoalKeeper() {
    const keepers = this.playerResults.filter((playerResult) => playerResult.getPosition() === PlayersPositionsEnum.GK);
    const starter = keepers.filter((playerResult) => playerResult.isStarter())[0];
    const bencher = keepers.filter((playerResult) => !playerResult.isStarter())[0];
    if (starter.hasPlayed()) {
      starter.callUp();
    } else if (bencher.hasPlayed()) {
      bencher.callUp();
    }
  }

  _calculateFormation() {
    const formation = this._getCountedPlayers()
      .filter((playerResult) => playerResult.hasPlayed())
      .reduce((formationAcc, playerResult) => {
        if (playerResult.getPosition() === PlayersPositionsEnum.FW) {
          formationAcc.FW++;
        }
        if (playerResult.getPosition() === PlayersPositionsEnum.MID) {
          formationAcc.MID++;
        }
        if (playerResult.getPosition() === PlayersPositionsEnum.DEF) {
          formationAcc.DEF++;
        }
        return formationAcc;
      }, {
        FW: 0,
        MID: 0,
        DEF: 0
      });
    return formation;
  }

  _isValidFormation() {
    const formation = this._calculateFormation();
    return (formation.DEF >= 3) && (formation.MID >= 2) && (formation.FW >= 1);
  }

  _substituteNotPlayedPlayers() {
    if (this.lineup.length === STANDARD_FIELD_PLAYERS_COUNT) {
      return;
    }
    this._performPositionalSubstitutions();
    if (this._isValidFormation()) {
      this._performOrderedSubstitutions();
    }
  }

  _performPositionalSubstitutions() {
    const vacantLineupSlotsCounts = this._getVacantLineupSlotsCount();
    const missingPositions = this._getMissingPositions();
    this._getBenchedFieldsmans()
      .filter((playerResult) => missingPositions[playerResult.getPosition()])
      .filter((playerResult) => playerResult.hasPlayed())
      .slice(0, vacantLineupSlotsCounts)
      .forEach((playerResult) => playerResult.callUp());
  }

  _performOrderedSubstitutions() {
    const vacantLineupSlotsCounts = this._getVacantLineupSlotsCount();
    this._getBenchedFieldsmans()
      .filter((playerResult) => playerResult.hasPlayed())
      .slice(0, vacantLineupSlotsCounts)
      .forEach((playerResult) => playerResult.callUp());
  }

  _getVacantLineupSlotsCount() {
    let vacantLineupSlotsCounts = STANDARD_FIELD_PLAYERS_COUNT - this._getCountedPlayers().length;
    if (vacantLineupSlotsCounts > 3) {
      vacantLineupSlotsCounts = 3;
    }
    return vacantLineupSlotsCounts;
  }

  _getMissingPositions() {
    const formation = this._calculateFormation();
    const missingPositions = {};
    if (formation.FW < 1) {
      missingPositions[PlayersPositionsEnum.FW] = true;
    }
    if (formation.MID < 2) {
      missingPositions[PlayersPositionsEnum.MID] = true;
    }
    if (formation.DEF < 3) {
      missingPositions[PlayersPositionsEnum.DEF] = true;
    }
    return missingPositions;
  }


  _getNotPlayedFieldsmans() {
    return this.lineup
      .filter((result) => result.hasPlayed())
      .filter((result) => result.getPosition() !== PlayersPositionsEnum.GK);
  }

  _getBenchedFieldsmans() {
    return this.playerResults
      .filter((result) => !result.isCounted() && !result.isStarter())
      .filter((result) => result.getPosition() !== PlayersPositionsEnum.GK)
      .sort((resultA, resultB) => {
        if (resultA.getBenchOrder() < resultB.getBenchOrder()) {
          return -1;
        }
        if (resultA.getBenchOrder() > resultB.getBenchOrder()) {
          return 1;
        }
        return 0;
      });
  }

  _getCountedPlayers() {
    return this.playerResults
      .filter((result) => result.isCounted())
      .filter((result) => result.getPosition() !== PlayersPositionsEnum.GK);
  }
}

module.exports = Lineup;