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
exports.runTestCases = runTestCases;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const vscode = __importStar(require("vscode"));
async function runCommand(command) {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(command, (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error.message);
            }
            else {
                resolve(stdout.trim());
            }
        });
    });
}
async function runTestCases(filePath, language) {
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
            }
            else {
                vscode.window.showErrorMessage(`Test case ${i + 1}: Failed ❌\nExpected:\n${expectedOutput}\nGot:\n${actualOutput}`);
            }
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Error running test cases: ${error}`);
    }
}
//# sourceMappingURL=runTestCases.js.map