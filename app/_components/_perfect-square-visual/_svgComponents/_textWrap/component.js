import { TextBox } from "d3plus-text";

export default function textWrap() {
    const SMALL_FONT = 5;
    // dimns and pos
    let width = 200;
    let height = 200;
    let x = 0;
    let y = 0;

    // font
    let fontMin = SMALL_FONT * 0.9;
    let fontMax = SMALL_FONT * 1.1;
    let fontOpacity = 0.7;
    let fontResize = true;

    const textbox = new TextBox();
    let text = () => "";

    function update(selection, options = {}) {
        // dimns and pos
        width = options.width || width;
        height = options.height || height;
        x = options.x || x;
        y = options.y || y;
        // font
        fontMin = options.fontMin || fontMin;
        fontMax = options.fontMax || fontMax;
        fontOpacity = options.fontOpacity || fontOpacity;
        fontResize = options.fontResize || fontResize;

        selection.each(function (data) {
            const requiredText = typeof text === "function" ? text(data) : text;
            textbox
                .data([{ text: requiredText }])
                .id(data.id)
                .select(this)
                .width(width)
                .height(height)
                .x(x)
                .y(y)
                .fontMin(fontMin)
                .fontMax(fontMax)
                .fontOpacity(fontOpacity)
                .fontResize(true)
                .ellipsis((s) => `${s.replace(/\.|,$/g, "")}...`)
                .render();
        });

        return selection;
    }
    update.text = function (value) {
        if (!arguments.length) { return text; }
        text = value;
        return update;
    };

    return update;
}