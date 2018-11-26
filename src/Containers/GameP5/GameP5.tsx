import React, {PureComponent} from 'react';
import './GameP5.css'
import SketchGame from "../../Components/SketchP5/SketchGame";

class GameP5 extends PureComponent {
    render() {
        return (
            <div className={'gameContainer'}>
                <SketchGame/>
            </div>
        );
    }
}

export default GameP5;