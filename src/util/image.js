// @flow

const {document} = require('./window');
const assert = require('assert');

export type Size = {
    width: number,
    height: number
};

function getImageData(img: CanvasImageSource): ImageData {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('failed to create canvas 2d context');
    }
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0, img.width, img.height);
    return context.getImageData(0, 0, img.width, img.height);
}

type Point = {
    x: number,
    y: number
};

function createImage({width, height}: Size, channels: number) {
    return {
        width,
        height,
        data: new Uint8ClampedArray(width * height * channels)
    };
}

function resizeImage(image: *, {width, height}: Size, channels: number) {
    if (width === image.width && height === image.height) {
        return image;
    }
    return copyImage(image, createImage({width, height}, channels), {x: 0, y: 0}, {x: 0, y: 0}, {
        width: Math.min(image.width, width),
        height: Math.min(image.height, height)
    }, channels);
}

/**
 * Copy the rectangle of image data specified by `srcPt` and `size` from `src` to the
 * rectangle of the same size at `pt` in `dst`. If the specified bounds exceed the bounds
 * of the source or destination, throw `std::out_of_range`. Must not be used to move data
 * within a single Image.
 * @private
 */
function copyImage(srcImg: *, dstImg: *, srcPt: Point, dstPt: Point, size: Size, channels: number): any {
    if (size.width === 0 || size.height === 0) {
        return dstImg;
    }

    if (size.width > srcImg.width ||
        size.height > srcImg.height ||
        srcPt.x > srcImg.width - size.width ||
        srcPt.y > srcImg.height - size.height) {
        throw new RangeError("out of range source coordinates for image copy");
    }

    if (size.width > dstImg.width ||
        size.height > dstImg.height ||
        dstPt.x > dstImg.width - size.width ||
        dstPt.y > dstImg.height - size.height) {
        throw new RangeError("out of range destination coordinates for image copy");
    }

    const srcData = srcImg.data;
    const dstData = dstImg.data;

    assert(srcData !== dstData);

    for (let y = 0; y < size.height; y++) {
        const srcOffset = ((srcPt.y + y) * srcImg.width + srcPt.x) * channels;
        const dstOffset = ((dstPt.y + y) * dstImg.width + dstPt.x) * channels;
        for (let i = 0; i < size.width * channels; i++) {
            dstData[dstOffset + i] = srcData[srcOffset + i];
        }
    }

    return dstImg;
}

// Not premultiplied, because ImageData is not premultiplied.
// UNPACK_PREMULTIPLY_ALPHA_WEBGL must be used when uploading to a texture.
class RGBAImage {
    width: number;
    height: number;
    data: Uint8ClampedArray;

    static create(size: Size): RGBAImage {
        return (createImage(size, 4): any);
    }

    static resize(image: RGBAImage, size: Size): RGBAImage {
        return (resizeImage(image, size, 4): any);
    }

    static copy(srcImg: RGBAImage | ImageData, dstImg: RGBAImage, srcPt: Point, dstPt: Point, size: Size) {
        return (copyImage(srcImg, dstImg, srcPt, dstPt, size, 4): any);
    }
}

class AlphaImage {
    width: number;
    height: number;
    data: Uint8ClampedArray;

    static create(size: Size): AlphaImage {
        return (createImage(size, 1): any);
    }

    static resize(image: AlphaImage, size: Size): AlphaImage {
        return (resizeImage(image, size, 1): any);
    }

    static copy(srcImg: AlphaImage, dstImg: AlphaImage, srcPt: Point, dstPt: Point, size: Size) {
        return (copyImage(srcImg, dstImg, srcPt, dstPt, size, 1): any);
    }
}

module.exports = {
    getImageData,
    RGBAImage,
    AlphaImage
};
