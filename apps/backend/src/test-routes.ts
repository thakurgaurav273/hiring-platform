import app from './app';

function printRoutes(app: any) {
  const routes: any[] = [];
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) { // routes registered directly on the app
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') { // router middleware 
      middleware.handle.stack.forEach((handler: any) => {
        let route;
        route = handler.route;
        if (route) {
            routes.push({
            path: middleware.regexp.toString().replace('/^\\/', '/').replace('\\/?(?=\\/|$)/i', '') + route.path,
            methods: Object.keys(route.methods)
            });
        }
      });
    }
  });
  console.log(JSON.stringify(routes, null, 2));
}

printRoutes(app);
