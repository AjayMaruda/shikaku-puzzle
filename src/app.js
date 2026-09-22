require("dotenv").config();
const express = require("express");
const path = require("path");
const { requestLogger } = require("./middleware/logger");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const gameRoutes = require("./routes/game.routes");

const app = express();

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.use("/api/game", gameRoutes);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;