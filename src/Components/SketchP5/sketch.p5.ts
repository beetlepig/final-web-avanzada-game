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
        let enemySpaceShip: EnemyShip | null;
        p.setup = () => {
            // p.frameRate(60);
            p.ellipseMode(p.CENTER);
            p.textAlign(p.CENTER);
            // p.noSmooth();
            playerSpaceShip = new CharacterSpaceship(p, width, height, playerPosition);
            enemySpaceShip = new EnemyShip(p, width, height, enemyPosition);
        };

        p.draw = () => {
            p.background(33,33,33, Math.floor(p.map(p.sin(p.radians(p.frameCount)), -1, 1, 40,  70)));
            // p.clear();
            playerSpaceShip.moveSpaceship();
            playerSpaceShip.update();
            playerSpaceShip.display();

            if(enemySpaceShip) {
                enemySpaceShip.update();
                enemySpaceShip.display();
            }

            checkBulletsCollision();
            checkExplosionCollision();
        };
        
        function checkBulletsCollision() {
            playerSpaceShip.shots.forEach((bullet: Bullet) => {
                if (enemySpaceShip && Vector.dist(bullet.pos, enemySpaceShip.pos) < (enemySpaceShip.diameter * 0.95) / 2) {
                    playerSpaceShip.shots.splice(playerSpaceShip.shots.indexOf(bullet), 1);
                    enemySpaceShip.live--;
                    if (enemySpaceShip.live === 0) {
                        enemySpaceShip.destroyEnemy().then(() => {
                            console.log('mulio');
                            enemySpaceShip = null;
                        });
                    }
                }
            })
        }


        function checkExplosionCollision() {

            if (enemySpaceShip) {

                enemySpaceShip.explosionWaves.forEach((wave: ExplosionWave) => {


                    const diameterFixed = ((wave.diameter * 0.97) / 2);
                    const superiorDiameter = diameterFixed + (wave.strokeSize / 2);
                    const inferiorDiameter = diameterFixed - (wave.strokeSize / 2);

                    // SUPERIOR EXPLOSION CIRCUMFERENCE
                    const superiorVector = Vector.sub(playerSpaceShip.pos, wave.pos);
                    superiorVector.normalize();
                    superiorVector.mult(superiorDiameter);

                    const superiorTarget: Vector = wave.pos.copy();
                    superiorTarget.add(superiorVector);
                    // p.stroke(0, 200, 0);
                    // p.line(wave.pos.x, wave.pos.y, superiorTarget.x, superiorTarget.y);


                    // INFERIOR EXPLOSION CIRCUMFERENCE
                    const inferiorVector = Vector.sub(playerSpaceShip.pos, wave.pos);
                    inferiorVector.normalize();
                    inferiorVector.mult(inferiorDiameter);

                    const inferiorTarget: Vector = wave.pos.copy();
                    inferiorTarget.add(inferiorVector);
                    // p.stroke(0, 0, 200);
                    // p.line(wave.pos.x, wave.pos.y, inferiorTarget.x, inferiorTarget.y);

                    if ((Vector.dist(wave.pos, playerSpaceShip.pos) > Vector.dist(wave.pos, inferiorTarget)) && (Vector.dist(wave.pos, playerSpaceShip.pos) < Vector.dist(wave.pos, superiorTarget))) {
                        //  console.log('dañooooo: ' + wave.strokeSize);
                    }


                });

            }

        }

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
    readonly pos: Vector;
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
        this.friction = this.mass * 0.01;
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

        this.applyForce(this.pInstance.createVector(0, -10));
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
    readonly pos: Vector;
    private readonly vel: Vector;
    private readonly acceleration: Vector;
    private readonly p5Instance: p5;
    private friction: number;
    private readonly sketchWidth: number;
    private readonly sketchHeight: number;
    private fillOpacity: number;
    mass: number;
    diameter: number;

    live: number;

    explosionWaves: ExplosionWave[];
    private alive: boolean;
    private moving: boolean;
    private resolveMovePromise: (() => void) | undefined;
    private resolveDeath: (() => void) | undefined;
    private readonly objective: Vector;

    constructor(_p5Instance: p5, _sketchWidth: number, _sketchHeight: number, lastEnemyPosition: Vector) {
        this.p5Instance = _p5Instance;
        this.sketchWidth = _sketchWidth;
        this.sketchHeight = _sketchHeight;
        this.vel = this.p5Instance.createVector(0, 0);
        this.acceleration = this.p5Instance.createVector(0 , 0);
        this.mass = 10;
        this.friction = this.mass * 0.01;
        lastEnemyPosition? this.pos = lastEnemyPosition : this.pos = this.p5Instance.createVector(0, 0);
        this.diameter = this.mass * (this.sketchWidth * 0.01);
        this.live = 5;
        this.fillOpacity = 230;

        this.explosionWaves = [];
        this.alive = true;
        this.moving = true;

        this.objective = this.p5Instance.createVector(this.p5Instance.random(0, this.sketchWidth), this.p5Instance.random(0, this.sketchHeight));

        this.shotWave();

    }

    async shotWave(): Promise<void> {
        while (this.alive) {
            if (this.alive) {
                await this.move();
            }
            if (this.alive) {
                await this.releaseExplosion();
            }
        }
    }

    move(): Promise<void> {
        this.objective.set(this.p5Instance.random(this.sketchWidth * 0.1, this.sketchWidth * 0.8), this.p5Instance.random(this.sketchHeight * 0.1, this.sketchHeight * 0.6));
        this.moving = true;
        return new Promise<void>(resolve => {
            this.resolveMovePromise = resolve;
        });
    }

    applyForce(force: Vector) {
        const f: Vector = Vector.div(force , this.mass);
        this.acceleration.add(f);
    }

    update() {

        if (this.moving) {
            if (Vector.dist(this.objective, this.pos) < this.diameter * 0.6) {
                this.friction = 0.8 * this.vel.mag();
                if (this.vel.mag() < 0.8) {
                    this.vel.mult(0);
                    this.acceleration.mult(0);
                    this.friction = this.mass * 0.01;
                    this.moving = false;
                    if (this.resolveMovePromise) {
                        this.resolveMovePromise();
                    }
                }
            } else {
                const dir = Vector.sub(this.objective, this.pos);
                dir.normalize();
                dir.mult(2);
                this.applyForce(dir);
            }
        }

        if (!this.alive) {
            this.fillOpacity--;
            if (this.fillOpacity <= 0 && this.resolveDeath){
                this.resolveDeath();
            }
        }



        const frictionVector: Vector = this.vel.copy();
        frictionVector.mult(-1);
        frictionVector.normalize();
        frictionVector.mult(this.friction);
        this.applyForce(frictionVector);

        this.vel.add(this.acceleration);
        this.pos.add(this.vel);
        this.acceleration.mult(0);


        this.explosionWaves.forEach((explosion: ExplosionWave) => {
            explosion.display();
            if (explosion.diameter > 10000) {
                this.explosionWaves.splice(this.explosionWaves.indexOf(explosion), 1);
            }
        });

        this.vel.limit(20);
    }

    display() {
        this.p5Instance.stroke(244,67,54, this.fillOpacity);
        this.p5Instance.strokeWeight(this.diameter * 0.04);
        this.p5Instance.fill(230, 100, 100,this.fillOpacity * 0.7);
        this.p5Instance.ellipse(this.pos.x, this.pos.y, this.diameter, this.diameter);
    }

    async releaseExplosion(): Promise<void> {
            for (let i = 0; i < this.p5Instance.random(2, 6); i++) {
                if (this.alive) {
                    this.explosionWaves.push(new ExplosionWave(this.pos.copy(), this.diameter, this.p5Instance.random(0.5, 4.5), this.p5Instance));
                    if (i < 5) {
                        await this.delayBetweenExplosions(this.p5Instance.random(500, 2000));
                    } else {
                        await this.delayBetweenExplosions(20);
                    }
                }
            }
    }

    delayBetweenExplosions(milliseconds: number): Promise<void> {
        return new Promise<void>(resolve => {
            setTimeout(() => {
                resolve();
            }, milliseconds);
        });
    }

    destroyEnemy(): Promise<void> {
        this.alive = false;
        console.log('va a molil');
        return new Promise<void>(resolve => {
            this.resolveDeath = resolve;
        });
    }



}

class ExplosionWave {
    pInstance: p5;
    pos: Vector;
    diameter: number;
    strokeMultiplier: number;
    strokeSize: number;

    constructor(_pos: Vector, _initialDiameter: number, _strokeMultiplier: number, _pInstance: p5) {
        this.pInstance = _pInstance;
        this.pos = _pos;
        this.diameter = _initialDiameter;
        this.strokeMultiplier = _strokeMultiplier;
        this.strokeSize = (this.diameter * 0.05) * this.strokeMultiplier;
    }

    display() {
        this.pInstance.stroke(244,67,54, 100);
        this.strokeSize = (this.diameter * 0.05) * this.strokeMultiplier;
        this.pInstance.strokeWeight(this.strokeSize);
        this.pInstance.noFill();
        this.pInstance.ellipse(this.pos.x, this.pos.y, this.diameter, this.diameter);
        this.update();
    }

    update() {
        this.diameter += (this.diameter * 0.1) / this.strokeMultiplier;
    }
}

