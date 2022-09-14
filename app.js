const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());

module.exports = app;
const dbpath = path.join(__dirname, "covid19India.db");

let db = null;

const connectToDbServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};
connectToDbServer();

app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT * 
    FROM state
    ORDER BY state_id;`;
  const statesArray = await db.all(getStatesQuery);
  const convertToResponseFormat = statesArray.map((eachState) => {
    return {
      stateId: eachState.state_id,
      stateName: eachState.state_name,
      population: eachState.population,
    };
  });
  response.send(convertToResponseFormat);
});

app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStatesQuery = `SELECT * 
    FROM state
    WHERE state_id = ${stateId};`;
  const stateArray = await db.get(getStatesQuery);
  const convertToResponseFormat = (stateArray) => {
    return {
      stateId: stateArray.state_id,
      stateName: stateArray.state_name,
      population: stateArray.population,
    };
  };
  response.send(convertToResponseFormat(stateArray));
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addQuery = `INSERT INTO 
  district (district_name, state_id, cured, active, deaths)
  VALUES (
      ${districtName},
      ${stateId},
      ${cases},
      ${cured},
      ${active},
      ${deaths}
  );`;
  const dbResponse = await db.run(addQuery);
  const district_id = dbResponse.lastID;
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * 
    FROM district
    WHERE district_id = ${districtId};`;
  const districtArray = await db.get(getDistrictQuery);
  const convertToResponseFormat = (districtArray) => {
    return {
      districtId: districtArray.district_id,
      districtName: districtArray.district_name,
      stateId: districtArray.state_id,
      cases: districtArray.cases,
      cures: districtArray.cures,
      active: districtArray.active,
      deaths: districtArray.deaths,
    };
  };
  response.send(convertToResponseFormat(districtArray));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `DELETE FROM 
      district 
      WHERE district_id = ${districtId};`;
  await db.run(deleteQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateQuery = `UPDATE 
    district
    SET 
    district_name = ${districtName},
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE district_id = ${districtId};`;
  await db.run(updateQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const statsQuery = `SELECT 
    SUM(cases) AS totalCases,
    SUM(cured) AS totalCured,
    SUM(active) AS totalActive,
    SUM(deaths) AS totalDeaths
    FROM district
    WHERE state_id = ${stateId}
    GROUP BY state_id;`;
  const statsArray = await db.get(statsQuery);
  response.send(statsArray);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateNameQuery = `SELECT state_name
    FROM state NATURAL JOIN district
    WHERE district.district_id = ${districtId};`;
  const stateName = await db.get(stateNameQuery);
  const convertToFormat = (stateName) => {
    return {
      stateName: stateName.state_name,
    };
  };
  response.send(convertToFormat(stateName));
});
