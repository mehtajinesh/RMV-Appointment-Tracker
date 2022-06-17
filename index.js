// import the Puppeteer library and Python Library
import puppeteer from "puppeteer";
import { PythonShell } from "python-shell";
import config from "./config.js";
// take the URL from command-line arguments
const url = process.argv[2];
if (!url) {
  throw "Please provide a URL as the first argument";
}

async function bypass() {
  const {
    success,
    err = "",
    results,
  } = await new Promise((resolve, reject) => {
    let options = {
      pythonPath: "/Users/jineshmehta/miniforge3/bin/python3",
    };
    PythonShell.run(
      `bypass/byPassCaptcha.py`,
      options,
      function (err, results) {
        if (err) {
          reject({ success: false, err });
        }
        resolve({ success: true, results });
      }
    );
  });
}

async function scrapePageContent() {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: [
      "--remote-debugging-port=9222",
      "--user-data-dir=/Users/jineshmehta/Documents/chromedriver",
    ],
  });
  // open a new page
  const page = await browser.newPage();
  // open url
  await page.goto(url, { waitUntil: "networkidle2" });
  // remove the default page opened by puppeteer
  let pages = await browser.pages();
  const old_page = await pages[0];
  await old_page.close();
  // wait for the page to load
  await page.waitForSelector("#l_Dh-a-32 > span > span.ColIconText");
  // click on schedule road test
  await page.click("#l_Dh-a-32 > span > span.ColIconText");
  // wait for the page to load
  await page.waitForSelector("#caption2_Dd-j > span.IconCaptionText");
  await page.waitForTimeout(1000);
  // click on the no mass license button
  await page.click("#caption2_Dd-j > span.IconCaptionText");
  // wait for the page to load
  await page.waitForSelector("#caption2_Dd-c");
  await page.waitForSelector("#Dd-9");
  await page.waitForTimeout(1000);
  // Enter DOB
  await page.focus("#Dd-9");
  await page.keyboard.type(config.DOB);
  await page.waitForTimeout(1000);
  // SSN
  await page.focus("#Dd-c");
  await page.keyboard.type(config.SSN);
  await page.waitForTimeout(1000);
  // Last Name
  await page.focus("#Dd-a");
  await page.keyboard.type(config.LastName);
  await page.waitForTimeout(1000);
  // Zip Code
  await page.focus("#Dd-f");
  await page.keyboard.type(config.ZipCode);
  await page.waitForTimeout(2000);

  await bypass();

  await page.waitForTimeout(3000);
  await page.waitForSelector("#action_1");
  await page.click("#action_1");

  await page.waitForTimeout(1000);
  await page.waitForSelector("#action_5");
  await page.click("#action_5");

  await page.waitForTimeout(1000);
  await page.click("#ic_Dp-9-1 > label");

  await page.waitForTimeout(1000);
  await page.waitForSelector(
    "#Dp-l > div > label.FastComboButtonItem.FastComboButtonItem_RESCHED.FastComboButton.FRC"
  );
  await page.click(
    "#Dp-l > div > label.FastComboButtonItem.FastComboButtonItem_RESCHED.FastComboButton.FRC"
  );

  await page.waitForTimeout(1000);
  await page.click("#cl_Dp-y");

  await browser.close();
}

scrapePageContent();
