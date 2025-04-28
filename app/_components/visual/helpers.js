export const _simulationIsOn = (settings = {}) => {
    const { x, y } = settings?.arrangeBy || settings || {};
    return x || y ? true : false;
}
