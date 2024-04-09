const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { mybatisDupliCheck } = require('./config/dbInfo');
const cors = require('cors');
const app = express();
const PreInterceptor = require('./middleware/PreInterceptor');
const PostInterceptor = require('./middleware/PostInterceptor');
// app.use(cors({ credentials: true, origin: 'https://localhost:3101' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));

app.use(cookieParser());

app.use(express.json());

app.get('/health', (req, res)=>{
  res.send('ok');
})


if(process.env.SYSTEM === 'local'){
  app.use('/storage', express.static('storage'))
}else {
  // TODO: NAS 경로 관리?
  app.use('/storage', express.static(`/data/${process.env.SYSTEM}_sogul_admin`))
}

// namespace 체크
mybatisDupliCheck();

const myLogger = function (req, res, next) {
  console.log('LOGGERD');
  next();
};

app.use(myLogger);

/** 전처리 interceptor */
app.use(PreInterceptor);
app.use(PostInterceptor);
require('./routes/index')(app);

app.use(bodyParser.json()); // body-parser 사용

// error handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`);
});
