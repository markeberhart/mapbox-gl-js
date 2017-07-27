// @flow

const {normalizeGlyphsURL} = require('../util/mapbox');
const {ResourceType, getArrayBuffer} = require('../util/ajax');
const Protobuf = require('pbf');

import type {StyleGlyph} from './style_glyph';
import type {RequestTransformFunction} from '../ui/map';

function readFontstacks(tag, glyphs, pbf) {
    if (tag === 1) {
        pbf.readMessage(readFontstack, glyphs);
    }
}

function readFontstack(tag, glyphs, pbf) {
    if (tag === 3) {
        const glyph = pbf.readMessage(readGlyph, ({metrics: {}}: Object));
        glyphs[glyph.id] = glyph;
    }
}

function readGlyph(tag, glyph, pbf) {
    if (tag === 1) glyph.id = pbf.readVarint();
    else if (tag === 2) glyph.bitmap = pbf.readBytes();
    else if (tag === 3) glyph.metrics.width = pbf.readVarint();
    else if (tag === 4) glyph.metrics.height = pbf.readVarint();
    else if (tag === 5) glyph.metrics.left = pbf.readSVarint();
    else if (tag === 6) glyph.metrics.top = pbf.readSVarint();
    else if (tag === 7) glyph.metrics.advance = pbf.readVarint();
}

module.exports = function (fontstack: string,
                           range: number,
                           urlTemplate: string,
                           transformRequestCallback: RequestTransformFunction,
                           callback: Callback<{[number]: StyleGlyph | null}>) {
    const begin = range * 256;
    const end = begin + 255;

    const request = this.transformRequestCallback(
        normalizeGlyphsURL(urlTemplate)
            .replace('{fontstack}', fontstack)
            .replace('{range}', `${begin}-${end}`),
        ResourceType.Glyphs);

    getArrayBuffer(request, (err, response) => {
        if (err) {
            callback(err);
        } else if (response) {
            const glyphs = {};

            // Missing glyphs must be represented with nulls, so prefill the entire range
            // and then let glyphs present in the response overwrite the null values.
            for (let i = begin; i <= end; i++) {
                glyphs[i] = null;
            }

            new Protobuf(response.data)
                .readFields(readFontstacks, glyphs);

            callback(null, glyphs);
        }
    });
};
