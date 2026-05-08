import express from 'express';
import fetch from 'node-fetch'; // keeping for legacy if needed, or remove
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const router = express.Router();

router.post('/generate-hints', async (req, res) => {
  const { problemUrl, apiKey } = req.body;

  if (!problemUrl || !apiKey) {
    return res.status(400).json({ error: 'Missing problemUrl or apiKey' });
  }

  try {
    // 1. Fetch the Codeforces Problem Page using curl
    let problemHtml = '';
    try {
      const { stdout } = await execPromise(`curl -sL -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" "${problemUrl}"`, { maxBuffer: 1024 * 1024 * 10 });
      problemHtml = stdout;
    } catch (err) {
      console.error('Codeforces problem curl failed:', err);
      return res.status(400).json({ error: `Failed to access the Codeforces problem URL via curl.` });
    }

    if (!problemHtml || problemHtml.length < 100) {
       return res.status(400).json({ error: `Failed to access the Codeforces problem URL. Received empty/blocked response.` });
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
      return res.status(404).json({ error: 'Could not find a tutorial link on the problem page.' });
    }

    if (!tutorialLink.startsWith('http')) {
      tutorialLink = `https://codeforces.com${tutorialLink}`;
    }

    // 3. Fetch the tutorial blog page using curl
    let tutorialHtml = '';
    try {
       const { stdout } = await execPromise(`curl -sL -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" "${tutorialLink}"`, { maxBuffer: 1024 * 1024 * 10 });
       tutorialHtml = stdout;
    } catch(err) {
       console.error('Codeforces tutorial curl failed:', err);
       return res.status(400).json({ error: 'Failed to fetch the Codeforces tutorial blog.' });
    }
    const $tut = cheerio.load(tutorialHtml);
    
    // We get the main content of the blog post
    const rawEditorialText = $tut('.ttypography').text();
    if (!rawEditorialText || rawEditorialText.trim().length === 0) {
      return res.status(404).json({ error: 'Tutorial content is empty or unparsable.' });
    }

    // Since the blog often contains tutorials for multiple problems, we send the whole text (usually 2k-5k tokens) to Gemini
    // and tell it to find the explanation for this specific problem (deduced from the URL).
    const problemId = problemUrl.split('/').pop();

    // 4. Call Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    
    let chosenModel = 'gemini-1.5-flash';
    let availableModels = [];
    try {
      const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        availableModels = modelsData.models
          .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
          .map(m => m.name.replace('models/', ''));
          
        if (availableModels.includes('gemini-2.5-flash')) chosenModel = 'gemini-2.5-flash';
        else if (availableModels.includes('gemini-2.0-flash')) chosenModel = 'gemini-2.0-flash';
        else if (availableModels.includes('gemini-1.5-flash')) chosenModel = 'gemini-1.5-flash';
        else {
           const flash = availableModels.find(m => m.includes('flash') && !m.includes('vision'));
           const pro = availableModels.find(m => m.includes('pro') && !m.includes('vision'));
           if (flash) chosenModel = flash;
           else if (pro) chosenModel = pro;
        }
      }
    } catch(e) {
      console.log('Failed to fetch models list, using fallback.');
    }
    
    let outputText = null;
    let fallbackErrors = [];

    const prompt = `
You are an expert competitive programming instructor.
I will give you the text of a Codeforces editorial blog post. This blog might contain solutions for multiple problems.
The user is asking for hints for the problem related to this URL: ${problemUrl} (Look for Problem ${problemId}).

Find the editorial part relevant to that specific problem, and then generate a JSON response strictly following this schema without any markdown formatting wrappers (like \`\`\`json):

{
  "directionToThink": "1-3 concise lines mentioning core concepts like greedy, dp, graphs, etc.",
  "hints": [
    {
      "hint": "progressive hint text from beginner to advanced...",
      "catch": "a common mistake or misconception related to this hint"
    }
  ],
  "editorial": [
    { "title": "Observation", "content": "..." },
    { "title": "Key Idea", "content": "..." },
    { "title": "Approach", "content": "..." },
    { "title": "Complexity", "content": "..." }
  ],
  "solutionCode": "clean, optimized C++ code with meaningful comments",
  "solutionExplanation": "short explanation of how the code works"
}

Important Rules:
- DO NOT wrap the output in markdown. Just return raw JSON.
- DO NOT copy the original editorial text directly. Rephrase everything in simple, beginner-friendly language.
- Number of hints: 4 to 8 (depending on complexity).
- Ensure hints gradually increase in difficulty and guide the user closer to the solution WITHOUT revealing it completely.

Here is the editorial text:
"""
${rawEditorialText.substring(0, 50000)} // truncate to avoid giant context just in case
"""
`;

    // Attempt generation across available models to handle 503 Service Unavailable
    let selectedModels = [];
    if (availableModels.length > 0) {
      if (availableModels.includes('gemini-2.5-flash')) selectedModels.push('gemini-2.5-flash');
      if (availableModels.includes('gemini-2.0-flash')) selectedModels.push('gemini-2.0-flash');
      if (availableModels.includes('gemini-1.5-flash')) selectedModels.push('gemini-1.5-flash');
      const extraFlash = availableModels.find(m => m.includes('flash') && !m.includes('vision') && !selectedModels.includes(m));
      if (extraFlash) selectedModels.push(extraFlash);
      const extraPro = availableModels.find(m => m.includes('pro') && !m.includes('vision'));
      if (extraPro) selectedModels.push(extraPro);
      
      // Ensure at least chosen model is in array
      if (selectedModels.length === 0) selectedModels.push(chosenModel);
    } else {
      selectedModels = [chosenModel];
    }

    for (const m of selectedModels) {
      try {
        console.log("Attempting generation with:", m);
        const model = genAI.getGenerativeModel({ model: m });
        const result = await model.generateContent(prompt);
        outputText = result.response.text();
        console.log("Generation successful with", m);
        break; // Success! Exit loop
      } catch (err) {
        console.error(`Generation failed with ${m}:`, err.message);
        fallbackErrors.push(`[${m}]: ${err.message}`);
        if (!err.message.includes('503')) {
           // Not a temporary high demand error, might be 400 or something else, but we can still try next just in case
        }
      }
    }

    if (!outputText) {
      return res.status(503).json({ error: 'All Gemini models are currently overloaded or failed.', details: fallbackErrors });
    }

    // Strip markdown formatting if the model still outputs it
    if (outputText.startsWith('\`\`\`json')) {
      outputText = outputText.replace(/^\`\`\`json\n?/, '').replace(/\n?\`\`\`$/, '');
    } else if (outputText.startsWith('\`\`\`')) {
      outputText = outputText.replace(/^\`\`\`\n?/, '').replace(/\n?\`\`\`$/, '');
    }

    try {
      const parsedData = JSON.parse(outputText);
      return res.json(parsedData);
    } catch (parseErr) {
      console.error("Gemini JSON Parse Error:", outputText);
      return res.status(500).json({ error: 'Failed to parse structured response from Gemini', rawOutput: outputText });
    }

  } catch (error) {
    console.error('AI Editorial Error:', error);
    return res.status(500).json({ error: error.message || 'An error occurred during AI generation.' });
  }
});

export default router;
