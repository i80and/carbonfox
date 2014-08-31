TARGETS=js/bundle.min.js
.PHONY: $(TARGETS)

JSQRCODE_SRC=src/deps/jsqrcode/src/grid.js src/deps/jsqrcode/src/version.js src/deps/jsqrcode/src/detector.js src/deps/jsqrcode/src/formatinf.js src/deps/jsqrcode/src/errorlevel.js src/deps/jsqrcode/src/bitmat.js src/deps/jsqrcode/src/datablock.js src/deps/jsqrcode/src/bmparser.js src/deps/jsqrcode/src/datamask.js src/deps/jsqrcode/src/rsdecoder.js src/deps/jsqrcode/src/gf256poly.js src/deps/jsqrcode/src/gf256.js src/deps/jsqrcode/src/decoder.js src/deps/jsqrcode/src/qrcode.js src/deps/jsqrcode/src/findpat.js src/deps/jsqrcode/src/alignpat.js src/deps/jsqrcode/src/databr.js

all: $(TARGETS)

js/bundle.min.js: $(JSQRCODE_SRC) js/bundle.js
	./node_modules/.bin/uglifyjs $^ --screw-ie8 -c "warnings=false" -b -o $@

js/bundle.js: src/*.js
	./node_modules/.bin/browserify src/main.js -o $@ -d

check:
	./node_modules/.bin/jshint src/ --exclude src/deps

run:
	python3 -m http.server || python2 -m SimpleHTTPServer || python -m SimpleHTTPServer

clean:
	rm -f js/bundle.min.js js/bundle.js
