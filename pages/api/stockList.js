import axios from 'axios';
import cheerio from 'cheerio';
import iconv from 'iconv-lite';

export default async (req, res) => {
    res.status(200).json(await callStockData(req.query.type))
}

/**
 * 외국인 / 기관 모두 순매수 or 순매도한 종목 리스트 크롤링
 * 
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
  await axios({url:frnUrl, method:"POST",responseEncoding:"binary"}).then(response => {
      const $ = cheerio.load(response.data);
      $(".box_type_ms:eq(1)").find("td").has(".tit").each((index, item) => {
          const data = {
              id       : decodeText($(item).find("a").attr("href").split("=")[1]),
              stockName: decodeText($(item).text()),
              frnAmount: decodeText($(item).next().next().text()),
              orgAmount: 0,
              sum      : 0
          };

          stockDataList.push(data);
      });
  }).catch(error => {
      console.log(error);
  });

  //기관 매매 크롤링
  await axios({url:orgUrl, method:"GET",responseEncoding:"binary"}).then(response => {
      const $ = cheerio.load(response.data);
      $(".box_type_ms:eq(1)").find("td").has(".tit").each((index, item) => {
            const id = decodeText($(item).find("a").attr("href").split("=")[1]);
            //외국인이 매매한 종목만 검색
            let frnData = stockDataList.find((item) => {
                return item.id == id;
            });
            
            if(frnData){
                frnData.orgAmount = decodeText($(item).next().next().text());
                frnData.sum = parseInt(frnData.frnAmount.replace(/,/g, ""), 10) + parseInt(frnData.orgAmount.replace(/,/g, ""), 10);
            }
      });
  }).catch(error => {
      console.log(error);
  });

  stockDataList = stockDataList.filter((item) => {
      return item.frnAmount != "0" && item.orgAmount != "0";
  });

  return stockDataList;
}


