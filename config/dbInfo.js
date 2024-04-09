const mysql = require('mysql2/promise');
const mybatisMapper = require('mybatis-mapper');
const {mapper_info} = require('../src/mapper/mybatis-config')
const db_info = require('../properties/'+process.env.SYSTEM);
const CustomeError = require('../errors/CustomError')
const logger = require('../logger/logger');
const common = require('../common/common');  
const util = require('../common/util');

let  pool = mysql.createPool(db_info);

/**
 * mybatis 에서 사용하는 mapper 파일 등록
 */
const creatMapper = async(mapperNm) => {
  let mapperPath = null;

  //Mapper Path 및 name을 확인합니다.
  for(let i=0 ; i < mapper_info.length ; i++){
      if( mapper_info[i].mapperNm == mapperNm){
          mapperPath = mapper_info[i].path;
      };
  };

  if( mapperPath == null ){
    logger.error(`[Database] ======> ${new CustomeError('MAPPER_NULL_ERROR', 1152)} `);
    
    return false;
  };

  mybatisMapper.createMapper(
    [mapperPath]
  );
}

module.exports = {
  // 서버 실행 시 mapper name 중복 체크
  mybatisDupliCheck: async function() {  
    let arr = mapper_info;
    for(var z=0 ; z<arr.length ; z++){
        for( var y=0 ; y<z ; y++){
            if(arr[z].mapperNm == arr[y].mapperNm){
              logger.error(`[Database] ======> ${new CustomeError('MAPPER_DUPL_ERROR', 1152)} `);              
              process.exit();
              break;
            };
        } ;
    };  
  },
  connection: async function() {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
      return connection;
    } catch(err) {
      switch (err.code) {
        case 'PROTOCOL_CONNECTION_LOST':
          logger.error(`[Database] ======> ${new CustomeError('DB_PROTOCOL_CONNECTION_LOST', 1152)} `);              
          
          break;
        case 'ER_CON_COUNT_ERROR':
          logger.error(`[Database] ======> ${new CustomeError('DB_ER_CON_COUNT_ERROR', 1152)} `);
          break;
        case 'ECONNREFUSED':
          logger.error(`[Database] ======> ${new CustomeError('DB_ECONNREFUSED', 1152)} `);
          break;
      }
    }
  },

  /** 
   * list 데이터
   * @param {string} nameSpace Mapper명
   * @param {string} sqlID 쿼리명
   * @param {any} params 파라미터
   */
  select: async function(nameSpace , sqlID, params){    
    return await executeQuery(this.connection, nameSpace , sqlID, params);
  },

  /** 
   * 단일 데이터 조회
   * @param {string} nameSpace Mapper명
   * @param {string} sqlID 쿼리명
   * @param {any} params 파라미터
   */
  single: async function(nameSpace , sqlID, params){    
    return await executeQuery(this.connection, nameSpace , sqlID, params, 'single');
  },

    /** 
   * TOTAL_CNT 조회 ( 쿼리 컬럼은 TOTAL_CNT 로 해야함. 안그러면 못불러옴)
   * @param {string} nameSpace Mapper명
   * @param {string} sqlID 쿼리명
   * @param {any} params 파라미터
   */
    totalCnt: async function(nameSpace , sqlID, params){    
      return await executeQuery(this.connection, nameSpace , sqlID, params, 'totalCnt');
    },

  /** 
   * 트랜잭션 없이 insert 사용할 모듈
   * @param {string} nameSpace Mapper명
   * @param {string} sqlID 쿼리명
   * @param {any} params 파라미터
   */
  insert: async function(nameSpace , sqlID, params){    
    return await executeQuery(this.connection, nameSpace , sqlID, params);
  },  

  /** 
   * 트랜잭션 없이 update 사용할 모듈
   * @param {string} nameSpace Mapper명
   * @param {string} sqlID 쿼리명
   * @param {any} params 파라미터
   */
  update: async function(nameSpace , sqlID, params){    
    return await executeQuery(this.connection, nameSpace , sqlID, params);
  }, 

  /** 
   * 트랜잭션 없이 delete 사용할 모듈
   * @param {string} nameSpace Mapper명
   * @param {string} sqlID 쿼리명
   * @param {any} params 파라미터
   */
  delete: async function(nameSpace , sqlID, params){    
    return await executeQuery(this.connection, nameSpace , sqlID, params);
  }, 

  /** 
   * 트랜잭션이 필요할때 사용할 모듈
   * @param {connection} connection Mapper명
   * @param {string} nameSpace Mapper명
   * @param {string} sqlID 쿼리명
   * @param {any} params 파라미터
   */
  transExec: async function(connection, nameSpace , sqlID, params) {    
    logger.info("transExec 시작");
    let rows;
    try {
      creatMapper(nameSpace);
      let query = mybatisMapper.getStatement(nameSpace, sqlID, params, {language: 'mysql', indent: '  '});
      logger.info(`[ ${sqlID} ] : \r\n${query}\r\n`);
      rows = await connection.query(query);
      logger.info(`[ REC ] : ${JSON.stringify(rows[0])}`);
      logger.info("transExec 종료");
      return rows[0];
    } catch (e) {
      logger.error("transExec 에러", e);
      throw e;
    }    
  }
}

const executeQuery = async(conn, nameSpace , sqlID, params, gubun) => {
  let rows;
  const connection = await conn(async (conn) => conn);
  creatMapper(nameSpace);
  let query = mybatisMapper.getStatement(nameSpace, sqlID, params, {language: 'mysql', indent: ' '});
  logger.info(`[ ${sqlID} ] : \r\n${query}\r\n`);   
  
  rows = await connection.query(query);
  
  logger.info(`[ REC ] : ${JSON.stringify(util.nullToStr(rows[0]))}`);
  connection.release();
  if( gubun === 'single' ) {
    rows = rows[0][0];
  } else if( gubun === 'totalCnt' ) {
    rows = rows[0][0].TOTAL_CNT;
  } else {
    rows = rows[0];
  }
  //rows = gubun === 'single' ? rows[0][0] : rows[0];
  return util.nullToStr(rows);
}
