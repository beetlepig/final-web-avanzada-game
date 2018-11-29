import React, {Component} from 'react';
import './SketchGame.css';
import { Sketch } from './P5Wrapper/sketch';
import {sketch} from "./sketch.p5";
import {observer} from "mobx-react";
import {store} from "../../store/P5Store";

interface Props {

}

interface State {

}

@observer class SketchGame extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {

    }

    componentWillUnmount() {

    }

    render() {
        return (
            <div className={'CanvasContainer'}>
                <Sketch sketch={sketch}
                        width={'99%'}
                        height={'99%'}
                        sketchProps={{fire: store.fire}}
                />
            </div>
        );
    }
}

export default SketchGame;