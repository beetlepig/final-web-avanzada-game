import p5, {Vector} from "p5";
import {store} from "../../store/P5Store";

interface customP5Functions extends p5 {
    receiveProps: (nextProps: SketchProps) => void;
    unmount: () => void;
}

interface SketchProps {
    points: number;
    playerPosition: Vector;
}

export const sketch = (width: number, height: number, props: SketchProps) => {
    return function (p: customP5Functions) {
        let puntos: number = props.points;
        let playerPosition: Vector = props.playerPosition;
        let playerSpaceShip: CharacterSpaceship;
        p.setup = () => {
            p.frameRate(60);
            playerSpaceShip = new CharacterSpaceship(p, width, height);
        };

        p.draw = () => {
            p.background(200, p.frameCount % 60);
            playerSpaceShip.update();
        };

        p.receiveProps = (nextProps: SketchProps) => {
            puntos = nextProps.points;
            playerPosition = nextProps.playerPosition;
        };

        p.mousePressed = () => {

            return false;
        };

        p.keyPressed = () => {

            return false;
        };

        p.unmount = () => {
            console.log('The sketch was unmounted. Width was ' + width + ', height was ' + height);
        }
    }
};

class CharacterSpaceship {
    private pos: Vector;
    private vel: Vector;
    private aceleration: Vector;
    private p5Instance: p5;
    private readonly sketchWidth: number;
    private readonly sketchHeight: number;
    mass: number;

    constructor(_p5Instance: p5, _sketchWidth: number, _sketchHeight: number, lastPlayerPosition?: Vector) {
        this.p5Instance = _p5Instance;
        this.sketchWidth = _sketchWidth;
        this.sketchHeight = _sketchHeight;
        this.vel = this.p5Instance.createVector(0, 0);
        this.aceleration = this.p5Instance.createVector(0 , 0);
        this.mass = 1;
        lastPlayerPosition? this.pos = lastPlayerPosition : this.pos = this.p5Instance.createVector(this.sketchWidth * 0.5, this.sketchHeight * 0.8);
    }

    update() {
        this.moveSpaceship();
        this.p5Instance.noStroke();
        this.p5Instance.ellipse(this.pos.x, this.pos.y, 40, 40);
    }

    moveSpaceship() {
        this.pos.add(this.vel);
        if(this.p5Instance.keyIsPressed) {
            if (this.p5Instance.key === 'a') {
                console.log('teclaIzquierda');
                this.vel.x = -1
            } else if (this.p5Instance.key === 'd') {
                console.log('teclaDerecha');
                this.vel.x = 1;
            }
        } else {
            this.vel.set(0);
        }
       // this.pos.set(this.pos.x, this.sketchHeight * 0.8);
    }

    unmount() {

    }
}