// @flow

const {ResourceType, getJSON, getImage} = require('../util/ajax');
const {devicePixelRatio} = require('../util/browser');
const {normalizeSpriteURL} = require('../util/mapbox');
const {RGBAImage} = require('../util/image');

import type {StyleImage} from './style_image';
import type {RequestTransformFunction} from '../ui/map';

module.exports = function(baseURL: ?string,
                          transformRequestCallback: RequestTransformFunction,
                          callback: Callback<{[string]: StyleImage}>) {
    if (!baseURL) {
        callback(null, {});
        return;
    }

    let json: any, image, error;
    const format = devicePixelRatio > 1 ? '@2x' : '';

    getJSON(transformRequestCallback(normalizeSpriteURL(baseURL, format, '.json'), ResourceType.SpriteJSON), (err, data) => {
        if (!error) {
            error = err;
            json = data;
            maybeComplete();
        }
    });

    getImage(transformRequestCallback(normalizeSpriteURL(baseURL, format, '.png'), ResourceType.SpriteImage), (err, img) => {
        if (!error) {
            error = err;
            image = img;
            maybeComplete();
        }
    });

    function maybeComplete() {
        if (error) {
            callback(error);
        } else if (json && image) {
            const result = {};

            for (const id in json) {
                const {width, height, x, y, sdf, pixelRatio} = json[id];
                const data = RGBAImage.create({width, height});
                RGBAImage.copy(image, data, {x, y}, {x: 0, y: 0}, {width, height});
                result[id] = {data, pixelRatio, sdf};
            }

            callback(null, result);
        }
    }
};
