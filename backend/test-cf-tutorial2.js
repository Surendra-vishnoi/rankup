import * as cheerio from 'cheerio';
import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

async function test() {
  const problemUrl = 'https://codeforces.com/contest/841/problem/B';
  const { stdout: problemHtml } = await execPromise(`curl -sL -H "User-Agent: Mozilla/5.0" "${problemUrl}"`);
  const $ = cheerio.load(problemHtml);
  
  $('.roundbox.sidebox a').each((i, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href');
    console.log(`Link => text: "${text}", href: ${href}`);
  });
}
test().catch(console.error);
