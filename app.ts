import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as GUI from "@babylonjs/gui";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  SubMesh,
  MultiMaterial,
  Color4,
  SetValueAction,
  ActionManager,
  ExecuteCodeAction,
  Mesh,
  Sound,
} from "@babylonjs/core";

type GameData = {
  score: number;
  level: number;
};

class Database {
  db: Storage;
  constructor() {
    this.db = localStorage;
  }

  get(): GameData | boolean {
    let score = this.db.getItem("score");
    let level = this.db.getItem("level");
    let obj = {
      score: parseInt(score),
      level: parseInt(level),
    };

    return score && level ? obj : false;
  }

  update(score: string, level: string, hs?: string) {
    this.db.setItem("score", score);
    this.db.setItem("level", level);

    if (hs) this.db.setItem("highscore", hs);
  }
}

class App {
  level: number;
  score: number;
  db: Database;
  defeated: number;
  health: number;
  constructor() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;

    const engine = new Engine(canvas, true);

    //Scene
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0.6, 0);

    const camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 4,
      100,
      new Vector3(-50, 10, 10)
    );

    this.db = new Database();
    const data = this.db.get() as GameData;
    if (data && data.score > 0) this.ground(scene, data);
    else {
      //Data
      this.level = 1;
      this.score = 0;
      this.defeated = 0;
      this.health = 3;

      //GUI
      let mainScreen = GUI.AdvancedDynamicTexture.CreateFullscreenUI(
        "GUI",
        true
      );

      let text = new GUI.TextBlock("title", "CLICKING SIMULATOR");
      text.verticalAlignment = 0;
      text.paddingTop = "50px";
      text.resizeToFit = true;
      text.fontWeight = "700";
      text.color = "#075b27";
      text.fontSize = "50px";

      const buttons = [
        {
          name: "Start",
          text: "starting",
          func: () => {
            mainScreen.dispose();
            this.ground(scene);
            this.db.update(this.score.toString(), this.level.toString());
          },
        },
        {
          name: "How To Play?",
          text: "how",
          func: () => {
            mainScreen.dispose();
            this.how();
          },
        },
      ];

      const arranged: GUI.Button[] = buttons.map((b, i) => {
        let button: GUI.Button = new GUI.Button(b.name);
        button.width = "150px";
        button.height = "60px";
        button.cornerRadius = 10;

        let buttonText = new GUI.InputText(b.text, b.name.toUpperCase());
        buttonText.width = button.width;
        buttonText.height = button.height;
        buttonText.background = "orange";
        buttonText.color = "black";

        button.top = i * 70;

        button.onPointerClickObservable.add(b.func);

        button.addControl(buttonText);

        return button;
      });

      const items = [text, ...arranged];
      items.forEach((c) => mainScreen.addControl(c));
    }

    //Rendering
    camera.attachControl(canvas, true);
    const light = new HemisphericLight(
      "HemiLight",
      new Vector3(1, 0.4, 1),
      scene
    );

    engine.runRenderLoop(function () {
      scene.render();
    });

    window.addEventListener("resize", function () {
      engine.resize();
    });
  }

  ground(scene: Scene, data?: GameData) {
    if (data) {
      this.level = data.level;
      this.score = data.score;
      this.defeated = 0;
      this.health = 3;
    }

    //GROUND
    const lightGreen = this.createColor("light-green");
    const green = this.createColor("green");

    // Create Multi Material
    const multimat = new MultiMaterial("multi", scene);
    multimat.subMaterials.push(lightGreen);
    multimat.subMaterials.push(green);

    let gameScreen = GUI.AdvancedDynamicTexture.CreateFullscreenUI(
      "GAME",
      true
    );

    let score = new GUI.TextBlock(
      "score",
      `Score: ${this.score} | Level: ${this.level}`
    );

    score.verticalAlignment = 0;
    score.paddingTop = "10px";
    score.paddingRight = "50px";
    score.resizeToFit = true;
    score.fontWeight = "700";
    score.fontSize = "20px";
    score.horizontalAlignment = 1;

    const makeHp = () => `HP: ${"❤️".repeat(this.health)}`;
    let health = new GUI.TextBlock("hp", makeHp());
    health.verticalAlignment = 0;
    health.horizontalAlignment = 0;
    health.resizeToFit = true;
    health.fontSize = "20px";
    health.paddingTop = "10px";
    health.paddingLeft = "50px";

    gameScreen.addControl(score);
    gameScreen.addControl(health);

    let amount = 10;
    const boxes: Mesh[] = [];
    for (let r = 0; r < amount; r++) {
      for (let c = 0; c < amount; c++) {
        const box = MeshBuilder.CreateBox("green-box", {
          width: 10,
          height: 4,
          size: 10,
        });

        boxes.push(box);

        let o = r % 2 === 0 ? 1 : 0;
        let z = o === 1 ? 0 : 1;

        box.position.x = c * -10;
        box.position.z = r * 10;
        box.outlineColor = new Color3(0, 0, 0);
        box.outlineWidth = 0.05;
        box.renderOutline = true;

        box.actionManager = new ActionManager(scene);
        box.material = multimat.getSubMaterial(c % 2 === 0 ? o : z);

        //actions
        box.actionManager.registerAction(
          new SetValueAction(
            ActionManager.OnPointerOverTrigger,
            box,
            "scaling",
            new Vector3(1.1, 1.1, 1.1)
          )
        );

        box.actionManager.registerAction(
          new SetValueAction(
            ActionManager.OnPointerOutTrigger,
            box,
            "scaling",
            new Vector3(1, 1, 1)
          )
        );
      }
    }

    //place random red blocks
    let redIndexes: number[] = [];
    let redAmount = this.level * 4;

    console.log(redAmount, "AMOUNT OF REDS");

    for (let i = 0; i < redAmount; i++) {
      const randomIndex = (): number => {
        let index = Math.floor(Math.random() * boxes.length);
        if (redIndexes.includes(index)) return randomIndex();
        return index;
      };

      let index = randomIndex();

      let randomBox = boxes[index];
      redIndexes.push(index);

      randomBox.material = this.createColor("red");
      randomBox.name = "red";
    }

    //register events on all blocks
    boxes.forEach((box, i) => {
      box.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnLeftPickTrigger, (e) => {
          if (e.source.name === "red") {
            e.source.name = "dead-red";
            e.source.material = this.createColor("green");
            this.defeated += 1;

            if (this.defeated === redAmount) {
              this.level += 1;
              this.score += 100;
              this.defeated = 0;
              this.db.update(this.score.toString(), this.level.toString());

              setTimeout(() => {
                gameScreen.dispose();
                boxes.forEach((b) => b.dispose());
                this.ground(scene);
              }, 1500);
            }
          } else {
            this.health--;

            if (this.health === 0) {
              const highScore = localStorage.getItem("highscore") || 0;
              let newHS = "";

              if (highScore < this.score) {
                localStorage.setItem("highscore", this.score.toString());
                newHS = `New High Score: ${this.score}`;
              }

              alert(
                `You Lose!!\nScore: ${this.score} | High Score: ${highScore} | ${newHS}`
              );

              this.db.update("0", "1");
              return new App();
            }

            let healthBox = gameScreen.getControlByName("hp");
            gameScreen.removeControl(healthBox);

            health.text = makeHp();
            gameScreen.addControl(health);
          }
        })
      );
    });
  }

  createColor(c: string) {
    let r = 0;
    let g = 0;
    let b = 0;

    if (c === "green") g = 0.65;
    else if (c === "light-green") g = 0.75;
    else if (c === "red") r = 0.8;

    const color = new StandardMaterial("randomMaterial");
    color.alpha = 1;
    color.diffuseColor = new Color3(r, g, b);
    return color;
  }

  how() {
    const mainScreen = GUI.AdvancedDynamicTexture.CreateFullscreenUI(
      "GUI",
      true
    );

    const title = new GUI.TextBlock("how-to", "How to play");
    title.resizeToFit = true;
    title.verticalAlignment = 0;
    title.horizontalAlignment = 2;
    title.fontSize = "30px";
    title.fontWeight = "700";
    title.paddingTop = "50px";
    title.color = "green";

    const info = new GUI.TextBlock(
      "info",
      "The game is an endless clicking game, where you have to click all the red blocks, and keep going!\nAs you keep clicking, you will be moving onto new levels which get harder, and will receive points!\nBut theres a catch, if you click a green box, you will lose a heart!! You have a total of 3 hearts."
    );

    info.resizeToFit = true;
    info.verticalAlignment = 2;
    info.horizontalAlignment = 2;
    info.fontSize = "25px";

    mainScreen.addControl(title);
    mainScreen.addControl(info);
  }
}

new App();
