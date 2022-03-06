require("dotenv").config();

const express = require("express");
const app = express();
const path = require("path");

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

const projectName = process.env.project;

app.get("/", async (req, res) => {
  res.render(path.join(__dirname, "public", "views", "index.ejs"), {
    projectName,
  });
});

app.get("/game", async (req, res) => {
  res.render(path.join(__dirname, "public", "views", "game.ejs"), {
    projectName,
  });
});

app.get("/guide", async (req, res) => {
  res.render(path.join(__dirname, "public", "views", "guide.ejs"), {
    projectName,
  });
});

app.listen(process.env.port, () => console.log("App is now ready!!"));
