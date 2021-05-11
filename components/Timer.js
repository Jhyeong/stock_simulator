import { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import {actionPlusMin, actionPlusSec, actionClearMin, actionClearSec} from "../reducer/timer";
/**
 * 타이머
 * @param {*} props 
 */
const Timer = (props) => {
    const endTime = 5;
    let timer;

    const dispatch = useDispatch();
    const min = useSelector(state => state.timer.min);
    const sec = useSelector(state => state.timer.sec);

    //타이머 시작
    useEffect(() => {
        timer = setInterval(() =>{
            if(parseInt(sec) < 59){
                dispatch(actionPlusSec());
            }else{
                dispatch(actionPlusMin());
                dispatch(actionClearSec());
            }

            if(parseInt(min) == endTime){
                dispatch(actionClearMin());
                dispatch(actionClearSec());
            }
        }, 1000);
        
        return () => clearInterval(timer);
    }, [min, sec]);

    return(
        <div>
            실행시간 : {min} 분 {sec} 초
        </div>
    );
};

export default Timer;