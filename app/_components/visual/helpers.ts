import { ArrangeBy } from "@/app/common-types/data-types";

export const _simulationIsOn = (arrangeBySettings : ArrangeBy | null):boolean => {
    if(!arrangeBySettings) { return false; }
    const { x, y } = arrangeBySettings;
    return x || y ? true : false;
}
