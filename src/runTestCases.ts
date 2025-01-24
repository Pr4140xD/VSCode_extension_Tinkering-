import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import * as vscode from "vscode";

async function runCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error.message);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

export async function runTestCases(filePath: string, language: string) {
    const settings = vscode.workspace.getConfiguration("cph.languages");
    const langConfig = settings[language];

    if (!langConfig) {
        vscode.window.showErrorMessage(`No configuration found for language: ${language}`);
        return;
    }

    const compileCommand = langConfig.compile.replace("{file}", filePath).replace("{output}", "output.exe");
    const runCommandTemplate = langConfig.run.replace("{file}", filePath).replace("{output}", "./output.exe");

    try {
        // Compile the code if required
        if (compileCommand) {
            await runCommand(compileCommand);
        }

        // Load test cases
        const testCaseDir = path.join(vscode.workspace.rootPath || "", "test_cases");
        const inputs = await fs.readdir(testCaseDir);
        const inputFiles = inputs.filter(file => file.startsWith("input_"));
        const outputFiles = inputs.filter(file => file.startsWith("output_"));

        for (let i = 0; i < inputFiles.length; i++) {
            const inputPath = path.join(testCaseDir, `input_${i + 1}.txt`);
            const expectedOutputPath = path.join(testCaseDir, `output_${i + 1}.txt`);

            const input = await fs.readFile(inputPath, "utf-8");
            const expectedOutput = await fs.readFile(expectedOutputPath, "utf-8");

            // Run the user's code
            const actualOutput = await runCommand(`${runCommandTemplate} < ${inputPath}`);

            // Compare outputs
            if (actualOutput.trim() === expectedOutput.trim()) {
                vscode.window.showInformationMessage(`Test case ${i + 1}: Passed ✅`);
            } else {
                vscode.window.showErrorMessage(
                    `Test case ${i + 1}: Failed ❌\nExpected:\n${expectedOutput}\nGot:\n${actualOutput}`
                );
            }
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Error running test cases: ${error}`);
    }
}
