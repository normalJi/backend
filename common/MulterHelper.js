const path = require('path');
const fs = require('fs');
const util = require('util');

const multer = require('multer');
const { v4: uuid } = require('uuid');

//TODO: 경로 옵션화

const getUploadPath = (subPath) =>{
  let dest = subPath;
  if (process.env.SYSTEM === 'local') {
    dest = path.join('./storage', dest || '');
  } else {
    //TODO: 서버 저장소 경로
    dest = path.join('/data', `${process.env.SYSTEM}_sogul_admin`, dest || '');
  }
  return dest;
}

const getRelativePath = (fullPath) =>{
  let relativePath;
  if (process.env.SYSTEM === 'local') {    
    relativePath = path.relative('./storage', fullPath);
  } else {
    //TODO: 서버 저장소 경로
    relativePath = path.relative(path.join('/data', `${process.env.SYSTEM}_sogul_admin`), fullPath);
  }
  return relativePath;
}

const NormalizedPathApiPath = '/storage'
const getNormalizedPath = (fullPath) =>{
  //TODO: 저장소가 여러 곳으로 분산될 경우?
  return `${NormalizedPathApiPath}/${getRelativePath(fullPath).replace(/\\/g, '/')}`;
}

const getPathFromNormalizedPath = (normalizedPath)=>{
  let path = normalizedPath;
  if(path.startsWith(NormalizedPathApiPath)){
    path = path.replace(NormalizedPathApiPath, '');
  }

  return getUploadPath(path);
}

/**
 * @typedef uploaderOptions uploader 사용시 추가 옵션
 * @property {boolean} emptyExtension 파일 저장시 확장자 없이 파일을 저장한다
 */
/**
 * multer 인스턴스 생성시 옵션을 SYSTEM 환경변수에 맞게 수정해 생성한다
 * - dest가 비워져 있을시 기본 tmp 폴더에 저장된다.
 * @param {multer.Options & uploaderOptions} options
 * @returns {multer.Multer}
 */
const uploader = ({dest, emptyExtension, ...options} = {}) => {
  dest = getUploadPath(dest || 'temp');

  options.storage = options.storage || multer.diskStorage({
    destination: function (req, file, cb) {
      if(!fs.existsSync(dest)){
        fs.mkdirSync(dest, { recursive: true});
      }
      cb(null, dest)
    },
    filename: function (req, file, cb) {
      const {filename, originalname} = file;
      let index = originalname.lastIndexOf('.');
      if(index < 0){
        cb(null, originalname);
        return;
      }

      //multer 1.4.5-lts.1, boybus utf-8 문제.... 지우면 한글파일이 깨짐.1.4
      file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
      
      if(emptyExtension){
        cb(null, uuid().replace(/-/g, ''));
      }else{        
        cb(null, `${uuid().replace(/-/g, '')}${originalname.substring(index)}`);
      }
    }
  });


  //TODO: 다른 옵션도 변경 필요시 추가

  return multer(options);
};

/**
 * normalizedPath 경로의 파일 삭제
 * @param {string} normalizedPath 
 */
const removeFile = (normalizedPath) => {
  const fullPath = getPathFromNormalizedPath(normalizedPath);
  if(!fs.existsSync(fullPath)){
    //이미 없는 파일...
    return;
  }
  fs.unlinkSync(fullPath);
}


/**
 * multer에 의해 req에 생성된 file 조작을 위한 클래스.
 */
class MulterFileHandler {  
  /** @type{ string } */
  #fieldname;
  /** @type{ string } */
  #originalname;
  /** @type{ string } */
  #encoding;
  /** @type{ string } */
  #mimetype;
  /** @type{ string } */
  #destination;
  /** @type{ string } */
  #filename;
  /** @type{ string } */
  #path;
  /** @type{ number } */
  #size;

  /** @type{ boolean } */
  #lock;
  /** @type{ string } */
  #normalizedPath;
  /** @type{ boolean } */
  #deleted;
  /** @type{ string } */
  #tempPath;

  constructor(file){    
    this.#fieldname = file.fieldname; 
    this.#originalname = file.originalname;
    this.#encoding = file.encoding;
    this.#mimetype = file.mimetype;
    this.#destination = file.destination;
    this.#filename = file.filename;
    this.#path = file.path;
    this.#size = file.size;
    this.#normalizedPath = getNormalizedPath(file.path);

    this.#lock = false;
    this.#deleted = false;
    this.#tempPath = null;
  }

  /**
   * 요청 field 명
   * @type { string }
   */
  get fieldname() { return this.#fieldname; }
  
  /**
   * 요청시 원본 파일명
   * @type { string }
   */
  get originalname() { return this.#originalname; }
  
  /**
   * 파일 인코딩값
   * @type { string }
   */
  get encoding() { return this.#encoding; }
  
  /**
   * 파일의 마임타입
   * @type { string }
   */
  get mimetype() { return this.#mimetype; }
  
  /**
   * 저장 폴더
   * @type { string }
   */
  get destination() { return this.#destination; }
  
  /**
   * 저장 파일명, (폴더 미포함)
   * @type { string }
   */
  get filename() { return this.#filename; }
  
  /**
   * 파일 전체 경로
   * @type { string }
   */
  get path() { return this.#path; }
  
  /**
   * 파일 크기
   * @type { number }
   */
  get size() { return this.#size; }
  
  /**
   * 정규화된 경로
   * db 저장용
   * @type { string }
   */
  get normalizedPath() { return this.#normalizedPath; }

  /**
   * 최초 저장된 경로, 실제 파일은 path 위치에 존재한다
   * 경로, 파일명을 수정했을시에만 값을 갖는다
   * @type { string? }
   */
  get tempPath() { return this.#tempPath; }
  
  /**
   * 조작 가능 여부
   * MulterFileListHandler 조작등에서 제외
   * lock = true로 지정되면 삭제나 이동에서 무시된다.
   * @type { boolean }
   */
  get lock() { return this.#lock; }  
  set lock(value) { this.#lock = value;}
  
  /**
   * 삭제되었는지 여부
   * @type { boolean }
   */
  get deleted() { return this.#deleted; }

  /**
   * true시 모든 메소드 호출이 무시된다
   * @type { boolean }
   */
  get ignore() { return this.#lock || this.#deleted; }

  #backupTempPath(){
    if(this.#tempPath) return this;
    this.#tempPath = this.#path;

    return this;
  }

  #changePath(destination, filename) {
    const newPath = path.resolve(destination, filename);
    fs.renameSync(this.#path, newPath);
    
    this.#backupTempPath();

    this.#destination = destination;
    this.#filename = filename;
    this.#path = newPath;
    this.#normalizedPath = getNormalizedPath(newPath);

    return this;
  }

  /**
   * 파일의 저장 디렉토리를 변경한다
   * @param {string} directory
   * @see changeFilename 파일명 변경시 사용
   */
  changeDirectory(directory){
    if(this.ignore) return this;

    let destination = getUploadPath(directory);
    if(!fs.existsSync(destination)){
      fs.mkdirSync(destination, { recursive: true});
    }

    return this.#changePath(destination, this.#filename);
  }

  /**
   * 파일의 이름을 수정한다
   * @param {string} filename 변경 파일명. 디렉토리가 포함될 시 에러
   * @see changeDirectory 디렉토리 변경시 사용
   */
  changeFilename(filename){
    if(this.ignore) return this;

    if(filename.match(/[/\\]/)) {
      throw new Error('폴더 변경은 changeDirectory를 호출해 변경해야합니다.');
    }
    
    return this.#changePath(this.#destination, filename);
  }

  setExtensionFromOriginal(){
    return this.setExtension(path.extname(this.#originalname))
  }

  setExtension(ext){
    if(this.ignore) return this;
    if(ext && !ext.startsWith('.')){
      throw new Error(`확장자는 '.'문자로 시작해야 합니다.`);
    }
    let toExt = ext || '';
    let fromExt = path.extname(this.#filename);

    if(!fromExt && !toExt){
      // 원본, 현재 모두 확장자가 없을때
      return this;
    }

    let filename = this.#filename;
    if(fromExt){
      filename = filename.substring(0, filename.lastIndexOf('.'));
    }    
    if(!toExt){
      filename = `${filename}${toExt}`
    }

    return this.#changePath(this.#destination, filename);
  }

  /**
   * 파일을 삭제한다
   */
  remove() {
    if(this.ignore) return this;

    fs.unlinkSync(this.#path);
    this.#deleted = true;

    return this;
  }

  [util.inspect.custom](depth, options, inspect) {
    return {
      fieldname: this.fieldname,
      originalname: this.originalname,
      encoding: this.encoding,
      mimetype: this.mimetype,
      destination: this.destination,
      filename: this.filename,
      path: this.path,
      size: this.size,
      lock: this.lock,
      normalizedPath: this.normalizedPath,
      deleted: this.deleted,
      tempPath: this.tempPath,
      ignore: this.ignore,
    };
  }
}

/**
 * MulterFileHandler 배열 관리를 위한 클래스
 * @extends { Array<MulterFileHandler> }
 */
class MulterFileListHandler extends Array {
  /**
   * @param {(object|MulterFileHandler)[]} fileList 
   */
  constructor(fileList){
    super();
    if(!fileList) return;
    fileList.forEach(f=>this.push(f));
  }

  get lockedFiles() {
    return new MulterFileListHandler(this.filter(f=>f.lock));
  }

  get unlockedFiles() {
    return new MulterFileListHandler(this.filter(f=>!f.lock));
  }

  get deletedFiles() {
    return new MulterFileListHandler(this.filter(f=>f.deleted));
  }

  /**
   * 해당 필드명을 가지고 있는 모든 파일을 반환한다
   * @param {string} fieldname
   * @returns {MulterFileListHandler}
   */
  getFilesByFieldname(fieldname){
    return new MulterFileListHandler(this.filter(f=>f.fieldname === fieldname));
  }

  push(...args){    
    super.push(...args.map(file=> file instanceof MulterFileHandler ? file : new MulterFileHandler(file)));
  }

  /**
   * 모든 파일을 삭제
   */
  remove() {
    this.forEach(f=>f.remove());
  }

  /**
   * 모든 파일의 디렉토리를 변경
   * @param {string} directory 
   */
  changeAllFileDirectory(directory) {    
    this.forEach(f=>f.changeDirectory(directory));
  }

  /**
   * 모든 파일의 확장자를 원본 파일명의 확장자로 변경
   */
  setAllFileExtensionFromOriginal(){
    this.forEach(f=>f.setExtensionFromOriginal());
  }

  /**
   * 모든 파일의 확장자를 변경
   * @param {string} ext .문자로 시작하는 확장자
   */
  setAllFileExtension(ext){
    this.forEach(f=>f.setExtension(ext));
  }
}

module.exports = {
  getUploadPath,
  getRelativePath,
  getNormalizedPath,
  uploader,
  MulterFileHandler,
  MulterFileListHandler,
  removeFile,
  getPathFromNormalizedPath
};
