const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT 
    player_details.player_id AS playerId,
    player_details.player_name AS playerName 
    FROM
    player_details;
    `;
  const result = await db.all(getPlayersQuery);
  response.send(result);
});

//API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getplayerQuery = `
    SELECT
     player_details.player_id AS playerId,
    player_details.player_name AS playerName
    FROM
      player_details
    WHERE
      player_id = ${playerId};`;
  const player = await db.get(getplayerQuery);
  response.send(player);
});

//API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
  UPDATE 
  player_details
  SET 
    player_name= '${playerName}'
  WHERE 
  player_id = ${playerId};
  `;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT
    match_details.match_id AS matchId,
    match,
    year
    FROM
      match_details
    WHERE
      match_id = ${matchId};`;
  const match = await db.get(getMatchQuery);
  response.send(match);
});

//API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchQuery = `
    SELECT 
    match_details.match_id AS matchId,
    match_details.match AS match,
    match_details.year AS year
    FROM (match_details
    INNER JOIN player_match_score
    ON player_match_score.match_id = match_details.match_id) AS T
    INNER JOIN player_details
    ON T.player_id = player_details.player_id
    WHERE
      player_details.player_id = ${playerId};
    `;
  const arrayOfMatches = await db.all(getMatchQuery);
  response.send(arrayOfMatches);
});

//API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersQuery = `
    SELECT 
    T.player_id AS playerId,
    player_details.player_name AS playerName
    FROM (player_match_score
    INNER JOIN match_details 
    ON player_match_score.match_id = match_details.match_id) AS T
    INNER JOIN player_details
    ON T.player_id = player_details.player_id
    WHERE
      T.match_id = ${matchId};`;
  const arrayOfPlayers = await db.all(getPlayersQuery);
  response.send(arrayOfPlayers);
});

//API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersQuery = `
    SELECT 
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(player_match_score.fours) AS totalFours,
        SUM(player_match_score.sixes) AS totalSixes
    FROM player_details
    INNER JOIN player_match_score
    ON player_details.player_id = player_match_score.player_id
    WHERE
      player_details.player_id = ${playerId}
    GROUP BY 
      player_details.player_id;`;
  const arrayOfPlayers = await db.get(getPlayersQuery);
  response.send(arrayOfPlayers);
});

module.exports = app;
