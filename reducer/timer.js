//액션 타입 정의
const PLUS_MIN = "PLUS_MIN";
const PLUS_SEC = "PLUS_SEC";
const CLEAR_MIN = "CLEAR_MIN";
const CLEAR_SEC = "CLEAR_SEC";

//state 초기값 설정
const intitialState = {
    min : 0,
    sec : 0
};

//Action 정의
export const actionPlusMin = () => ({
    type : PLUS_MIN
});

export const actionPlusSec = () => ({
    type : PLUS_SEC
});

export const actionClearMin = () => ({
    type : CLEAR_MIN
});

export const actionClearSec = () => ({
    type : CLEAR_SEC
});

const timer = (state = intitialState, action) =>{
    switch (action.type) {
        case PLUS_MIN:
            return{
                ...state,
                min : state.min + 1
            };
        case PLUS_SEC:
            return{
                ...state,
                sec : state.sec + 1
            };
        case CLEAR_MIN:
          return {
              ...state,
              min : 0
          };
        case CLEAR_SEC:
          return {
              ...state,
              sec : 0
          };
        default:
          return state;
      }
}

export default timer;