// @flow

const jsdom = require('jsdom');
const gl = require('gl');
const sinon = require('sinon');
const util = require('./util');

function restore(): Window {
    // Remove previous window from module.exports
    const previousWindow = module.exports;
    if (previousWindow.close) previousWindow.close();
    for (const key in previousWindow) {
        if (previousWindow.hasOwnProperty(key)) {
            delete previousWindow[key];
        }
    }

    // Create new window and inject into module.exports
    const window = jsdom.jsdom(undefined, {
        // Send jsdom console output to the node console object.
        virtualConsole: jsdom.createVirtualConsole().sendTo(console)
    }).defaultView;

    window.devicePixelRatio = 1;

    window.requestAnimationFrame = function(callback) {
        return setImmediate(callback, 0);
    };
    window.cancelAnimationFrame = clearImmediate;

    // Add webgl context with the supplied GL
    const originalGetContext = window.HTMLCanvasElement.prototype.getContext;
    window.HTMLCanvasElement.prototype.getContext = function (type, attributes) {
        if (type === 'webgl') {
            if (!this._webGLContext) {
                this._webGLContext = gl(this.width, this.height, attributes);
            }
            return this._webGLContext;
        }
        // Fallback to existing HTMLCanvasElement getContext behaviour
        return originalGetContext.call(this, type, attributes);
    };

    window.useFakeHTMLCanvasGetContext = function() {
        this.HTMLCanvasElement.prototype.getContext = sinon.stub().returns('2d');
    };

    window.useFakeXMLHttpRequest = function() {
        sinon.xhr.supportsCORS = true;
        this.server = sinon.fakeServer.create();
        this.XMLHttpRequest = this.server.xhr;
    };

    window.URL.revokeObjectURL = function () {};

    window.restore = restore;

    window.ImageData = window.ImageData || function (...args) {
        if (args.length === 3) {
            this.data = args[0];
            this.width = args[1];
            this.height = args[2];
        } else {
            this.width = args[0];
            this.height = args[1];
            this.data = new Uint8ClampedArray(this.width * this.height * 4);
        }
    };

    util.extend(module.exports, window);

    return window;
}

module.exports = restore();
