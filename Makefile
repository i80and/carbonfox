# Prohibit the for-of transformation; all versions of FirefoxOS that we target
# support it, and the transformation requires a Symbol polyfill.
TRANSFORM_BLACKLIST=es6.forOf

.PHONY: all check clean

all: build/js/app.min.js
	install src/deps/*.js build/js/
	install src/crypto_worker.js build/js/
	rsync -ra --delete style/ build/style
	rsync -ra --delete dicts/ build/dicts
	rsync -ra --delete locales/ build/locales
	cp index.html build/
	cp manifest.webapp build/

build/js/app.min.js: build/js/app.js
	 cp build/js/app.js build/js/app.min.js
	#./node_modules/.bin/uglifyjs --screw-ie8 build/js/app.js > build/js/app.min.js

build/js/app.js: src/*.js
	mkdir -p build/js
	./node_modules/.bin/browserify -d -o build/js/app.js -e src/app.js -t [ babelify --blacklist $(TRANSFORM_BLACKLIST) --sourceMapRelative . ]

check:
	./node_modules/.bin/jshint --verbose src/*.js

clean:
	$(RM) -r build/*
