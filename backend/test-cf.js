import { exec } from 'child_process';
import util from 'util';
import * as cheerio from 'cheerio';
const execPromise = util.promisify(exec);

async function test() {
  const problemUrl = 'https://codeforces.com/contest/841/problem/B';
  let problemHtml = '';
  try {
      const { stdout } = await execPromise(`curl -sL -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" "${problemUrl}"`, { maxBuffer: 1024 * 1024 * 10 });
      problemHtml = stdout;
  } catch (err) {
      console.error('Codeforces problem curl failed:', err);
      return;
  }

  const $ = cheerio.load(problemHtml);

  // 2. Find tutorial link
  let tutorialLink = null;
  $('.roundbox.sidebox a').each((i, el) => {
    const text = $(el).text().toLowerCase();
    const href = $(el).attr('href');
    if ((text.includes('tutorial') || text.includes('editorial') || (href && href.includes('/blog/entry/'))) && !tutorialLink) {
      if (href) {
        tutorialLink = href;
      }
    }
  });

  if (!tutorialLink) {
      console.error('Could not find a tutorial link');
      return;
  }

  if (!tutorialLink.startsWith('http')) {
      tutorialLink = `https://codeforces.com${tutorialLink}`;
  }
  
  console.log("tutorialLink:", tutorialLink);
  let tutorialHtml = '';
  try {
     const { stdout } = await execPromise(`curl -sL -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" "${tutorialLink}"`, { maxBuffer: 1024 * 1024 * 10 });
     tutorialHtml = stdout;
     console.log("tutorialHtml length:", tutorialHtml.length);
  } catch(err) {
     console.error('Codeforces tutorial curl failed:', err);
  }
}
test();
