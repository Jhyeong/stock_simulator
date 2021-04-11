import axios from 'axios';
import cheerio from 'cheerio';
import iconv from 'iconv-lite';

export default async (req, res) => {
    res.status(200).json(await callStockData(req.query.type))
}

/**
 * 외국인/기관 매매 내역
 * 
 * @param {}} type 
 * @returns 
 */
const callStockData = async (stockCode) => {
  const url = "https://finance.naver.com/item/main.nhn?code=" + stockCode;
  let stockData = [];
  // EUC-KR로 디코딩
  const decodeText = (text) =>{
      return iconv.decode(text.trim(), "EUC-KR");
  }
  //크롤링 실행
  await axios({url:url, method:"POST",responseEncoding:"binary"}).then(response => {
      const $ = cheerio.load(decodeText(response.data));
      $(".sub_section.right tbody th").each((index, item) => {
          const data = {
              id            : $(item).text(),
              finalPrice    : $(item).next().text(),
              changedPrice  : $(item).next().next().text().replace("상향", "+").replace("하향", "-").replace(/\s/g, ""),
              frnQuantity   : $(item).next().next().next().text(),
              orgQuantity   : $(item).next().next().next().next().text()
          }

          stockData.push(data);
      });
  }).catch(error => {
      console.log(error);
  });
  return stockData;
}


