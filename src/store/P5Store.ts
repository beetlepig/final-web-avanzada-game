import {action, observable} from "mobx";
import { Vector } from "p5";

class P5Store {
    @observable lastPlayerPosition: Vector | undefined;
    @observable lastEnemyPosition: Vector | undefined;
    @observable puntos: number = 0;

    @action seLastPlayerPosition(position: Vector) {
        this.lastPlayerPosition = position;
    }

    @action setPuntos(points: number) {
        this.puntos = points;
    }

}


export const store = new P5Store();