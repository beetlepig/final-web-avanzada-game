import React, {PureComponent} from 'react';
import './GameP5.css'
import SketchGame from "../../Components/SketchP5/SketchGame";
import {store} from "../../store/P5Store";

class GameP5 extends PureComponent {

    constructor(props: any) {
        super(props);
        this.onShot = this.onShot.bind(this);
        this.onInvulnerabilityActive =  this.onInvulnerabilityActive.bind(this);
        this.onInvulnerabilityOff =  this.onInvulnerabilityOff.bind(this);
    }


    onShot() {
        store.BulletFired(true);
    };

    onInvulnerabilityActive() {
        store.InvulnerabilityRed(true);
    }

    onInvulnerabilityOff() {
        store.InvulnerabilityRed(false);
    }


    render() {
        return (
            <div className={'gameContainer'}>
                <div className={'fireButtonContainer'}>
                    <button className={'fireButton'} onTouchStart={this.onShot}/>
                </div>
                <SketchGame/>
                <div className={'invulnerabilityButtonContainer'}>
                    <button className={'invulnerabilityButton'} onTouchStart={this.onInvulnerabilityActive}  onTouchEnd={this.onInvulnerabilityOff}/>
                </div>
            </div>
        );
    }
}

export default GameP5;