const Inkscape = require('inkscape');
const path = require("path");
const recursive = require("recursive-readdir")
const { resolve } = require('path');
const { Transform } = require('stream')
const async = require("async");
const { promisify } = require('util');
const fs = require('fs');
const readFileAsync = promisify(fs.readFile);

// filePath is argument you passed in command 'node index.js <file_or_directory_name>'
const filePath = process.argv[2];

(function() {
  fs.lstat(filePath, (err, stats) => {
    if (err)
      return console.log(err); //Handle error
    if (stats.isFile()) {
      console.log('PROCESSING FILE========= ');
      convertFile(filePath);
    } else if (stats.isDirectory()) {
      console.log('PROCESSING DIRECTORY========= ')
      recursive(filePath, ["foo.cs", "*.html", "*.jpg", "*.png", "*.svg"], function(err, files) {
        const numPromise = async.mapLimit(files, 1, async function(filePath) {
          return convertFile(filePath);
        })
        return numPromise.then((result) => console.log(result)).catch(() => {})
      })
    }
  });
})()

const isValidFileSize = (file) => {
  return fs.statSync(file)["size"] < 4000000;
}

const isValidFile = ext => {
  let allowed_ext = ['.pdf'];
  return allowed_ext.includes(ext);
}

const stripText = function(str) {
  // removes <Text> tags in the SVG - optional
  str = str.replace(/<text[\s\S]+?<\/text>/g, '');
  return str;
}

const convertFile = filePath => {
  try {
    let file = path.parse(filePath)
    if (isValidFile(file.ext) && isValidFileSize(filePath)) {
      new Promise((resolve, reject) => {
        const inkscape = new Inkscape([
          '--export-text-to-path',
          '--export-plain-svg',
          '--export-area-drawing',
          '--import-pdf'
        ]);

        const outputSVG = filePath + '.svg'; // Remove original file extention.

        const SvgStream = fs.createWriteStream(outputSVG);

        const removeTextTags = new Transform({
          transform: (chunk, encoding, done) => {
            var data = stripText(chunk.toString())
            done(null, data)
          }
        })

        fs.createReadStream(filePath).pipe(inkscape).pipe(removeTextTags).pipe(SvgStream)

        SvgStream.on("finish", function() {
          console.log(`FINISHED - ${filePath}`);
          resolve();
        });
      });
      return file;
    }
  } catch (e) {
    console.log(e);
  }
}
