.PHONY: all build/js/app.min.js build/js/app.js check clean

all: build/js/app.min.js
	install src/deps/*.js build/js/
	install src/crypto_worker.js build/js/
	rsync -ra --delete style/ build/style
	rsync -ra --delete partials/ build/partials
	cp index.html build/
	cp manifest.webapp build/

build/js/app.min.js: build/js/app.js
	cp build/js/app.js build/js/app.min.js
	# ./node_modules/.bin/uglifyjs --screw-ie8 js/app.js > js/app.min.js

build/js/app.js:
	mkdir -p build/js
	./node_modules/.bin/browserify -d -o build/js/app.js -e src/app.js src/controllers.js -t [ babelify --blacklist es6.forOf --sourceMapRelative . ]

check: src/*.js
	./node_modules/.bin/jshint --verbose $^

clean:
	$(RM) -r build/*
