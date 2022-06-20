// import the Puppeteer library and Python Library
import puppeteer from "puppeteer";
import { PythonShell } from "python-shell";
import fetch from "node-fetch";

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
  try {
    console.log("Opening browser...");
    const browser = await puppeteer.launch({
      headless: false,
      executablePath:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      args: [
        "--remote-debugging-port=9222",
        "--user-data-dir=./temp",
        "--no-sandbox",
      ],
    });
    console.log("Opening new tab...");
    // open a new page
    const page = await browser.newPage();
    console.log("Opening rmv page...");
    // open url
    await page.goto(url, { waitUntil: "networkidle2" });
    // remove the default page opened by puppeteer
    let pages = await browser.pages();
    const old_page = await pages[0];
    await old_page.close();
    console.log("Closed unnecessary tab...");
    let currentContent = await page.content();
    if (currentContent.includes("Click Here to Start Over")) {
      await page.click("#FAST_ROOT_MANAGER__ > div > a");
    }
    // wait for the page to load
    await page.waitForSelector("#l_Dh-a-32 > span > span.ColIconText");
    await page.waitForTimeout(2000);
    // click on schedule road test
    await page.click("#l_Dh-a-32 > span > span.ColIconText");
    console.log("Clicked scheduled road test");
    // wait for the page to load
    await page.waitForSelector("#caption2_Dd-j > span.IconCaptionText");
    await page.waitForTimeout(1000);
    // click on the no mass license button
    await page.click("#caption2_Dd-j > span.IconCaptionText");
    console.log("Clicked on no mass license option");
    // wait for the page to load
    await page.waitForSelector("#caption2_Dd-c");
    await page.waitForSelector("#Dd-9");
    await page.waitForTimeout(1000);
    // Enter DOB
    await page.focus("#Dd-9");
    await page.keyboard.type(config.DOB);
    console.log("DOB entered");
    await page.waitForTimeout(1000);
    // SSN
    await page.focus("#Dd-c");
    await page.keyboard.type(config.SSN);
    console.log("SSN entered");
    await page.waitForTimeout(1000);
    // Last Name
    await page.focus("#Dd-a");
    await page.keyboard.type(config.LastName);
    console.log("Lastname entered");
    await page.waitForTimeout(1000);
    // Zip Code
    await page.focus("#Dd-f");
    await page.keyboard.type(config.ZipCode);
    console.log("Zipcode entered");
    await page.waitForTimeout(2000);

    console.log("Trying Bypass");
    await bypass();
    console.log("Bypass completed");
    await page.waitForTimeout(3000);
    await page.waitForSelector("#action_1");
    await page.click("#action_1");
    console.log("Clicked next button");

    // check for verify device
    await page.waitForTimeout(2000);
    let pageContent = (await page.$("#Dc-a")) || "";
    if (pageContent !== "") {
      await page.click("#ic_Dc-c > label > div");
      await page.focus("#Dc-a");
      await page.keyboard.type(config.securityCode);
      console.log("Security code entered");
      await page.click("#action_2");
    } else {
      console.log("No security code needed");
    }
    await page.waitForTimeout(3000);
    await page.waitForSelector("#action_5");
    await page.click("#action_5");
    console.log("Clicked next button");

    await page.waitForTimeout(3000);
    await page.waitForSelector("#ic_Dp-9-1 > label");
    await page.click("#ic_Dp-9-1 > label");
    console.log("Clicked class d button");

    await page.waitForTimeout(3000);
    await page.waitForSelector(
      "#Dp-l > div > label.FastComboButtonItem.FastComboButtonItem_RESCHED.FastComboButton.FRC > span"
    );
    await page.click(
      "#Dp-l > div > label.FastComboButtonItem.FastComboButtonItem_RESCHED.FastComboButton.FRC > span"
    );
    console.log("Clicked reschedule choice");

    await page.waitForTimeout(3000);
    await page.click("#cl_Dp-y");
    console.log("Clicked schedule button");

    await page.waitForTimeout(2000);
    await page.waitForSelector("#caption2_Dc_1-q");
    console.log("Trying to fetch month name");
    let currentMonthElement = await page.$("#caption2_Dc_1-q");
    let currentMonthValue = await page.evaluate(
      (el) => el.textContent,
      currentMonthElement
    );
    await getDataForCurrMonth(page, currentMonthValue);
    if (currentMonthValue === "July 2022") {
      // click on June 2022
      await page.waitForTimeout(2000);
      await page.click("#caption2_Dc_1-p");
      currentMonthElement = await page.$("#caption2_Dc_1-q");
      await page.waitForTimeout(3000);
      await getDataForCurrMonth(page, currentMonthElement);
    }
    console.log("Everything done");
    await browser.close();
  } catch (err) {
    sendToSlack(err);
  }
}

async function getDataForCurrMonth(page, currentMonthValue) {
  const data = await page.evaluate(() => {
    const tableBody = document.querySelectorAll("#Dc_1-01 tbody td");
    const filteredElementDates = Array.from(tableBody).filter(
      (element) => element.style.backgroundColor === "rgb(203, 255, 204)"
    );
    return filteredElementDates.map((element) => element.textContent);
  });
  // push available slots to slack
  data &&
    sendToSlack(`Dates Available in ${currentMonthValue}: ${data.join(", ")}`);
}

async function sendToSlack(message) {
  if (!config.webhook) {
    return;
  }

  return fetch(config.webhook, {
    body: JSON.stringify({
      text: message,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

scrapePageContent();
