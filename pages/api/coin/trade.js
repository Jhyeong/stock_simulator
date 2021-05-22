import axios from 'axios';
import jwt from 'jsonwebtoken';
import crypto from 'crypto-js';
import querystring from 'querystring';

export default async (req, res) => {
    res.status(200).json(await callAPI(req.query.type, req.query.market, req.query.price));
}

/**
 * 주문하기
 */
const callAPI = async (type, market, price) => {
    const url = "https://api.upbit.com/v1/orders";

    let body = {
        market: market,     //코인명
        side: '',           //매수 or 매도
        volume: '',         //매도량
        price: '',          //매수량
        ord_type: 'price'   //시장가
    }

    switch(tradeType){
        case "buy" :
            body.side = 'bid';
            volume.volume = '';
            body.price = price;
            break;
        case "sell" :
            body.side = 'ask';
            volume.volume = '';
            body.price = '';
            break;
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