import * as cheerio from 'cheerio';
import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

async function test() {
  const problemUrl = 'https://codeforces.com/contest/841/problem/B';
  const { stdout: problemHtml } = await execPromise(`curl -sL -H "User-Agent: Mozilla/5.0" "${problemUrl}"`);
  const $ = cheerio.load(problemHtml);
  
  let tutorialLink = null;
  $('.roundbox.sidebox a').each((i, el) => {
    const text = $(el).text().toLowerCase();
    const href = $(el).attr('href');
    if ((text.includes('tutorial') || text.includes('editorial') || (href && href.includes('/blog/entry/'))) && !tutorialLink) {
      if (href) tutorialLink = href;
    }
  });

  console.log("Tutorial Link Extracted:", tutorialLink);
  
  if (tutorialLink) {
    if (!tutorialLink.startsWith('http')) {
      tutorialLink = `https://codeforces.com${tutorialLink}`;
    }
    console.log("Full Tutorial Link:", tutorialLink);
    const { stdout: tutorialHtml } = await execPromise(`curl -sL -H "User-Agent: Mozilla/5.0" "${tutorialLink}"`);
    console.log("Tutorial HTML Length:", tutorialHtml.length);
  }
}
test().catch(console.error);
