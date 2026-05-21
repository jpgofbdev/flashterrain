export const state = {
  interactionMode: "explore",
  currentLat: null,
  currentLon: null,
  currentData: {
    icpe: null,
    natura: null,
    topage: null,
    bv: null
  }
};

export function resetCurrentData(){
  state.currentData = {
    icpe: null,
    natura: null,
    topage: null,
    bv: null
  };
}
