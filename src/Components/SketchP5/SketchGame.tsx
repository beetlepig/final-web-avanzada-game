import React, {Component} from 'react';
import './SketchGame.css';
import { Sketch } from './P5Wrapper/sketch';
import {sketch} from "./sketch.p5";

interface Props {

}

interface State {
    value: number;
}

class SketchGame extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { value: 0 };
    }

    componentDidMount() {

    }

    componentWillUnmount() {

    }

    render() {
        return (
            <div className={'CanvasContainer'} onClick={() => { this.setState({ value: (this.state.value + 5)%256 }) }}>
                <Sketch sketch={sketch}
                        width={'100%'}
                        height={'100%'}
                        sketchProps={{ value: this.state.value}}
                />
            </div>
        );
    }
}

export default SketchGame;