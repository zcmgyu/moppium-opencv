const { loadOpenCV, imwrite, imread } = require('../index.js');
const path = require('path');

async function main() {
  await loadOpenCV();

  const src = await imread(path.join(__dirname, './imageCanvasInput.png'));
  const templ = await imread(path.join(__dirname, './templateCanvasInput.png'));
  const dst = new cv.Mat();
  const mask = new cv.Mat();
  cv.matchTemplate(src, templ, dst, cv.TM_CCOEFF, mask);
  const result = cv.minMaxLoc(dst, mask);
  const maxPoint = result.maxLoc;
  const color = new cv.Scalar(255, 0, 0, 255);
  const point = new cv.Point(maxPoint.x + templ.cols, maxPoint.y + templ.rows);
  cv.rectangle(src, maxPoint, point, color, 2, cv.LINE_8, 0);

  await imwrite(path.join(__dirname, './outMatch.png'), src);

  src.delete();
  dst.delete();
  mask.delete();
};

main();