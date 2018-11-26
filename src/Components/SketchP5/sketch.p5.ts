import * as p5 from "p5";

interface customP5Functions extends p5 {
    receiveProps: (nextProps: SketchProps) => void;
    unmount: () => void;
}

interface SketchProps {
    value: number;
}

export const sketch = (width: number, height: number, props: SketchProps) => {
    return function (p5: customP5Functions) {
        let value: number = props.value;
        p5.setup = () => {
            p5.frameRate(60);
        };

        p5.draw = () => {
            p5.background(value, 10);
            p5.noStroke();
            p5.ellipse(p5.mouseX, p5.mouseY, width * 0.05, width * 0.05);
        };

        p5.receiveProps = (nextProps: SketchProps) => {
            console.log(nextProps.value);
            value = nextProps.value;
        };

        p5.unmount = () => {
            console.log('The sketch was unmounted. Width was ' + width + ', height was ' + height);
        }
    }
};