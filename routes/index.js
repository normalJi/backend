module.exports = (app) => {
  app.use('/', require('./userRouter'));
  app.use('/', require('./systemRouter'));
  app.use('/', require('./storeRouter'));
  app.use('/', require('./devRouter'));
  app.use('/', require('./investRouter'));
};
