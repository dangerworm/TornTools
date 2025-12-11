import type { ProfitableListing } from "../types/profitableListings";

export const generateAutoBuyScript = (row: ProfitableListing): string => {
  const lowestPrice = Math.max(Math.floor(row.minPrice * 0.6), row.marketPrice);

  const script = `let lastText = "";
const checkInterval = 200; // ms
const selector = "ul.sellerList___kgAh_ > li:first .honorWrap___BHau4.flexCenter___bV1QP.honorWrapSmall___oFibH .honor-text-wrap .honor-text";

const intervalId = setInterval(async () => {
  const el = $(selector).last().text();
  if (!el) return;

  const currentText = el.trim();
  if (currentText !== lastText) {
    if (lastText !== "") {
      let li = $("ul.sellerList___kgAh_ > li:first")
      let row = li.children(0).children(0)
      let lowestPriceString = row.eq(2).text().substring(1).replace(/,/g, "");
      let lowestPrice = parseInt(lowestPriceString);
      console.log("New price:", lowestPrice);

      if (lowestPrice <= ${lowestPrice * 1.05}) {
        await row.eq(4).children(0).children(0).children(0).children(0).children("input").eq(0).click()
        await row.eq(4).children(0).children("button").eq(0).click()

        let yesButton = li.find("div.confirmButtons___Imp8D button:contains('Yes')");
        yesButton.click();
      }
    }
    lastText = currentText;
  }
}, checkInterval);`;

  return script;
};