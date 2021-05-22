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
    // const url = "https://api.upbit.com/v1/orders?";
    const url = 'https://api.upbit.com/v1/order?'

    // const param = {
    //     state: 'done',     //체결완료
    //     page : 1,          //페이지
    //     limit : 100        //요청 개수
    // }
    const param = {
        uuid: '29cfffef-4e6d-4324-8255-5e0389652d9f'
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
        console.log(tradeList)
    }).catch(error => {
          console.log(error.response.data);
    });
}

/**
 * 주문하기
 */
const callPOST = async (tradeType, market, price, volume) => {
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