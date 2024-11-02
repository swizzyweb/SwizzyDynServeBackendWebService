
export enum AppAttachMode {
	/**
		* Attach to parent express app
	*/
	parentApp,
	/**
		* Create new app instance for attachment
	*/
	newApp
}

export interface IExpressAppConfiguration {
	app: {
		attachMode: AppAttachMode,
		port?: number
	},
}

export interface IDynServeBaseRunRequestBody {
	expressConfiguration: IExpressAppConfiguration,
}

export interface IDynServeWebServiceRunRequestBody<T> extends IDynServeBaseRunRequestBody{
	serviceArgs: T
}
