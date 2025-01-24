import * as vscode from "vscode";
import * as puppeteer from "puppeteer-core";
import * as fs from "fs/promises";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
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
        } catch (error:unknown) {
			const errorMessage = error instanceof Error ? error.message : String(error);

            vscode.window.showErrorMessage(`Error: ${errorMessage}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

async function fetchAndSaveTestCases(url: string) {
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
            return (element as HTMLElement) ? (element as HTMLElement).innerText : "Element not found";
        });

        const inputRegex = /Input:\s*(.*?)(?=Output:|$)/gs;
        const outputRegex = /Output:\s*(.*?)(?=Explanation:|Example|Constraints:|$)/gs;

        const inputs: string[] = [];
        const outputs: string[] = [];

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
    } catch (error) {
        throw new Error("Error fetching test cases: " + error);
    } finally {
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


function cleanData(data: string): string {
    return data.replace(/\s+/g, " ").trim();
}