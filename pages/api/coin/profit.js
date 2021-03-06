import axios from 'axios';
import jwt from 'jsonwebtoken';
import crypto from 'crypto-js';
import querystring from 'querystring';

export default async (req, res) => {
    res.status(200).json(await callGET(req.query.date));
}

/**
 * μμ΅ κ³μ°
 */
const callGET = async (date) => {
    let resultList = [];
    let tmpList = [];
    const lastDate = new Date(date).toISOString().split('T')[0];
    // console.log("π ~ file: profit.js ~ line 17 ~ callGET ~ lastDate", lastDate)
    const url = "https://api.upbit.com/v1/orders?";
    const lastPage = 2;

    for(let i = 1; i <= lastPage; i++){
        const query = `states[]=done&states[]=cancel&page=${i}&limit=100`;
        console.log("π ~ file: profit.js ~ line 41 ~ callGET ~ query", query)
        
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
    
        await axios({url:url + query, method: "GET", headers: {Authorization : authorizationToken}}).then(response => {
            tmpList.push(...response.data);
        }).catch(error => {
            console.log(error.response.data);
        });
    }

    //λ μ§μ λ΄λ¦Όμ°¨μ μ λ ¬
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
        
        //μμ₯κ° λ§€λλ‘ μΈν΄ κ°κ²©μ λ³΄κ° μλ κ²½μ° λ³λ μ‘°ν
        if(!item.price){
            item.price = await getPrice(item.uuid);
            console.log("π ~ file: profit.js ~ line 66 ~ callGET ~ item.price", item.price)
            await sleep(50);//μ΄λΉ 30ν, λΆλΉ 900ν
        }
        //κΈ°μ‘΄ λ°μ΄ν°κ° μμΌλ©΄ sum
        if(preData){
            preData.buyPrice = item.side == 'bid' ? parseInt(item.price) + preData.buyPrice : preData.buyPrice;
            preData.sellPrice = item.side == 'ask' ? (item.price * item.volume) + preData.sellPrice : preData.sellPrice;
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
    
    //ν©κ³
    resultList.map((result) => {
        result.sum = result.sellPrice - result.buyPrice;
    });

    return resultList;
}

/**
 * κ±΄λ³ κ°κ²© μ‘°ν
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
 * μ€ν¬λ¦½νΈ sleep
 * @param {} ms 
 * @returns 
 */
const sleep = (ms) => {
    return new Promise((r) => setTimeout(r, ms));
}

/**
 * uuid μμ±
 * @returns 
 */
const guid = () => {
    const s4 = () => {
        return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}