import { MD5 } from "crypto-js";

export function generateCode(...prams: string[]): string {
  const combinedString = prams.join("");
  console.log(combinedString);
  let md5Hash = MD5(combinedString).toString();
  let result = "";
  while (result.length < 6) {
    const numbers = md5Hash.match(/\d+/g);
    if (numbers) {
      result += numbers.join("");
      if (result.length > 6) return result.substring(0, 6);
    }
    md5Hash = MD5(md5Hash).toString();
  }
  return "";
}
