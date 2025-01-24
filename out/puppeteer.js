"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer = require("puppeteer-core");
const vscode = require("vscode");
const fs = require("fs").promises;
const path = require("path");
async function fetchAndSaveTestCases(url) {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: "domcontentloaded" });
        await page.waitForSelector(".elfjS", { timeout: 5000 });
        const content = await page.evaluate(() => {
            const element = document.querySelector(".elfjS");
            return element ? element.innerText : "Element not found";
        });
        console.log("Content of .elfjS:", content);
        const inputRegex = /Input:\s*(.*?)(?=Output:|$)/gs;
        const outputRegex = /Output:\s*(.*?)(?=Explanation:|Example|Constraints:|$)/gs;
        const inputs = [];
        const outputs = [];
        let match;
        while ((match = inputRegex.exec(content)) !== null) {
            inputs.push(cleanData(match[1].trim()));
        }
        while ((match = outputRegex.exec(content)) !== null) {
            outputs.push(cleanData(match[1].trim()));
        }
        if (inputs.length === 0 || outputs.length === 0) {
            throw new Error("Failed to extract inputs or outputs");
        }
        const dirPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!dirPath) {
            vscode.window.showErrorMessage("Please open a folder in VS Code");
            return;
        }
        const inputFilePath = path.join(dirPath, "input.txt");
        const outputFilePath = path.join(dirPath, "output.txt");
        await fs.writeFile(inputFilePath, inputs.join("\n"), "utf8");
        await fs.writeFile(outputFilePath, outputs.join("\n"), "utf8");
        console.log("Test cases saved successfully");
    }
    catch (error) {
        console.error("Error fetching test cases:", error);
        throw error;
    }
    finally {
        await browser.close();
    }
}
function cleanData(data) {
    return data.replace(/\s+/g, " ").trim();
}
//# sourceMappingURL=puppeteer.js.map