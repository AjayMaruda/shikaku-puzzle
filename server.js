require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./src/config/database");
const app = require("./src/app");
const registerSocketHandlers = require("./src/socket/gameSocket");

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.set("io", io);
registerSocketHandlers(io);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log("Server running on http://localhost:" + PORT);
  });
});