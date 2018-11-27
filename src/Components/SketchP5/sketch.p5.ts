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
            p.ellipseMode(p.CENTER);
            p.textAlign(p.CENTER);
            playerSpaceShip = new CharacterSpaceship(p, width, height, playerPosition);
        };

        p.draw = () => {
            p.background(33,33,33, Math.floor(p.map(p.sin(p.radians(p.frameCount)), -1, 1, 50,  60)));
            playerSpaceShip.moveSpaceship();
            playerSpaceShip.update();
            playerSpaceShip.display();
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
            playerSpaceShip.unmount();
        }
    }
};

class CharacterSpaceship {
    private readonly pos: Vector;
    private readonly vel: Vector;
    private readonly acceleration: Vector;
    private deviceAcceleration: DeviceAcceleration | undefined;
    private p5Instance: p5;
    private friction: number;
    private readonly sketchWidth: number;
    private readonly sketchHeight: number;
    mass: number;
    diameter: number;

    constructor(_p5Instance: p5, _sketchWidth: number, _sketchHeight: number, lastPlayerPosition: Vector) {
        this.p5Instance = _p5Instance;
        this.sketchWidth = _sketchWidth;
        this.sketchHeight = _sketchHeight;
        this.vel = this.p5Instance.createVector(0, 0);
        this.acceleration = this.p5Instance.createVector(0 , 0);
        this.mass = 6;
        this.friction = 0.25;
        lastPlayerPosition? this.pos = lastPlayerPosition : this.pos = this.p5Instance.createVector(this.sketchWidth * 0.5, this.sketchHeight * 0.85);
        this.diameter = this.mass * (this.sketchWidth * 0.01);

        window.addEventListener('devicemotion', this.motionEventHandler, true);
    }

    update() {
        this.vel.add(this.acceleration);
        this.pos.add(this.vel);
        this.acceleration.mult(0);
    }

    display() {
        this.p5Instance.noStroke();
        this.p5Instance.fill(230);
        this.p5Instance.ellipse(this.pos.x, this.pos.y, this.diameter, this.diameter);
    }

    moveSpaceship() {
        const frictionVector: Vector = this.vel.copy();
        frictionVector.mult(-1);
        frictionVector.normalize();
        frictionVector.mult(this.friction);

        this.applyForce(frictionVector);

        // Apply accelerometer x force
        if (this.deviceAcceleration && this.deviceAcceleration.y) {
            const acceleration: number = this.p5Instance.map(this.deviceAcceleration.y, -9, 9, 2, -2);
            if (acceleration > 0 && this.pos.x < this.sketchWidth * 0.9) {
                this.applyForce(this.p5Instance.createVector(acceleration, 0, 0));
            } else if (acceleration < 0 && this.pos.x > this.sketchWidth * 0.1) {
                this.applyForce(this.p5Instance.createVector(acceleration, 0, 0));
            }
        }


        if(this.p5Instance.keyIsPressed) {
            if (this.p5Instance.key === 'a' && this.pos.x > this.sketchWidth * 0.1) {
                this.applyForce(this.p5Instance.createVector(-3, 0, 0));
            } else if (this.p5Instance.key === 'd' && this.pos.x < this.sketchWidth * 0.9) {
                this.applyForce(this.p5Instance.createVector(+3, 0, 0));
            }
        }
        this.checkEdges();
       // this.pos.set(this.pos.x, this.sketchHeight * 0.8);
        this.vel.limit(10);
    }
    checkEdges() {
        if (this.pos.x > this.sketchWidth * 0.9) {
            if (this.vel.x > 0) {
                this.friction = 2;
            } else {
                this.friction = 0.5;
                this.applyForce(this.p5Instance.createVector(-5));
            }
        } else if (this.pos.x < this.sketchWidth * 0.1) {
            if (this.vel.x < 0) {
                this.friction = 2;
            } else {
                this.friction = 0.5;
                this.applyForce(this.p5Instance.createVector(+5));
            }
        } else {
            this.friction = 0.5;
        }
    }

    applyForce(force: Vector) {
        const f: Vector = Vector.div(force , this.mass);
        this.acceleration.add(f);
    }

    motionEventHandler = (event: DeviceMotionEvent) => {

        const { accelerationIncludingGravity } = event;

        if(accelerationIncludingGravity) {
            this.deviceAcceleration = accelerationIncludingGravity;

        }
    };

    unmount() {
        window.removeEventListener('devicemotion', this.motionEventHandler, true);
    }
}