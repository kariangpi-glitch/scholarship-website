const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  res.send("Backend is working");
});

app.listen(5000, "127.0.0.1", () => {
    console.log("Server started on port 5000");
  });