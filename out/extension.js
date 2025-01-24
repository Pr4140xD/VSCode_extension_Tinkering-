"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const puppeteer = __importStar(require("puppeteer-core"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
function activate(context) {
    const disposable = vscode.commands.registerCommand("goateddrugs.fetchTestCases", async () => {
        const url = await vscode.window.showInputBox({
            prompt: "Enter the URL to scrape test cases from",
        });
        if (!url) {
            vscode.window.showErrorMessage("No URL provided");
            return;
        }
        try {
            await fetchAndSaveTestCases(url);
            vscode.window.showInformationMessage("Test cases saved successfully!");
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Error: ${errorMessage}`);
        }
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
async function fetchAndSaveTestCases(url) {
    console.log(url);
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        channel: "chrome"
    });
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: "domcontentloaded" });
        await page.waitForSelector(".elfjS", { timeout: 5000 });
        const content = await page.evaluate(() => {
            const element = document.querySelector(".elfjS");
            return element ? element.innerText : "Element not found";
        });
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
        console.log(inputs);
        const dirPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        console.log(dirPath);
        if (!dirPath) {
            vscode.window.showErrorMessage("Please open a folder in VS Code");
            return;
        }
        const inputFilePath = path.join(dirPath, "input.txt");
        const outputFilePath = path.join(dirPath, "output.txt");
        console.log(inputFilePath);
        await fs.writeFile(inputFilePath, inputs.join("\n"), "utf8");
        await fs.writeFile(outputFilePath, outputs.join("\n"), "utf8");
    }
    catch (error) {
        throw new Error("Error fetching test cases: " + error);
    }
    finally {
        await browser.close();
    }
}
// async function fetchAndSaveTestCases(url: string) {
//     console.log(`Starting fetch for URL: ${url}`);
//     const browser = await puppeteer.launch({
//         headless: false,
//         defaultViewport: null,
//     });
//     const page = await browser.newPage();
//     try {
//         console.log("Navigating to the URL...");
//         await page.goto(url, { waitUntil: "domcontentloaded" });
//         console.log("Page loaded successfully.");
//         console.log("Waiting for the selector...");
//         await page.waitForSelector(".elfjS", { timeout: 5000 });
//         console.log("Selector found.");
//         console.log("Extracting content...");
//         const content = await page.evaluate(() => {
//             const element = document.querySelector(".elfjS");
//             return (element as HTMLElement) ? (element as HTMLElement).innerText : "Element not found";
//         });
//         console.log("Content extracted:", content);
//         // Add your input/output regex parsing here as it is in your code...
//     } catch (error: unknown) {
//         console.error("An error occurred during Puppeteer operations:");
//         console.error(error); // Log the entire error object
//         throw new Error(`Error during Puppeteer operations: ${error instanceof Error ? error.message : String(error)}`);
//     } finally {
//         await browser.close();
//         console.log("Browser closed.");
//     }
// }
function cleanData(data) {
    return data.replace(/\s+/g, " ").trim();
}
//# sourceMappingURL=extension.js.map