// @ts-ignore
import express, {Request, Response, Router, json, Application} from '@swizzyweb/express';
import path from 'path';
import { IWebService } from '@swizzyweb/swizzy-web-service';
import { BrowserLogger, ILogger } from '@swizzyweb/swizzy-common';
import { npmInstall, npmLinkInstall } from '../npm-installer';
import { validatePackageName } from '../npm-installer';
import { AppAttachMode, IDynServeBaseRunRequestBody, IDynServeWebServiceRunRequestBody } from '../model/run-request-body';
import { inspect } from 'util';
const logger: ILogger = new BrowserLogger();

export const router = Router({});
const BASE_PATH = '/v1/webservice';
const FILE_NAME = "app.js";
// middleware that is specific to this router
const timeLog = (req: Request, res: Response, next: ()=>void) => {
  logger.log(`Time: ${new Date().toUTCString()}`);
  next()
}

router.use(timeLog);
router.use(json());

const runningServices: any = {}; //Map<string, IWebService> = new Map<string, IWebService>();
const appPorts: any = {};

interface InstallParams {
  toolName: string;
  toolUrl: string;
}

const PACKAGE_NAME_REGEX = new RegExp('.*web-service(@.*){0,1}$');


function validateServiceName(serviceName: string) {
	validatePackageName(serviceName);
	
	if (!serviceName || !PACKAGE_NAME_REGEX.test(serviceName)) {
		throw new Error(`Invalid service package name provided, service package names must end in 'web-service', packageName: ${serviceName}`);
	}
}

function serviceNameValidationMiddleware(req: Request, res: Response, next: any) {
	const {serviceName} = req.query;
	try {
  	validatePackageName(serviceName as string);
	validateServiceName(serviceName as string);
  	logger.info(`serviceName validated `);
  } catch(e) {
	logger.error(`Invalid package name when attempting to run exception: ${e}`);
	res.status(403).json({message: 'Invalid package name',
	hint: 'Service package names must be valid npm packages and end in "web-service" (or "web-service@version")'});
	return;
  }
  	req.user = req.user??{};
	req.user.serviceName = serviceName;
	next();
}


// define the home page route
router.post(`${BASE_PATH}/install`, serviceNameValidationMiddleware, async (req: Request, res: Response) => {
    // Use link since we are using local packages
    const { serviceName } = req.user;
      logger.info(`Request to install service: ${serviceName}`);
  /*try {
  	validatePackageName(serviceName as string);
  	logger.info(`serviceName validated`);
  } catch(e) {
	logger.error(`Invalid package name when attempting to install exception: ${e}`);
	res.status(403).json({
		message: 'Invalid package name provided'
	});
	return;
  }*/
    try {
      //await npmLinkInstall({packageName: serviceName});
		//
      	const result = await npmInstall({packageName: serviceName });
		if (!result.success) {
			throw new Error(`Install service ${serviceName} failed`);
		}
		logger.info(`Successfully installed package ${serviceName}`);
      res.status(200).json({
		message: 'Successfully installed service package'
	  });
return;
    } catch(e) {
      logger.error(`Error occurred installing npm package ${serviceName} with exception ${e}`);
      res.status(500).json({
		message: 'Internal server error occurred while installing the requested service package'
	  });
    }
});

// With NPM
router.post(`${BASE_PATH}/run`, serviceNameValidationMiddleware, async (req: Request, res: Response) => {
  const {serviceName} = req.user;

  logger.info(`Request to run service: ${serviceName}`);
  
  try {
  	logger.info(`Body ${req.body}`);
  	  const runArgs: IDynServeWebServiceRunRequestBody<any>= req.body;/*??{
  	expressConfiguration: {
		app: {
  			attachMode: AppAttachMode.parentApp,
  		}
	},
	serviceArgs: {}
  };*/
// TODO: Validate request
  if (!runArgs.serviceArgs) {
    runArgs.serviceArgs = {}
  }
  runArgs.serviceArgs.packageName = serviceName;
  
  logger.info(`${JSON.stringify(runArgs)}`);
  // TODO: validate
    // const toolPath = path.join(`${WEB_SERVICE_LOCAL_REPO_PATH}/${toolName}/${FILE_NAME}`);
    // logger.info(`Toolpath to require: ${toolPath}`);
    // const tool = require(`../../local/repo/services/MyFirstWebService/app.js`);
    // const toolPath = path.join(`../../local/repo/services/${toolName}/${FILE_NAME}`);
    const tool = require(serviceName as string);
	const port = runArgs.expressConfiguration?.app.port;
	
	const appPortsContainsApp = appPorts[`${port}`];
	if (Object.keys(appPortsContainsApp?.services??{}).includes(serviceName)) {
		logger.warn(`${serviceName} already running on port ${port}... Will not run again`);
		res.status(409).json(`Service is already running on that port, provide a new port to run another instance of the service`);
		return;
	};
	const newApp = appPorts[`${port}`] ? appPorts[`${port}`].app : undefined;
	const serviceApp = newApp ? newApp : port ? express() : req.app;//.//runArgs?.expressConfiguration?.app?.attachMode === AppAttachMode.parentApp ? req.app : undefined;

	logger.info(`App in controller: ${req.app}`);
    let webService = tool.getWebservice({...(runArgs?.serviceArgs??{}), app: serviceApp, logger, port: runArgs?.expressConfiguration?.app?.port, serviceArgs: runArgs.serviceArgs, packageName: serviceName });
    await webService.install({}/*{app: req.app, logger}*/);
	
	storeWebService(serviceApp, serviceName, webService, port);
	// tool.install({app: req.app});
    logger.info(`Started running service: ${serviceName}`);
  } catch(e) {
	  console.log(e)
    logger.error(`Error running service: ${serviceName}, e: ${JSON.stringify(e)}`);
    res.status(500).json({message: "Server error while attempting to run the service"});
	return;
  }
  
  res.status(200).json({message: "Successfully started service"});
});

function storeWebService(app: Application, serviceName: string, webService: IWebService, port?: number) {
	const newApp = !appPorts[`${port}`];
	if (newApp) {
		appPorts[`${port}`] = {
			app,
			services: {}
		};
		const server = app.listen(port, () => {
			logger.info(`Started ${webService.name} running on port ${port}`);
		});
		appPorts[`${port}`].server = server;
		appPorts[`${port}`].services[serviceName] = {
				service: webService
			};
	} else {
			appPorts[`${port}`].services[serviceName] = {
				service: webService
		}
	}

				
		runningServices[serviceName as string] = webService;

}
function storeWebService2(app: Application, serviceName: string, webService: IWebService, port?: number) {
	const newApp = !!appPorts[`${port}`];
	if (!appPorts[`${port}`]) {
		appPorts[`${port}`] = {
			app,
			services: {}
		};
	}

	if (!appPorts[`${port}`].services[`${serviceName}`]) {
		appPorts[`${port}`].services[`${serviceName}`] = {
			servives: {}
		}
	}
	
	if(!newApp) {
		const server = app.listen(port, () => {
			logger.info(`Started ${webService.name} running on port ${port}`);
		});
		appPorts[`${port}`].server = server;
		appPorts[`${port}`].services[serviceName].services[webService.name] = webService;
		} else {
			appPorts[`${port}`].services[serviceName].services[webService.name] = {
				webService
			}
		}
		if (!runningServices[serviceName as string]) {
			runningServices[serviceName as string] = {services: []};
		}
		runningServices[serviceName as string].services[webService.name] = webService;
}

router.post(`${BASE_PATH}/stop`, serviceNameValidationMiddleware, async (req: Request, res: Response) => {
  const {serviceName} = req.user;
  logger.info(`Request to stop running tool: ${serviceName}`);
  /*try {
  	validatePackageName(serviceName as string);
  	logger.info(`ToolName validated`);
  } catch(e) {
	logger.error(`Invalid package name when attempting to stop exception: ${e}`);
	res.status(403).send();
	return;
  } */

  try {
	const port = req.body?.expressConfiguration?.app?.port;
    if(!appPorts[`${port}`] || !appPorts[`${port}`]?.services[serviceName]) {
      logger.error(`Unable to stop running service ${serviceName} on port ${port} as it is not in available services`);
      res.status(404).json({message: 'Service is not running'});
      return;
    }
    // const toolPath = path.join(`../../local/repo/services/${toolName}/${FILE_NAME}`);
    const webService = appPorts[`${port}`].services[serviceName].service!;
    //logger.info(`Routes: ${req.app}`);
    await webService.uninstall({}/*{app: req.app}*/);
	delete runningServices[serviceName as string];
	delete appPorts[`${port}`].services[serviceName];
	if (port && Object.keys(appPorts[`${port}`].services).length === 0) {
		logger.info(`closing server for ${serviceName} on port ${port}`);
		appPorts[`${port}`].server.close();
		delete appPorts[`${port}`];
	}
    delete require.cache[require.resolve(serviceName as string)];
    // TODO: Should we do NPM uninstall during this step? Maybe an uninstall controller makes sense.
    logger.info(`Stopped running tool: ${serviceName}`);
  } catch(e) {
    logger.error(`Error stopping service: ${serviceName}, e: ${e}`);
    res.status(500).json({message: "Internal server error while attempting to stop service"});
	return;
  }
  
  res.status(200).json({message: 'Successfully stopped service'});
});

router.get(`${BASE_PATH}/running/list`, (req: Request, res: Response) => {
	logger.info("Listing web services");
	logger.debug(`Web services: ${inspect(appPorts)}`);
  res.status(200).json(appPortsToRunningList(appPorts));
});

function appPortsToRunningList(appPorts: any) {
  const results: any = {}
  for (const entry of Object.entries(appPorts)) {
    let port = entry[0];
    if (!port || port === 'undefined') {
      port = "parent";
    }
    const val: any = entry[1];
    results[port] = {services: servicesToRunningList(val.services)};
  }

return results;
}

function servicesToRunningList(services: any) {
  const outServices: any = {};
  for (const serviceEntry of Object.entries(services)) {
    const serviceName: string = serviceEntry[0];
    outServices[serviceName] = serviceToRunningListDetails(serviceEntry[1]);
  }

  return outServices;
}

function serviceToRunningListDetails(service: any) {
  const output = {};

  return output;
}
