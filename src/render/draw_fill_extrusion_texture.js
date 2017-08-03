// @flow

const Buffer = require('../data/buffer');
const VertexArrayObject = require('./vertex_array_object');
const PosArray = require('../data/pos_array');
const mat4 = require('@mapbox/gl-matrix').mat4;

import type Painter from './painter';
import type SourceCache from '../source/source_cache';
import type StyleLayer from '../style/style_layer';
import type TileCoord from '../source/tile_coord';

module.exports = draw;

function draw(painter: Painter, layer: StyleLayer, texture: WebGLTexture) {
	const gl = painter.gl;
    const program = painter.useProgram('extrusionTexture');

    gl.disable(gl.STENCIL_TEST);
    gl.disable(gl.DEPTH_TEST);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.uniform1f(program.u_opacity, layer.paint['fill-extrusion-opacity']);
    gl.uniform1i(program.u_image, 0);

    const matrix = mat4.create();
    mat4.ortho(matrix, 0, painter.width, painter.height, 0, 0, 1);
    gl.uniformMatrix4fv(program.u_matrix, false, matrix);

    gl.uniform2f(program.u_world, gl.drawingBufferWidth, gl.drawingBufferHeight);

    const array = new PosArray();
    array.emplaceBack(0, 0);
    array.emplaceBack(1, 0);
    array.emplaceBack(0, 1);
    array.emplaceBack(1, 1);
    const buffer = Buffer.fromStructArray(array, Buffer.BufferType.VERTEX);

    const vao = new VertexArrayObject();
    vao.bind(gl, program, buffer);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}