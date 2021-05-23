import axios from 'axios';
import jwt from 'jsonwebtoken';
import crypto from 'crypto-js';
import querystring from 'querystring';

export default async (req, res) => {
    res.status(200).json(await callAPI());
}

/**
 * 계좌정보 조회
 */
const callAPI = async () => {
    let accountList = [];
    let url = "https://api.upbit.com/v1/accounts";
    let payload = {
        access_key: process.env.JWT_ACCESS_CODE,
        nonce: guid(),
      };
    
    let jwtToken = jwt.sign(payload, process.env.JWT_SECRET_CODE);
    let authorizationToken = `Bearer ${jwtToken}`;

    await axios({url:url, method:"GET", headers: {Authorization : authorizationToken}}).then(response => {
        accountList = response.data;
        // console.log("🚀 ~ file: Account.js ~ line 26 ~ awaitaxios ~ resultdata", accountList)
    }).catch(error => {
        console.log(error);
    });

    url = "https://api.upbit.com/v1/orders?";

    payload = {
        state: 'done',     //체결완료
        page : 1,          //페이지
        limit : 100        //요청 개수
    }

    const query = querystring.encode(payload);
    
    const hash = crypto.algo.SHA512.create();
    const queryHash = hash.update(query).finalize().toString();
    
    payload = {
        access_key: process.env.JWT_ACCESS_CODE,
        nonce: guid(),
        query_hash: queryHash,
        query_hash_alg: 'SHA512'
    }
    
    jwtToken = jwt.sign(payload, process.env.JWT_SECRET_CODE);
    authorizationToken = `Bearer ${jwtToken}`;

    //주문내역 조회 후 매수일 맵핑
    await axios({url:url + query, method: "GET", headers: {Authorization : authorizationToken}, data : payload}).then(response => {
        const orderList = response.data;
        // console.log("🚀 ~ file: Account.js ~ line 59 ~ accountList.map ~ orderData", orderList)
        accountList.map((account) => {
            const orderData = orderList.find((orderData) => account.unit_currency + '-' + account.currency == orderData.market && orderData.side == 'bid');
            if(orderData){
                account.createdAt   = orderData.created_at;
            }
        });
        
    }).catch(error => {
        console.log(error.response.data);
    });

    return accountList;
}

//uuid 생성
const guid = () => {
    const s4 = () => {
        return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}