import axios from 'axios';
import jwt from 'jsonwebtoken';
import crypto from 'crypto-js';
import querystring from 'querystring';

export default async (req, res) => {
    switch(req.query.method){
        case "GET" : 
            res.status(200).json(await callGET());
            break;
        case "POST" :
            res.status(200).json(await callPOST(req.query.tradeType, req.query.market, req.query.price, req.query.volume));
            break;
    }
}

/**
 * 주문리스트 조회
 */
const callGET = async () => {
    const resultList = [];
    const url = "https://api.upbit.com/v1/orders?";

    const param = {
        state: 'done',     //체결완료
        page : 1,          //페이지
        limit : 100        //요청 개수
    }

    const query = querystring.encode(param);
    
    const hash = crypto.algo.SHA512.create();
    const queryHash = hash.update(query).finalize().toString();
    
    const payload = {
        access_key: process.env.JWT_ACCESS_CODE,
        nonce: guid(),
        query_hash: queryHash,
        query_hash_alg: 'SHA512'
    }
    
    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET_CODE);
    const authorizationToken = `Bearer ${jwtToken}`;

    await axios({url:url + query, method: "GET", headers: {Authorization : authorizationToken}, data : param}).then(response => {
        const tradeList = response.data;
        // console.log(tradeList)
        // tradeList.map((tradeData) => {
        //     const resultData = resultList.find((resultData) => resultData.market == tradeData.market);
        //     if(resultData){
        //         resultData.
        //     }else{
        //         const data = {
        //             market : tradeData.market,
        //             tradeType : tradeData.side == 'bid' ? '매수' : '매도',
        //             price : tradeData.price,
        //             volume : tradeData.volume,
        //             tradeTime : tradeData.created_at.split('T')[0]
        //         }

        //         resultList.push(data);
        //     }

        // });

    }).catch(error => {
          console.log(error.response.data);
    });
}

/**
 * 주문하기
 */
const callPOST = async (tradeType, market, price, volume) => {
    //주문 예외
    if(market == 'KRW-ETC' || market == 'KRW-ETH'){
        // console.log(market + " 주문예외");
        return;
    }

    const url = "https://api.upbit.com/v1/orders";

    const body = {
        market: market,     //코인명
        side: tradeType,    //매수 or 매도
        volume: volume,     //매도량
        price: price,       //매수량
        ord_type: tradeType == 'bid' ? 'price' : 'market' //시장가
    }

    const query = querystring.encode(body);
    
    const hash = crypto.algo.SHA512.create();
    const queryHash = hash.update(query).finalize().toString();
    
    const payload = {
        access_key: process.env.JWT_ACCESS_CODE,
        nonce: guid(),
        query_hash: queryHash,
        query_hash_alg: 'SHA512'
    }
    
    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET_CODE);
    const authorizationToken = `Bearer ${jwtToken}`;

    console.log(market + ' 주문 ' + tradeType);
    console.log(body);
    await axios({url:url, method:"POST", headers: {Authorization : authorizationToken}, data : body}).then(response => {
        const tradeData = response.data;
        console.log(tradeData);
    }).catch(error => {
          console.log(error.response.data);
    });
}


//uuid 생성
const guid = () => {
    const s4 = () => {
        return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}