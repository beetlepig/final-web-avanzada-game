import {action, observable} from "mobx";
import { Vector } from "p5";

class P5Store {
    @observable fire: boolean  = false;
    @observable redInvulnerability: boolean = false;

    @action BulletFired(isFired: boolean) {
        this.fire = isFired;
    }

    @action InvulnerabilityRed(isPressed: boolean) {
        this.redInvulnerability = isPressed;
    }

}


export const store = new P5Store();