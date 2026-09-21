"use strict";
require("dotenv").config();
const express = require("express");
const path = require("path");
const { requestLogger, responseLogger } = require("./middleware/logger");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const gameRoutes = require("./routes/game.routes");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.use(express.static(path.join(__dirname, "../public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(responseLogger);

app.get("/", (req, res) => res.render("index"));
app.use("/api/game", gameRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;