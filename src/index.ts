import axios, { isAxiosError } from 'axios';
import { getInput, setFailed, setOutput, info as coreInfo, error as coreError } from "@actions/core";
import { mkdirP } from "@actions/io";
import { appendFile, exists, writeFile, stat, existsSync, readFileSync } from "fs";
import { dirname, join as joinPath, resolve as resolvePath } from "path";
import { promisify } from "util";

const appendFileAsync = promisify(appendFile);
const existsAsync = promisify(exists);
const writeFileAsync = promisify(writeFile);
const statAsync = promisify(stat);

main().catch((err) => setFailed(err.message));

async function validateSubscription(): Promise<void> {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  let repoPrivate: boolean | undefined;

  if (eventPath && existsSync(eventPath)) {
    const eventData = JSON.parse(readFileSync(eventPath, "utf8"));
    repoPrivate = eventData?.repository?.private;
  }

  const upstream = 'damianreeves/write-file-action';
  const action = process.env.GITHUB_ACTION_REPOSITORY;
  const docsUrl = 'https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions';

  coreInfo('');
  coreInfo('\u001b[1;36mStepSecurity Maintained Action\u001b[0m');
  coreInfo(`Secure drop-in replacement for ${upstream}`);
  if (repoPrivate === false) coreInfo('\u001b[32m\u2713 Free for public repositories\u001b[0m');
  coreInfo(`\u001b[36mLearn more:\u001b[0m ${docsUrl}`);
  coreInfo('');

  if (repoPrivate === false) return;

  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
  const body: Record<string, string> = { action: action || '' };
  if (serverUrl !== 'https://github.com') body.ghes_server = serverUrl;
  try {
    await axios.post(
      `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/maintained-actions-subscription`,
      body, { timeout: 3000 }
    );
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) {
      coreError('\u001b[1;31mThis action requires a StepSecurity subscription for private repositories.\u001b[0m');
      coreError(`\u001b[31mLearn how to enable a subscription: ${docsUrl}\u001b[0m`);
      process.exit(1);
    }
    coreInfo('Timeout or API not reachable. Continuing to next step.');
  }
}

async function main() {
  await validateSubscription();
  try {
    const path = getInput("path", { required: true });
    const contents = getInput("contents", { required: true });
    const mode = (getInput("write-mode") || "append").toLocaleLowerCase();

    // Ensure the correct mode is specified
    if (mode !== "append" && mode !== "overwrite" && mode !== "preserve") {
      setFailed("Mode must be one of: overwrite, append, or preserve");
      return;
    }

    // Preserve the file
    if (mode === "preserve" && (await existsAsync(path))) {
      const statResult = await statAsync(path);
      setOutput("size", `${statResult.size}`);
      return;
    }

    const targetDir = dirname(path);

    await mkdirP(targetDir);

    if (mode === "overwrite") {
      await writeFileAsync(path, contents);
    } else {
      await appendFileAsync(path, contents);
    }

    const statResult = await statAsync(path);
    setOutput("size", `${statResult.size}`);
  } catch (err) {
    setFailed((err as Error).message);
  }
}
