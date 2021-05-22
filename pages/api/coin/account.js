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
    const url = "https://api.upbit.com/v1/accounts";
    const payload = {
        access_key: process.env.JWT_ACCESS_CODE,
        nonce: guid(),
      };
    
    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET_CODE);
    const authorizationToken = `Bearer ${jwtToken}`;

    await axios({url:url, method:"GET", headers: {Authorization : authorizationToken}}).then(response => {
        console.log(response.data);
        return response.data;
    }).catch(error => {
          console.log(error);
    });
}

//uuid 생성
const guid = () => {
    const s4 = () => {
        return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}