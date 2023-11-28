const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

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

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

//API-1

app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT
      movie.movie_name
    FROM
      movie
    ORDER BY
      movie_id;`;
  const moviesArray = await db.all(getMoviesQuery);
  const result = moviesArray.map((eachObject) => {
    return {
      movieName: eachObject.movie_name,
    };
  });
  response.send(result);
});

//API-2

app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const addMovieQuery = `
    INSERT INTO
      movie (director_id,movie_name,lead_actor)
    VALUES
      (
         ${directorId},
         '${movieName}',
         '${leadActor}'
      );`;

  await db.run(addMovieQuery);
  response.send("Movie Successfully Added");
});

//API-3

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
    SELECT
      *
    FROM
      movie
    WHERE
      movie_id = ${movieId};`;
  const result = await db.get(getMovieQuery);

  //response.send(result);
  response.send({
    movieId: result.movie_id,
    directorId: result.director_id,
    movieName: result.movie_name,
    leadActor: result.lead_actor,
  });
  //response.send(convertDbObjectToResponseObject(movie));
});

//API-4

app.put("/movies/:movieId/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const { movieId } = request.params;
  const updateMovieQuery = `
  UPDATE
    movie
  SET
    director_id = ${directorId},
    movie_name = '${movieName}',
    lead_actor = '${leadActor}'
  WHERE
    movie_id = ${movieId};`;

  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//API-5

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
        DELETE FROM
            movie
        WHERE
            movie_id = ${movieId};`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//API-6

app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
    SELECT
      *
    FROM
      director
    ORDER BY
      director_id;`;
  const directorsArray = await db.all(getDirectorsQuery);
  response.send(
    directorsArray.map((eachObject) => {
      return {
        directorId: eachObject.director_id,
        directorName: eachObject.director_name,
      };
    })
  );
});

//API-7

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectedMoviesQuery = `
    SELECT 
    movie.movie_name
    FROM 
    movie
    WHERE 
    director_id = ${directorId};
    `;
  const arrayOfDirectedMovies = await db.all(getDirectedMoviesQuery);

  response.send(
    arrayOfDirectedMovies.map((eachObject) => {
      return {
        movieName: eachObject.movie_name,
      };
    })
  );
});

module.exports = app;
