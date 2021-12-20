/**
 * Refs:
 * - Download OpenCV: https://docs.opencv.org/4.x/d0/d84/tutorial_js_usage.html
 * - OpenCV NodeJS: https://docs.opencv.org/4.x/dc/de6/tutorial_js_nodejs.html
 * - OpenCV wrapper for NodeJS: https://github.com/uho1896/opencv
 */
const { Canvas, createCanvas, Image, ImageData, loadImage } = require('canvas')
const { JSDOM } = require('jsdom')
const { writeFile, mkdirSync, existsSync } = require('fs')

function installDOM() {
  const dom = new JSDOM();
  global.document = dom.window.document;
  global.Image = Image;
  global.HTMLCanvasElement = Canvas;
  global.ImageData = ImageData;
  global.HTMLImageElement = Image;
}

/**
 * Loads opencv.js.
 *
 * Installs HTML Canvas emulation to support `cv.imread()` and `cv.imshow`
 *
 * Mounts given local folder `localRootDir` in emscripten filesystem folder `rootDir`. By default it will mount the local current directory in emscripten `/work` directory. This means that `/work/foo.txt` will be resolved to the local file `./foo.txt`
 * @param {string} rootDir The directory in emscripten filesystem in which the local filesystem will be mount.
 * @param {string} localRootDir The local directory to mount in emscripten filesystem.
 * @returns {Promise} resolved when the library is ready to use.
 */
exports.loadOpenCV = (rootDir = '/work', localRootDir = process.cwd()) => {
  if (global.Module && global.Module.onRuntimeInitialized && global.cv && global.cv.imread) {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    installDOM()
    global.Module = {
      onRuntimeInitialized() {
        // We change emscripten current work directory to 'rootDir' so relative paths are resolved
        // relative to the current local folder, as expected
        cv.FS.chdir(rootDir)
        resolve()
      },
      preRun() {
        // preRun() is another callback like onRuntimeInitialized() but is called just before the
        // library code runs. Here we mount a local folder in emscripten filesystem and we want to
        // do this before the library is executed so the filesystem is accessible from the start
        const FS = global.Module.FS
        // create rootDir if it doesn't exists
        if (!FS.analyzePath(rootDir).exists) {
          FS.mkdir(rootDir);
        }
        // create localRootFolder if it doesn't exists
        if (!existsSync(localRootDir)) {
          mkdirSync(localRootDir, { recursive: true });
        }
        // FS.mount() is similar to Linux/POSIX mount operation. It basically mounts an external
        // filesystem with given format, in given current filesystem directory.
        FS.mount(FS.filesystems.NODEFS, { root: localRootDir }, rootDir);
      }
    };

    global.cv = require('./libs/opencv_4.5.4.js');
  });
}

exports.imread = async (imgPath) => {
  if (!cv.imread) {
    await loadOpenCV();
  }
  const image = await loadImage(imgPath);
  return cv.imread(image);
}

exports.imwrite = async (fn, src, opts = {}) => {
  if (!cv.imshow) {
    await loadOpenCV();
  }
  const format = opts.format || 'image/png';
  const flag = opts.flag || 'w+';
  const canvas = createCanvas(src.size().width, src.size().height);
  cv.imshow(canvas, src);

  return new Promise((resolve, reject) => {
    writeFile(fn, canvas.toBuffer(format), { flag }, (err) => {
      if (err) {
        return reject(err);
      }

      return resolve();
    });
  });
}
