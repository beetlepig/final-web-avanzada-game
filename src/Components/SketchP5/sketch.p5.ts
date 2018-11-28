import p5, {Vector} from "p5";
import {store} from "../../store/P5Store";

interface customP5Functions extends p5 {
    receiveProps: (nextProps: SketchProps) => void;
    unmount: () => void;
}

interface SketchProps {
    points: number;
    playerPosition: Vector;
    enemyPosition: Vector;
}

export const sketch = (width: number, height: number, props: SketchProps) => {
    return function (p: customP5Functions) {
        let puntos: number = props.points;
        let playerPosition: Vector = props.playerPosition;
        let enemyPosition: Vector = props.enemyPosition;
        let playerSpaceShip: CharacterSpaceship;
        let enemySpaceShip: EnemyShip;
        p.setup = () => {
            p.frameRate(60);
            p.ellipseMode(p.CENTER);
            p.textAlign(p.CENTER);
            // p.noSmooth();
            playerSpaceShip = new CharacterSpaceship(p, width, height, playerPosition);
            enemySpaceShip = new EnemyShip(p, width, height, enemyPosition);
        };

        p.draw = () => {
            p.background(33,33,33, Math.floor(p.map(p.sin(p.radians(p.frameCount)), -1, 1, 40,  70)));
            playerSpaceShip.moveSpaceship();
            playerSpaceShip.update();
            playerSpaceShip.display();

            enemySpaceShip.update();
            enemySpaceShip.display();
        };

        p.receiveProps = (nextProps: SketchProps) => {
            puntos = nextProps.points;
            playerPosition = nextProps.playerPosition;
            enemyPosition = nextProps.enemyPosition;
        };

        p.mousePressed = () => {
            playerSpaceShip.shot();

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

    shots: Bullet[];

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

        this.shots = [];
    }

    update() {
        this.vel.add(this.acceleration);
        this.pos.add(this.vel);
        this.acceleration.mult(0);

        this.shots.forEach( (bullet: Bullet) => {
            bullet.update();
            bullet.display();

            if (bullet.pos.y < - 100) {
                this.shots.splice( this.shots.indexOf(bullet), 1 );
            }
        });
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

    shot() {
        this.shots.push(new Bullet(this.pos.copy(), this.p5Instance))
    }

    unmount() {
        window.removeEventListener('devicemotion', this.motionEventHandler, true);
    }
}

class Bullet {
    readonly pos: Vector;
    private readonly vel: Vector;
    private readonly acceleration: Vector;
    private readonly mass: number;
    private readonly pInstance: p5;

    constructor(_pos: Vector, _pInstance: p5) {
        this.pInstance = _pInstance;
        this.pos = _pos;
        this.vel = this.pInstance.createVector(0, 0);
        this.acceleration = this.pInstance.createVector(0 , 0);
        this.mass = 1;

        this.applyForce(this.pInstance.createVector(0, -3));
    }

    update() {
        this.vel.add(this.acceleration);
        this.pos.add(this.vel);
        this.acceleration.mult(0);
    }

    display() {
        this.pInstance.fill(200);
        this.pInstance.noStroke();
        this.pInstance.ellipse(this.pos.x, this.pos.y, 10, 10);
    }


    applyForce(force: Vector) {
        const f: Vector = Vector.div(force , this.mass);
        this.acceleration.add(f);
    }
}

class EnemyShip {
    private readonly pos: Vector;
    private readonly vel: Vector;
    private readonly acceleration: Vector;
    private p5Instance: p5;
    private friction: number;
    private readonly sketchWidth: number;
    private readonly sketchHeight: number;
    mass: number;
    diameter: number;

    explotionWaves: ExplosionWave[];

    constructor(_p5Instance: p5, _sketchWidth: number, _sketchHeight: number, lastEnemyPosition: Vector) {
        this.p5Instance = _p5Instance;
        this.sketchWidth = _sketchWidth;
        this.sketchHeight = _sketchHeight;
        this.vel = this.p5Instance.createVector(0, 0);
        this.acceleration = this.p5Instance.createVector(0 , 0);
        this.mass = 10;
        this.friction = 0.25;
        lastEnemyPosition? this.pos = lastEnemyPosition : this.pos = this.p5Instance.createVector(this.sketchWidth * 0.5, this.sketchHeight * 0.2);
        this.diameter = this.mass * (this.sketchWidth * 0.01);

        this.explotionWaves = [];

        // this.explotionWaves.push(new ExplosionWave(this.pos.copy(), this.diameter, this.p5Instance));
        this.releaseExplosion().then(() => {
          //  console.log("World!");
        })

    }

    update() {
        this.explotionWaves.forEach((explosion: ExplosionWave) => {
            explosion.display();
            if (explosion.diameter > 10000) {
                this.explotionWaves.splice(this.explotionWaves.indexOf(explosion), 1);
            }
        })
    }

    display() {
        this.p5Instance.stroke(244,67,54);
        this.p5Instance.strokeWeight(this.diameter * 0.04);
        this.p5Instance.fill(230, 100, 100, 200);
        this.p5Instance.ellipse(this.pos.x, this.pos.y, this.diameter, this.diameter);

    }

    async releaseExplosion(): Promise<void> {
        console.log("Hello");

        for (let i = 0; i < 5; i++) {
            // await is converting Promise<number> into number
            const count:number = await this.delayBetweenExplosions(2000, i);
            this.explotionWaves.push(new ExplosionWave(this.pos.copy(), this.diameter, this.p5Instance.random(0.5, 4.5), this.p5Instance));
            console.log(count);
        }
    }

    delayBetweenExplosions(milliseconds: number, count: number): Promise<number> {
        return new Promise<number>(resolve => {
            setTimeout(() => {
                resolve(count);
            }, milliseconds);
        });
    }

}

class ExplosionWave {
    pInstance: p5;
    pos: Vector;
    diameter: number;
    strokeMultiplier: number;

    constructor(_pos: Vector, _initialDiameter: number, _strokeMultiplier: number, _pInstance: p5) {
        this.pInstance = _pInstance;
        this.pos = _pos;
        this.diameter = _initialDiameter;
        this.strokeMultiplier = _strokeMultiplier;
    }

    display() {
        this.pInstance.stroke(244,67,54, 100);
        this.pInstance.strokeWeight((this.diameter * 0.05) * this.strokeMultiplier);
        this.pInstance.fill(244,67,54, 0);
        this.pInstance.ellipse(this.pos.x, this.pos.y, this.diameter, this.diameter);
        this.update();
    }

    update() {
        this.diameter += (this.diameter * 0.1) / this.strokeMultiplier;
    }
}

