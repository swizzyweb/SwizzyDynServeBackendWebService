import axios from 'axios';
// @ts-ignore
import {Request, Response, Router, json} from '@swizzyweb/express'; 
import { fstat, write } from 'fs';
import { mkdir, open, writeFile } from 'fs/promises';
import path from 'path';
import { IWebService } from '@swizzyweb/swizzy-web-service';
import { BrowserLogger, ILogger } from '@swizzyweb/swizzy-common';

const WEB_SERVICE_LOCAL_REPO_PATH = path.join("./","local/repo/services");
const logger: ILogger = new BrowserLogger();

export const router = Router({});
const BASE_PATH = '/v1/manage';
const FILE_NAME = "app.js";
// middleware that is specific to this router
const timeLog = (req: Request, res: Response, next: ()=>void) => {
  console.log('Time: ', Date.now())
  next()
}

router.use(timeLog);
router.use(json());

interface InstallParams {
  toolName: string;
  toolUrl: string;
}

// define the home page route
router.post(`${BASE_PATH}/download`, async (req: Request, res: Response) => {
  const {toolUrl, toolName} = req.body;
  logger.info("Request to install webservice")
  try {
    const result = await axios.get(toolUrl);
    if(result.status != 200) {
      logger.error(`Invalid response when attempting to install tool: ${toolName} from toolUrl: ${toolUrl}`);
      res.status(500).end();
      return;
    }
    await writeWebServiceToRepo(toolName, result.data);
  } catch(e) {
    logger.error(`Error downloading tool: ${toolName} with exception: ${e}`);
    res.status(500).send();
    return;
  }
  
  res.status(200).json({
    message: "Web service packages successfully downloaded"
  });
});

async function writeWebServiceToRepo(toolName: string, content: string) {
  let slash = "";
  if(!toolName.startsWith("/")) {
    slash = "/";
  }

  const filePath = path.join(`${WEB_SERVICE_LOCAL_REPO_PATH}${slash}${toolName}`);
  // TODO: Check if directory already exists to prevent error.
  try {
    await mkdir(filePath);
  } catch(e) {
    logger.error(`Error attempting to create directory for tool: ${toolName} with filePath: ${filePath}\nError: ${e}`);
  }

  // TODO: What do we do if the file already exists (currently overwriting)
  const fullFilePath = path.join(`${filePath}/${FILE_NAME}`);
  try {
    // TODO: this is broken for when file already exists.
    await writeFile(fullFilePath, content, {
      mode: 0o777
    });
    logger.info(`Wrote file for tool: ${toolName} to ${fullFilePath}`);
  } catch(e) {
    logger.error(`Error attempting to write file for tool: ${toolName} with filePath: ${fullFilePath}\nError: ${e}`);
    throw e;
  }
  // const fd = open(filePath, 'w');
  // write(fd, Buffer.from(content));
}


const runningServices: Map<string, IWebService> = new Map();

// define the about route
router.post('/run', async (req: Request, res: Response) => {
  const {toolName} = req.query;
  logger.info(`Request to run tool: ${toolName}`);
  try {
    // const toolPath = path.join(`${WEB_SERVICE_LOCAL_REPO_PATH}/${toolName}/${FILE_NAME}`);
    // logger.info(`Toolpath to require: ${toolPath}`);
    // const tool = require(`../../local/repo/services/MyFirstWebService/app.js`);
    const toolPath = path.join(`../../local/repo/services/${toolName}/${FILE_NAME}`);
    const tool = require(toolPath);
    let webService = tool.getWebservice();
    await webService.install({app: req.app, logger});
    runningServices.set(toolName as string, webService);
    // tool.install({app: req.app});
    logger.info(`Installed tool: ${toolName} from path: ${toolPath}`);
  } catch(e) {
    logger.error(`Error running service: ${toolName}, e: ${e}`);
    res.status(500).send();
  }
  
  res.status(200).send();
});

router.post('/stop', async (req: Request, res: Response) => {
  const {toolName} = req.query;
  logger.info(`Request to run tool: ${toolName}`);
  try {

    if(!runningServices.has(toolName as string)) {
      logger.error(`Unable to stop service ${toolName} as it is not in available services`);
      res.status(404).send();
      return;
    }
    const toolPath = path.join(`../../local/repo/services/${toolName}/${FILE_NAME}`);
    const webService = runningServices.get(toolName as string)!;
    logger.info(`Routes: ${req.app}`);
    await webService.uninstall({app: req.app});
    runningServices.delete(toolName as string);
    delete require.cache[require.resolve(toolPath)];
    // tool.install({app: req.app});
    logger.info(`Uninstalled tool: ${toolName}`);
  } catch(e) {
    logger.error(`Error stopping service: ${toolName}, e: ${e}`);
    res.status(500).send();
  }
  
  res.status(200).send();
});

router.get('/available/services', (req: Request, res: Response) => {
  res.status(200).json({services: runningServices});
});


// With NPM
router.post('/runNpm', async (req: Request, res: Response) => {
  const {toolName} = req.query;
  logger.info(`Request to run tool: ${toolName}`);
  try {
    // const toolPath = path.join(`${WEB_SERVICE_LOCAL_REPO_PATH}/${toolName}/${FILE_NAME}`);
    // logger.info(`Toolpath to require: ${toolPath}`);
    // const tool = require(`../../local/repo/services/MyFirstWebService/app.js`);
    // const toolPath = path.join(`../../local/repo/services/${toolName}/${FILE_NAME}`);
    const tool = require(toolName as string);
    let webService = tool.getWebservice();
    await webService.install({app: req.app, logger});
    runningServices.set(toolName as string, webService);
    // tool.install({app: req.app});
    logger.info(`Installed tool: ${toolName}`);
  } catch(e) {
    logger.error(`Error running service: ${toolName}, e: ${e}`);
    res.status(500).send();
  }
  
  res.status(200).send();
});
