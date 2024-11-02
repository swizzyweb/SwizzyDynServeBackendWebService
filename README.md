# dyn-serve-backend-web-service

Dynamic web application service. This service provides the ability to install web services
and browser side tools dynamically on an express service.

## API
### WebService
bastPath: /v1/webservice

#### install
Installs a package from NPM
```
http://host:port/v1/webservice/install?serviceName=<npmPackageName>
body: {
    
}
```

## Management Portal
http://localhost:3005/
