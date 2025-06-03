import { ArrangeBy } from "@/app/_components/perfect-square/types";

export const _simulationIsOn = (arrangeBySettings : ArrangeBy | null):boolean => {
    if(!arrangeBySettings) { return false; }
    const { x, y } = arrangeBySettings;
    return x || y ? true : false;
}
