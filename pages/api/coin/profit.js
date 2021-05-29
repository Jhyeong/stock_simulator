import axios from 'axios';
import jwt from 'jsonwebtoken';
import crypto from 'crypto-js';
import querystring from 'querystring';

export default async (req, res) => {
    res.status(200).json(await callGET(req.query.date));
}

/**
 * 손익 계산
 */
const callGET = async (date) => {
    let resultList = [];
    let tmpList = [];
    const lastDate = new Date(date).toISOString().split('T')[0];
    // console.log("🚀 ~ file: profit.js ~ line 17 ~ callGET ~ lastDate", lastDate)
    const url = "https://api.upbit.com/v1/orders?";
    const lastPage = 2;

    for(let i = 1; i <= lastPage; i++){
        for(let j = 0 ; j < 2; j++){
            let state = '';
            switch(j){
                case 0 : 
                    state = 'done'
                    break;
                case 1:
                    state = 'cancel'
                    break;
            }
            
            const param = {
                state: state,     //체결완료
                page : i,          //페이지
                limit : 100        //요청 개수
            };
        
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
                tmpList.push(...response.data);
        
            }).catch(error => {
                  console.log(error.response.data);
            });
        }
    }

    //날짜순 내림차순 정렬
    tmpList.sort((a, b) => {
        if(a.created_at > b.created_at) return -1;
        else if(a.created_at < b.created_at) return 1;
        else return 0;
    });

    for(let item of tmpList){
        if(item.created_at.split('T')[0] < lastDate){
            break;
        }

        const preData = resultList.find((preData) => (item.market == preData.market && item.created_at.split('T')[0] == preData.tradeDate));
        
        //시장가 매도로 인해 가격이 없는 경우 별도 조회
        if(!item.price){
            item.price = await getPrice(item.uuid);
            console.log("🚀 ~ file: profit.js ~ line 66 ~ callGET ~ item.price", item.price)
            await sleep(50);//초당 30회, 분당 900회
        }
        //기존 데이터가 있으면 sum
        if(preData){
            preData.buyPrice = item.side == 'bid' ? parseInt(item.price) + preData.buyPrice : preData.buyPrice;
            preData.sellPrice = item.side == 'ask' ? (item.price * item.volume) + preData.sellPrice : preData.sellPrice;
            // if(item.market == 'KRW-TON'){
            //     console.log(item)
            // }
        }else{
            const data = {
                market : item.market,
                buyPrice : item.side == 'bid' ? parseInt(item.price) : 0,
                sellPrice : item.side == 'ask' ? (item.price * item.volume) : 0,
                tradeDate : item.created_at.split('T')[0]
            };
            resultList.push(data);
        }
        
    }
    // console.log("🚀 ~ file: profit.js ~ line 95 ~ callGET ~ getPrice('0e7a9b8a-8447-4458-ac1e-49eeb5060ecf');", await getPrice('0e7a9b8a-8447-4458-ac1e-49eeb5060ecf'))
    
    //합계
    resultList.map((result) => {
        result.sum = result.sellPrice - result.buyPrice;
    });

    return resultList;
}

/**
 * 시장가 거래 건별 가격 조회
 * @param {}} uuid 
 * @returns 
 */
const getPrice = async (uuid) => {
    let result = '';
    
    const url = "https://api.upbit.com/v1/order?";
    const param = {
        uuid: uuid
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
        if(response.data){
            result = response.data.trades[0].price;
        }
    }).catch(error => {
          console.log(error.response.data);
    });

    return result;
}

/**
 * 스크립트 sleep
 * @param {} ms 
 * @returns 
 */
const sleep = (ms) => {
    return new Promise((r) => setTimeout(r, ms));
}

/**
 * uuid 생성
 * @returns 
 */
const guid = () => {
    const s4 = () => {
        return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}