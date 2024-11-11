// @ts-ignore
import { Application } from "@swizzyweb/express";
import { ILogger, getPackageJson } from '@swizzyweb/swizzy-common';
import { IRunProps, IRunResult, IWebService, WebService } from "@swizzyweb/swizzy-web-service";
// import { router } from "./routers/install-webservice-router";
import { router as webserviceRouter} from "./routers/install-webservice-npm-router";
import { router as toolRouter } from './routers/install-browser-tool-router';
export class SwizzyDynServeBackendWebService extends WebService {
    name = 'SwizzyDynServeBackendWebService';
    constructor(props: any) {
        super({...props, routers: [webserviceRouter, toolRouter]});
    }

    // TODO: remove and use base class impl
    /*protected installRouters(app: Application): Promise<any> {
        app.use(webserviceRouter);
		app.use(toolRouter);
        return Promise.resolve();
    }*/

    /*protected uninstallRouters(app: Application): Promise<any> {
        const logger = this._logger;
        logger.info(`Routes ${app?.routes()}`);
        return Promise.resolve();
    }*/
}

export function install(props: any): IWebService {
    return new SwizzyDynServeBackendWebService(props);
}


export interface ISwizzyDynServeWebServiceProps {
	app?: Application;
	port?: number;
	logger?: ILogger;
	basePath?: string;	
  packageName: string;
  serviceArgs: any;
};

export function getWebservice(props?: ISwizzyDynServeWebServiceProps): IWebService {
  const packageJson = getPackageJson(1);
  const packageName = packageJson.name;
	return new SwizzyDynServeBackendWebService({ ...props, packageName, ...props?.serviceArgs??{} });
};

export const routers = [webserviceRouter, toolRouter];

