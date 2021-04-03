import axios from 'axios';
import cheerio from 'cheerio';
import iconv from 'iconv-lite';

export default async (req, res) => {
    res.status(200).json(await callStockData(req.query.type))
}

/**
 * 네이버 증권에서 데이터 크롤링하는 함수
 * @param {}} type 
 * @returns 
 */
const callStockData = async (type) => {
  const frnUrl = "https://finance.naver.com/sise/sise_deal_rank_iframe.nhn?sosok=01&investor_gubun=9000&type=" + type;//외국인
  const orgUrl = "https://finance.naver.com/sise/sise_deal_rank_iframe.nhn?sosok=01&investor_gubun=1000&type=" + type;//기관
  let stockDataList = [];
  
  // EUC-KR로 디코딩
  const decodeText = (text) =>{
      return iconv.decode(text, "EUC-KR");
  }

  //외국인 매매 크롤링
  await axios({url:frnUrl, method:"POST",responseEncoding:"binary",headers:{"Access-Control-Allow-Origin":"*", 'Access-Control-Allow-Methods':"*"}}).then(response => {
      const resultData = [];
      const $ = cheerio.load(response.data);
      $(".box_type_ms:eq(1)").find("td").has(".tit").each((index, item) => {
          const data = {
              id          : decodeText($(item).find("a").attr("href").split("=")[1]),
              stockName   : decodeText($(item).text()),
              quantity    : decodeText($(item).next().text()),
              amount      : decodeText($(item).next().next().text())
          };

          resultData.push(data);
      });

      stockDataList.push(resultData);
  }).catch(error => {
      console.log(error);
  });

  //기관 매매 크롤링
  await axios({url:orgUrl, method:"GET",responseEncoding:"binary"}).then(response => {
      const resultData = [];
      const $ = cheerio.load(response.data);
      $(".box_type_ms:eq(1)").find("td").has(".tit").each((index, item) => {
          //console.log(item);
          //console.log(iconv.decode($(item).text(), "EUC-KR") + "  " + $(item).next().text() + "   " + $(item).next().next().text());
          const data = {
              id          : decodeText($(item).find("a").attr("href").split("=")[1]),
              stockName   : decodeText($(item).text()),
              quantity    : decodeText($(item).next().text()),
              amount      : decodeText($(item).next().next().text())
          };

          resultData.push(data);
      });

      stockDataList.push(resultData);
  }).catch(error => {
      console.log(error);
  });

  return stockDataList;
}


