// import libaries
import puppeteer from "puppeteer";
import fetch from "node-fetch";
import fs from "fs";
import { exit } from "process";
var config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

import { PythonShell } from "python-shell";

// take the URL from command-line arguments
const url = process.argv[2];
if (!url) {
  throw "Please provide a URL as the first argument";
  exit(1);
}

async function audioTranslate(page) {
  while (true) {
    href = page.find_element_by_id("audio-source").get_attribute("src");
    response = requests.get(href, (stream = True));
    saveFile(response, filename);
    response = audioToText(os.getcwd() + "/" + filename);
    print(response);

    inputbtn = driver.find_element_by_id("audio-response");
    inputbtn.send_keys(response);
    inputbtn.send_keys(Keys.ENTER);

    time.sleep(2);
    errorMsg = driver.find_elements_by_class_name(
      "rc-audiochallenge-error-message"
    )[0];

    if (
      errorMsg.text == "" ||
      errorMsg.value_of_css_property("display") == "none"
    ) {
      print("Success");
      break;
    }
  }
}

async function solverCaptchaAudio(page) {
  try {
    audioTranslate(page);
  } catch (err) {
    throw err;
  }
}

async function captchaSolver(page) {
  console.log("Try clicking the frame");
  await page.waitForSelector("iframe");
  const frame = await page.frames().find((f) => f.name().startsWith("a-"));
  await frame.waitForSelector("div.recaptcha-checkbox-border");
  await frame.click("div.recaptcha-checkbox-border");
  console.log("Clicked the captcha frame");
  console.log("Checking if the captcha is solved");
  const iframeArray = await page.$$("iframe");
  const elementHandle = iframeArray[3];
  if (!elementHandle) {
    return;
  }
  const newFrame = await elementHandle.contentFrame();
  const audioButton = await newFrame.$("#recaptcha-audio-button");
  if (!audioButton) {
    console.log("No audio button came up (either solved or need to retry)");
    return;
  }
  await audioButton.click();
  console.log("Captcha is not solved");
  console.log("Trying to solve the captcha");
  await solverCaptchaAudio(page);
}

async function scrapePageContent() {
  let browser = null;
  try {
    console.log("Opening browser...");
    browser = await puppeteer.launch({
      headless: false,
      args: [
        "--disable-web-security",
        "--disable-features=IsolateOrigins",
        "--disable-site-isolation-trials",
      ],
    });
    // open a new page
    console.log("Opening new tab...");
    const page = await browser.newPage();
    await page.setBypassCSP(true);
    console.log("Opening rmv page...");
    // open url
    await page.goto(url, { waitUntil: "networkidle2" });

    // remove the default page opened by puppeteer
    let pages = await browser.pages();
    const old_page = await pages[0];
    await old_page.close();
    console.log("Closed unnecessary tab...");

    // check if the session was already triggered
    let currentContent = await page.content();
    if (currentContent.includes("Click Here to Start Over")) {
      // start over the session
      await page.click("#FAST_ROOT_MANAGER__ > div > a");
      console.log("Clicked restart session");
    }
    // Schedule road test
    await page.waitForSelector("#l_Dh-a-32 > span > span.ColIconText");
    await page.click("#l_Dh-a-33 > span > span.ColIconText");
    console.log("Clicked scheduled road test");
    // No mass license button
    await page.waitForTimeout(1000);
    await page.waitForSelector("#caption2_Dd-j > span.IconCaptionText");
    await page.click("#caption2_Dd-j > span.IconCaptionText");
    console.log("Clicked on no mass license option");

    // wait for the page to load
    await page.waitForSelector("#caption2_Dd-c");
    await page.waitForSelector("#Dd-9");
    await page.waitForTimeout(1000);

    // Enter DOB
    await page.type("#Dd-9", config.DOB);
    console.log("DOB entered");
    await page.waitForTimeout(1000);

    // Last Name
    await page.keyboard.press("Tab");
    await page.type("#Dd-a", config.LastName);
    console.log("Lastname entered");
    await page.waitForTimeout(1000);

    // SSN
    await page.keyboard.press("Tab");
    await page.type("#Dd-c", config.SSN);
    console.log("SSN entered");
    await page.waitForTimeout(1000);

    // Zip Code
    await page.keyboard.press("Tab");
    await page.type("#Dd-f", config.ZipCode);
    console.log("Zipcode entered");
    await page.waitForTimeout(1000);
    console.log("Data populated");

    //recaptcha solver
    while (true) {
      console.log("Trying Bypass by making python function call");
      await captchaSolver(page);
      console.log("Bypass python function call completed");
      await page.waitForTimeout(3000);
      await page.click("#action_1");
      console.log("Clicked next button");
      await page.waitForTimeout(3000);
      // check if the next button was successful
      let pageContent = await page.content();
      if (!pageContent.includes("Verification")) {
        console.log("Captcha is solved");
        break;
      }
      console.log("Retrying captcha solving");
    }

    // check for verify device
    await page.waitForTimeout(2000);
    let pageContent = await page.content();
    if (pageContent.includes("Trust")) {
      await page.click("#ic_Dc-c > label > div");
      await page.focus("#Dc-a");
      await page.keyboard.type(config.securityCode);
      console.log("Security code entered");
      await page.click("#action_2");
    } else {
      console.log("No security code needed");
    }
    await page.waitForTimeout(5000);
    await page.waitForSelector("#action_5");
    await page.click("#action_5");
    // pageContent = await page.content();
    // while (pageContent.includes("action_5")) {
    //   console.log("Clicked next button");
    //   await page.waitForTimeout(3000);
    //   pageContent = await page.content();
    // }

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
      currentMonthValue = await page.evaluate(
        (el) => el.textContent,
        currentMonthElement
      );
      await page.waitForTimeout(3000);
      await getDataForCurrMonth(page, "June 2022");
    }
    console.log("Everything done");
    await browser.close();
  } catch (err) {
    if (err.name === "TimeoutError") {
      config.port = String(Number.parseInt(config.port) + 1);
      console.log(`Updating config port to ${config.port}`);
      // convert JSON object to string
      const data = JSON.stringify(config);

      // write JSON string to a file
      fs.writeFile("config.json", data, (err) => {
        if (err) {
          throw err;
        }
        console.log("JSON data is saved.");
        process.exit();
      });
    }
    console.log(err);
    sendToSlack(err);
    browser && browser.close();
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
  data.length !== 0 &&
    sendToSlack(`Dates Available in ${currentMonthValue}: ${data.join(", ")}`);
}

async function sendToSlack(message) {
  if (!config.webhook) {
    return;
  }

  return fetch(config.webhook, {
    body: JSON.stringify({
      text: message.message,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

scrapePageContent();
