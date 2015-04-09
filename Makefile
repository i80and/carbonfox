# Prohibit the for-of transformation; all versions of FirefoxOS that we target
# support it, and the transformation requires a Symbol polyfill.
TRANSFORM_BLACKLIST=es6.forOf,regenerator

.PHONY: all check clean

all: build/js/app.min.js build/js/crypto_worker.min.js
	install src/deps/*.js build/js/
	rsync -ra --delete style/ build/style
	rsync -ra --delete dicts/ build/dicts
	rsync -ra --delete locales/ build/locales
	cp index.html build/
	cp manifest.webapp build/

build/js/%.min.js: build/js/%.js
	cp $^ $@
	# ./node_modules/.bin/uglifyjs --screw-ie8 $^ > $@

build/js/app.js: src/*.js
	mkdir -p build/js
	./node_modules/.bin/browserify -d -o $@ -e src/app.js -t [ babelify --blacklist $(TRANSFORM_BLACKLIST) --sourceMapRelative . ]

build/js/crypto_worker.js: src/crypto_worker.js
	mkdir -p build/js
	./node_modules/.bin/babel --blacklist $(TRANSFORM_BLACKLIST) $^ > $@

check:
	./node_modules/.bin/jshint --verbose src/*.js

clean:
	$(RM) -r build/*
