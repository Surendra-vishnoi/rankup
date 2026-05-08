import * as cheerio from 'cheerio';
import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

async function test() {
  const problemUrl = 'https://codeforces.com/contest/841/problem/B';
  const { stdout: problemHtml } = await execPromise(`curl -sL -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" "${problemUrl}"`);
  console.log("Length:", problemHtml.length);
  const $ = cheerio.load(problemHtml);
  console.log("Title:", $('title').text());
}
test().catch(console.error);
