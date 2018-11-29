import {action, observable} from "mobx";
import { Vector } from "p5";

class P5Store {
    @observable fire: boolean  = false;

    @action BulletFired(isFired: boolean) {
        this.fire = isFired;
    }

}


export const store = new P5Store();