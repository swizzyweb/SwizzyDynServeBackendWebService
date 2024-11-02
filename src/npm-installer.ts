import { exec } from "child_process";
import { BrowserLogger, ILogger } from "@swizzyweb/swizzy-common";

const logger: ILogger = new BrowserLogger();
const SLEEP_INTERVAL = 500;

export enum SaveOption {
	none = '--no-save',
	save = '--save',
	optional = '--save-optional',
	default = '--save-optional',
	dev = '--save-dev',
	prod = '--save-prod',
	peer = '--save-peer',
	bundle = '--save-bundle',

};

/*const SAVE_OPTIONS = new Map([
	none: '--no-save',
	save: '--save',
	optional: '--save-optional',
	default: '--no-save',
	dev: '--save-dev',
	prod: '--save-prod',
	peer: '--save-peer',
	bundle: '--save-bundle',

])

const SAVE_OPTIONS = {
	none: '--no-save',
	save: '--save',
	optional: '--save-optional',
	default: '--no-save',
	dev: '--save-dev',
	prod: '--save-prod',
	peer: '--save-peer',
	bundle: '--save-bundle',
};
*/

export interface INpmInstallProps {
    packageName: string;
	saveOption?: SaveOption;
}

export interface IInstallResult {
    success: boolean;
}
const LINK_COMMAND = "npm link ";
export async function npmLinkInstall(props: INpmInstallProps): Promise<IInstallResult> {
   const { packageName, saveOption } = props;
   const actualSaveOption = saveOption??SaveOption.default;

   validatePackageName(packageName);
   return await install(packageName, LINK_COMMAND, actualSaveOption);
}

const INSTALL_COMMAND = "npm install --registry http://localhost:4873 "; // TODO: should we save it?
export async function npmInstall(props: INpmInstallProps) {
    const { packageName, saveOption } = props;
	const actualSaveOption = saveOption??SaveOption.default;
	validatePackageName(packageName);
    return await install(packageName, INSTALL_COMMAND, actualSaveOption);
}

async function install(packageName: string, command: string, saveOption: SaveOption): Promise<IInstallResult> {
    let a = exec(`${command} ${saveOption} ${packageName}`, (err, stdout, stderr) => {
        if(err) {
            logger.error(`Error: ${err}`);
        }
        if(stdout) {
            logger.log(stdout);
        }
        if(stderr) {
            logger.error(stderr);
        }
    });

    while(a.exitCode == null) {
        console.log(`Still running, waiting ${SLEEP_INTERVAL} ms`);
        await sleep(SLEEP_INTERVAL);
    }

    console.log(a.exitCode);
    

    return Promise.resolve({success: a.exitCode === 0});
}

function sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

const PACKAGE_NAME_REGEX = new RegExp('^([@]*[a-zA-Z0-9-]+\/)?[a-zA-Z0-9-]+([a-zA-Z0-9-@.])+(?<!\.js)$');

export function validatePackageName(packageName: string) {	
	if(!packageName || !PACKAGE_NAME_REGEX.test(packageName)) {
		throw new Error(`Invalid package name provided, could be malicious! packageName: ${packageName}`);
	}
}
