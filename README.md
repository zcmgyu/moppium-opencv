# Introduction

## What is OpenCV.JS?

OpenCV library is written in C++ and the file `opencv.js` is just that C++ code being translated to JavaScript or WebAssembly by `emscripten` C++ compiler.

## What is this module?

These C++ sources use standard APIs to access the filesystem and the implementation often ends up in system calls that read a file in the hard drive. Since JavaScript applications in the browser don't have access to the local filesystem, `emscripten` emulates a standard filesystem so compiled C++ code works out of the box.

In the browser, this filesystem is emulated in memory while in Node.js there's also the possibility of using the local filesystem directly. This is often preferable since there's no need of copy file's content in memory. This module is to configure `emscripten` so files are accessed directly from our local filesystem and relative paths match files relative to the current local directory as expected.

# APIs usage

- `loadOpenCV`: Loads OpenCV.JS. `cv` instance is available in global scope. Installs HTML Canvas emulation to support `cv.imread()` and `cv.imshow`

- `imwrite`: Save an image to any storage device. If `cv` instance is not in global scope, `loadOpenCV` will be called.

- `imread`: Load image from specific file. If `cv` instance is not in global scope, `loadOpenCV` will be called.

# Example

``` bash
yarn add moppium-opencv
```

``` javascript
const { loadOpenCV, imwrite, imread } = require('moppium-opencv');
const path = require('path');

(async () => {
  await loadOpenCV();

  const src = await imread(path.join(__dirname, './source_image.png'));
  const templ = await imread(path.join(__dirname, './template_image.png'));
  const dst = new cv.Mat();
  const mask = new cv.Mat();
  cv.matchTemplate(src, templ, dst, cv.TM_CCOEFF, mask);
  const result = cv.minMaxLoc(dst, mask);
  const maxPoint = result.maxLoc;
  const color = new cv.Scalar(255, 0, 0, 255);
  const point = new cv.Point(maxPoint.x + templ.cols, maxPoint.y + templ.rows);
  cv.rectangle(src, maxPoint, point, color, 2, cv.LINE_8, 0);

  await imwrite(path.join(__dirname, './output.png'), src);

  src.delete();
  dst.delete();
  mask.delete();
})();
```

# References

- [Download OpenCV](https://docs.opencv.org/4.x/d0/d84/tutorial_js_usage.html)
- [OpenCV NodeJS](https://docs.opencv.org/4.x/dc/de6/tutorial_js_nodejs.html)
- [OpenCV wrapper for NodeJS](https://github.com/uho1896/opencv)