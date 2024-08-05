import express from 'express';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.get('/screenshot', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send('URL is required');
    }

    console.log(`Received request to capture screenshot for URL: ${url}`);

    try {
        const browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-software-rasterizer'
            ]
        });
        const page = await browser.newPage();
        console.log("visiting the url");
        await page.goto(url);

        console.log("capturing the screenshot");
        const screenshotPath = path.join(__dirname, 'public', `${new URL(url).hostname}-screenshot.png`);
        await page.screenshot({ path: screenshotPath });

        console.log(`Screenshot stored at ${screenshotPath}`);

        await browser.close();

        res.send(`Screenshot saved at /public/${new URL(url).hostname}-screenshot.png`);
    } catch (error) {
        console.error('Error capturing screenshot:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/analyze', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send('URL is required');
    }

    console.log(`Received request to analyze URL: ${url}`);

    try {
        const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'] });
        const options = { logLevel: 'info', output: 'json', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'], port: chrome.port };
        const runnerResult = await lighthouse(url, options);

        const reportJson = runnerResult.report;
        const resultsPath = path.join(__dirname, 'public', `${new URL(url).hostname}-results.json`);
        fs.writeFileSync(resultsPath, reportJson);

        console.log(`Lighthouse results stored at ${resultsPath}`);

        await chrome.kill();

        res.send(`Lighthouse results saved at /public/${new URL(url).hostname}-results.json`);
    } catch (error) {
        console.error('Error running Lighthouse analysis:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
